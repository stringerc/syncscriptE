/**
 * Agent loop — the reasoning core for one agent_run.
 *
 * Loop:
 *   1. Open Playwright browser (one Chromium per run).
 *   2. Repeat until done / cancelled / step cap:
 *        a. Check for cancel + new user_interjection messages.
 *        b. Take a screenshot.
 *        c. Build a multimodal LLM prompt: goal + history + screenshot + tool defs.
 *        d. Call the LLM (NVIDIA NIM by default, BYOK if the user has one).
 *        e. Parse: tool_calls (browser action OR SyncScript tool OR finish).
 *        f. Pass each through the safety gate (tier + blocked sites).
 *        g. Execute or pause (waiting_user) or block.
 *        h. Record agent_run_steps row.
 *   3. Mark complete via complete_agent_run RPC.
 *
 * Tool surfaces given to the LLM:
 *   browser_action(action: 'goto'|'click'|'type'|'press'|'scroll'|'wait'|'extract_text', ...)
 *   speak_to_user(text)               — friendly status update
 *   request_user_approval(reason)     — for destructive things in Tier-C
 *   finish(summary)                   — terminal call
 *   create_task / add_to_resource_library / create_document / add_note   — bridged to Nexus
 */
import { resolveLLMConfig, chatCompletion, estimateCostCents, supportsVision } from './llm.mjs';
import { launchBrowser, newPage, executeBrowserAction, currentUrl, captureStorageState } from './browser.mjs';
import { gate } from './safety.mjs';
import { executeSyncScriptTool, SYNCSCRIPT_TOOL_SCHEMAS } from './syncscript-tools.mjs';

const MAX_STEPS_DEFAULT = 25;
const MAX_PROMPT_HISTORY = 12;

const BROWSER_TOOL = {
  type: 'function',
  function: {
    name: 'browser_action',
    description:
      'Drive a real Chromium browser. Prefer extract_links / extract_text over click when possible — many tasks (gathering URLs, finding images, reading content) need no clicks at all. Use coordinates from the screenshot (1280x800) only when you actually need to click.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['goto', 'click', 'type', 'press', 'scroll', 'wait', 'extract_text', 'extract_links', 'screenshot'],
        },
        url: { type: 'string', description: 'For goto. Must start with https://.' },
        x: { type: 'number', description: 'For click. Pixel x in screenshot.' },
        y: { type: 'number', description: 'For click. Pixel y.' },
        text: { type: 'string', description: 'For type.' },
        clear: { type: 'boolean', description: 'For type. Clear field first.' },
        key: { type: 'string', description: 'For press, e.g. Enter.' },
        dy: { type: 'number', description: 'For scroll. Positive scrolls down.' },
        ms: { type: 'number', description: 'For wait. Capped at 10000.' },
        filter: { type: 'string', enum: ['a', 'img', 'all'], description: 'For extract_links: which kind to return.' },
        max: { type: 'number', description: 'For extract_links: max items to return (default 30, hard cap 200).' },
        label: { type: 'string', description: 'Optional human label (helps safety check).' },
      },
      required: ['action'],
    },
  },
};

const SPEAK_TOOL = {
  type: 'function',
  function: {
    name: 'speak_to_user',
    description: 'Friendly status update or question for the user. Goes to chat + TTS if voice mode.',
    parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
  },
};

const APPROVAL_TOOL = {
  type: 'function',
  function: {
    name: 'request_user_approval',
    description: 'Pause and ask the user before doing a destructive action (Tier-C only).',
    parameters: { type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] },
  },
};

const FINISH_TOOL = {
  type: 'function',
  function: {
    name: 'finish',
    description: 'Terminal — the goal is complete. Provide a 1–3 sentence summary.',
    parameters: { type: 'object', properties: { summary: { type: 'string' } }, required: ['summary'] },
  },
};

const SYSTEM_PROMPT = ({ tier, trustedSites, blockedSites }) => `You are Nexus Agent Mode, a careful assistant that drives a real headless Chromium browser on behalf of the user.

You will receive screenshots after each browser action. You can also call SyncScript tools (create_task, add_to_resource_library, create_document, add_note) when the user asks to save things to their account.

POLICY (this run):
- Tier: ${tier} (A=read-only, B=read+scoped writes, C=writes with approval, D=full autonomy on whitelist)
- Trusted sites for autonomy: ${trustedSites.join(', ') || 'none'}
- Blocked sites: ${blockedSites.join(', ') || 'none'}

Rules:
- Always start by reasoning briefly (1 sentence) about the next action.
- For collection tasks (find images / find links / list articles), use extract_links — DO NOT click on each result. extract_links returns image URLs and anchor URLs in one call; pass them straight to add_to_resource_library / create_task.
- Before clicking destructive labels (Submit, Pay, Delete, Confirm, Buy, Send), call request_user_approval first if you're not Tier-D on a trusted site.
- Use create_task / add_to_resource_library when the user asks to save things — don't try to recreate that as browser actions.
- If a browser_action returns an error like "tier_X_disallows:Y", do NOT retry the same action — try a different approach (extract_links instead of click, etc.) or call speak_to_user explaining the limit and finish.
- When done, call finish(summary).
- Hard caps: max ${MAX_STEPS_DEFAULT} steps; if you can't make progress, finish with a short failure summary.`;

function compactHistory(history) {
  return history.slice(-MAX_PROMPT_HISTORY);
}

export async function runAgentLoop({ run, sb }) {
  const userId = run.user_id;
  const goal = run.goal_text;
  const tier = run.tier_at_start || 'A';

  const policyRow = await sb.from('automation_policies').select('*').eq('user_id', userId).maybeSingle();
  const policy = policyRow.data || { tier, trusted_sites: [], blocked_sites: [], per_run_step_cap: MAX_STEPS_DEFAULT, per_run_cost_cents_cap: 1000 };
  const stepCap = Math.min(MAX_STEPS_DEFAULT, policy.per_run_step_cap || MAX_STEPS_DEFAULT);

  let cfg;
  try {
    cfg = await resolveLLMConfig(userId);
  } catch (e) {
    await sb.rpc('complete_agent_run', {
      p_run_id: run.id, p_status: 'failed', p_summary: null,
      p_error_text: `llm_config_failed: ${e?.message || e}`, p_total_cost_cents: 0,
    });
    return { outcome: 'failed', stepsExecuted: 0, totalCostCents: 0 };
  }

  await sb.from('agent_runs').update({ provider: cfg.provider, model: cfg.model }).eq('id', run.id);

  // Try to hydrate the user's persistent browser context (Gmail/etc. cookies).
  // Failures are non-fatal — agent just runs in a blank session.
  let storageState = null;
  try {
    const res = await sb.rpc('admin_load_browser_context', { p_user_id: userId });
    if (!res.error && typeof res.data === 'string' && res.data.length > 8) {
      storageState = res.data;
    }
  } catch (e) {
    console.warn('[runner] load storageState failed (non-fatal):', e?.message || e);
  }

  let browser, page, ctx;
  try {
    browser = await launchBrowser();
    const launched = await newPage(browser, storageState ? { storageState } : {});
    page = launched.page; ctx = launched.ctx;
  } catch (e) {
    await sb.rpc('complete_agent_run', {
      p_run_id: run.id, p_status: 'failed', p_summary: null,
      p_error_text: `browser_launch_failed: ${e?.message || e}`, p_total_cost_cents: 0,
    });
    return { outcome: 'failed', stepsExecuted: 0, totalCostCents: 0 };
  }

  const history = [
    { role: 'system', content: SYSTEM_PROMPT({ tier, trustedSites: policy.trusted_sites || [], blockedSites: policy.blocked_sites || [] }) },
    { role: 'user', content: `Goal: ${goal}` },
  ];

  let stepsExecuted = 0;
  let totalCostCents = 0;
  let outcome = 'failed';
  let summary = null;
  let waitingApproval = false;
  // Bail out quickly if the model can't emit structured tool calls — common
  // failure for non-FC-tuned free models. Three thoughts in a row → abort.
  let consecutiveNoToolTurns = 0;
  const MAX_NO_TOOL_TURNS = 3;
  // Bail if the safety gate keeps blocking the same kind of action — the
  // user's tier doesn't allow it; looping just burns cost. After N=3 same
  // gate-blocks, fail with an actionable error message.
  let lastBlockReason = '';
  let consecutiveSameBlocks = 0;
  const MAX_REPEAT_BLOCKS = 3;
  // Bail if the model calls the SAME action with the SAME args N=4 times in a
  // row — usually means the model isn't reading the result content. We emit
  // a strong nudge at N=3 then abort at N=4.
  let lastActionKey = '';
  let consecutiveSameAction = 0;
  const MAX_REPEAT_ACTION = 3;
  let abortRun = false;

  try {
    for (let step = 0; step < stepCap; step += 1) {
      // 1. Check cancel + interjections
      const refreshed = await sb.from('agent_runs').select('cancel_requested, status').eq('id', run.id).maybeSingle();
      if (refreshed.data?.cancel_requested) { outcome = 'cancelled'; break; }

      const { data: pendingMsgs } = await sb.rpc('pending_agent_messages', { p_run_id: run.id });
      if (Array.isArray(pendingMsgs) && pendingMsgs.length > 0) {
        for (const m of pendingMsgs) {
          if (waitingApproval && (m.content === '__APPROVED__' || m.content === '__DECLINED__')) {
            history.push({ role: 'user', content: m.content === '__APPROVED__' ? 'I approve. Proceed.' : 'Cancel that.' });
            waitingApproval = false;
            await sb.from('agent_runs').update({ status: 'running', pause_reason: null }).eq('id', run.id);
          } else {
            history.push({ role: 'user', content: `[user, mid-run]: ${m.content}` });
          }
        }
      }

      if (waitingApproval) {
        await sleep(2500);
        continue;
      }

      // 2. Screenshot — ALWAYS capture so the user can watch the live agent
      // browser in the UI. The vision flag only controls whether we attach
      // it to the LLM prompt (text-only models can't see images, but the
      // human user always wants to see).
      const useVision = supportsVision(cfg.provider, cfg.model);
      const shot = await executeBrowserAction(page, { kind: 'screenshot' });
      const screenshotB64 = shot.ok ? shot.base64 : null;
      const seenUrl = await currentUrl(page);
      // For text-only models, give the model the page title and visible heading
      // text so it has something to reason from instead of a blind URL string.
      let domHint = '';
      if (!useVision) {
        try {
          const title = await page.title().catch(() => '');
          const headingHandle = await page.locator('h1,h2').first().textContent({ timeout: 1500 }).catch(() => '');
          const heading = (headingHandle || '').trim().slice(0, 200);
          domHint = `\nPage title: ${title || '(none)'}\nFirst heading: ${heading || '(none)'}`;
        } catch { /* ignore */ }
      }

      const userTurn = {
        role: 'user',
        content: useVision
          ? [
              { type: 'text', text: `Current URL: ${seenUrl || 'about:blank'}\nWhat is the next single action?` },
              ...(screenshotB64 ? [{ type: 'image_url', image_url: { url: `data:image/png;base64,${screenshotB64}` } }] : []),
            ]
          : `Current URL: ${seenUrl || 'about:blank'}${domHint}\nWhat is the next single action? Reply ONLY by calling exactly one tool.`,
      };

      // 3. LLM — force a tool call. Many free-tier models (NIM Llama 3.x,
      // Groq Llama) skip tool_calls under tool_choice:auto and respond with
      // prose. Forcing 'required' makes them emit at least one structured
      // call. Falls back to 'auto' once if 'required' is rejected.
      let resp;
      try {
        try {
          resp = await chatCompletion(cfg, {
            messages: [...compactHistory(history), userTurn],
            tools: [BROWSER_TOOL, SPEAK_TOOL, APPROVAL_TOOL, FINISH_TOOL, ...SYNCSCRIPT_TOOL_SCHEMAS],
            toolChoice: 'required',
            temperature: 0.2,
            maxTokens: 1024,
          });
        } catch (innerErr) {
          if (/tool_choice|required|400|invalid/i.test(String(innerErr?.message || ''))) {
            resp = await chatCompletion(cfg, {
              messages: [...compactHistory(history), userTurn],
              tools: [BROWSER_TOOL, SPEAK_TOOL, APPROVAL_TOOL, FINISH_TOOL, ...SYNCSCRIPT_TOOL_SCHEMAS],
              toolChoice: 'auto',
              temperature: 0.2,
              maxTokens: 1024,
            });
          } else {
            throw innerErr;
          }
        }
      } catch (e) {
        await sb.rpc('record_agent_step', {
          p_run_id: run.id, p_kind: 'error',
          p_payload: { phase: 'llm', error: String(e?.message || e).slice(0, 300) },
        });
        history.push({ role: 'system', content: `LLM error: ${String(e?.message || e).slice(0, 200)}. Retry with a simpler approach.` });
        continue;
      }

      const stepCost = estimateCostCents(cfg.provider, resp.usage);
      totalCostCents += stepCost;

      if (resp.content) {
        history.push({ role: 'assistant', content: resp.content });
        await sb.rpc('record_agent_step', {
          p_run_id: run.id, p_kind: 'thought',
          p_payload: { text: resp.content.slice(0, 1500) },
          p_screenshot_b64: screenshotB64,
          p_cost_cents: stepCost,
        });
      } else if (screenshotB64) {
        await sb.rpc('record_agent_step', {
          p_run_id: run.id, p_kind: 'screenshot', p_payload: { url: seenUrl },
          p_screenshot_b64: screenshotB64, p_cost_cents: stepCost,
        });
      }

      // 4. Process tool calls (or finish/no-op)
      if (!resp.toolCalls || resp.toolCalls.length === 0) {
        consecutiveNoToolTurns += 1;
        if (consecutiveNoToolTurns >= MAX_NO_TOOL_TURNS) {
          await sb.rpc('record_agent_step', {
            p_run_id: run.id, p_kind: 'error',
            p_payload: { phase: 'no_tool_calls', detail: `Model ${cfg.label} produced ${MAX_NO_TOOL_TURNS} consecutive turns without tool_calls. This usually means the model does not support function calling reliably. Switch to a different model (BYOK Anthropic / OpenAI / Gemini for vision, or NVIDIA NIM Llama 3.3 70B for text).` },
          });
          outcome = 'failed';
          summary = null;
          break;
        }
        history.push({ role: 'system', content: 'You MUST call exactly one tool now. Do not write a description. Call browser_action / finish / speak_to_user.' });
        continue;
      }
      consecutiveNoToolTurns = 0;

      let didFinish = false;
      for (const tc of resp.toolCalls) {
        let parsed = {};
        try { parsed = JSON.parse(tc.argumentsJson || '{}'); } catch { parsed = {}; }

        if (tc.name === 'finish') {
          summary = String(parsed.summary || 'Done.');
          outcome = 'done';
          didFinish = true;
          break;
        }

        if (tc.name === 'speak_to_user') {
          const text = String(parsed.text || '');
          await sb.rpc('record_agent_step', {
            p_run_id: run.id, p_kind: 'agent_message',
            p_payload: { text }, p_cost_cents: 0,
          });
          await sb.from('agent_run_messages').insert({ run_id: run.id, role: 'agent', content: text });
          history.push({ role: 'assistant', content: `(spoke to user: "${text}")`, tool_calls: [{ id: tc.id, type: 'function', function: { name: 'speak_to_user', arguments: tc.argumentsJson } }] });
          history.push({ role: 'tool', tool_call_id: tc.id, name: 'speak_to_user', content: 'ok' });
          continue;
        }

        if (tc.name === 'request_user_approval') {
          waitingApproval = true;
          await sb.from('agent_runs').update({ status: 'waiting_user', pause_reason: parsed.reason || 'user_approval' }).eq('id', run.id);
          await sb.rpc('record_agent_step', {
            p_run_id: run.id, p_kind: 'approval_request',
            p_payload: { reason: parsed.reason || 'destructive_action' }, p_cost_cents: 0,
          });
          history.push({ role: 'assistant', content: `(asked user to approve: ${parsed.reason})`, tool_calls: [{ id: tc.id, type: 'function', function: { name: 'request_user_approval', arguments: tc.argumentsJson } }] });
          history.push({ role: 'tool', tool_call_id: tc.id, name: 'request_user_approval', content: 'paused' });
          break;
        }

        if (tc.name === 'browser_action') {
          const action = parsed;
          // Safety gate
          const decision = gate({
            tier, action: { kind: action.action, ...action }, currentUrl: seenUrl,
            trustedSites: policy.trusted_sites || [], blockedSites: policy.blocked_sites || [],
          });
          if (decision.decision === 'block') {
            await sb.rpc('record_agent_step', {
              p_run_id: run.id, p_kind: 'error',
              p_payload: { phase: 'gate', reason: decision.reason, action }, p_cost_cents: 0,
            });
            history.push({ role: 'tool', tool_call_id: tc.id, name: 'browser_action', content: `BLOCKED: ${decision.reason}` });

            // Repeat-block tripwire: don't let the model loop forever.
            if (decision.reason === lastBlockReason) {
              consecutiveSameBlocks += 1;
            } else {
              lastBlockReason = decision.reason;
              consecutiveSameBlocks = 1;
            }
            if (consecutiveSameBlocks >= MAX_REPEAT_BLOCKS) {
              const tierMatch = /^tier_([A-D])_disallows:(\w+)/.exec(decision.reason);
              const help = tierMatch
                ? `Your automation tier ${tierMatch[1]} does not allow ${tierMatch[2]} actions. Raise the tier in Settings → Agent → Automation policy.`
                : `Action keeps being blocked by ${decision.reason}.`;
              await sb.rpc('record_agent_step', {
                p_run_id: run.id, p_kind: 'error',
                p_payload: { phase: 'repeat_block', reason: decision.reason, count: consecutiveSameBlocks, help },
              });
              outcome = 'failed';
              summary = `Stopped: ${decision.reason} ${consecutiveSameBlocks}x in a row. ${help}`;
              abortRun = true;
              break;
            }
            continue;
          }
          if (decision.decision === 'request_approval') {
            waitingApproval = true;
            await sb.from('agent_runs').update({ status: 'waiting_user', pause_reason: decision.reason }).eq('id', run.id);
            await sb.rpc('record_agent_step', {
              p_run_id: run.id, p_kind: 'approval_request',
              p_payload: { reason: decision.reason, action }, p_cost_cents: 0,
            });
            history.push({ role: 'tool', tool_call_id: tc.id, name: 'browser_action', content: `AWAITING USER: ${decision.reason}` });
            break;
          }

          // Execute
          let result;
          try {
            result = await executeBrowserAction(page, { kind: action.action, ...action });
          } catch (e) {
            result = { ok: false, error: String(e?.message || e).slice(0, 300) };
          }
          // Build a model-readable summary of the result. extract_text returns
          // `text`; extract_links returns `links` + `images`. Without this the
          // model sees "ok" with no data and loops on the same action.
          let modelContent;
          if (!result.ok) {
            modelContent = `failed: ${result.error || 'unknown'}`;
          } else if (action.action === 'extract_links') {
            const links = (result.links || []).slice(0, 25);
            const images = (result.images || []).slice(0, 25);
            const obj = { ok: true, links, images };
            modelContent = `ok: ${JSON.stringify(obj).slice(0, 4000)}`;
          } else if (action.action === 'extract_text') {
            modelContent = `ok: ${(result.text || '').slice(0, 4000)}`;
          } else if (action.action === 'goto') {
            modelContent = `ok: navigated`;
          } else if (action.action === 'click') {
            modelContent = `ok: clicked at ${result.at?.x},${result.at?.y}`;
          } else {
            modelContent = `ok`;
          }

          // Same-action repeat detector: if the model called the same action
          // (with the same key params) 3x in a row and the result didn't change,
          // it's stuck. Tell it explicitly + abort if it ignores us.
          const actionKey = `${action.action}:${action.url || ''}:${action.filter || ''}:${action.text || ''}`;
          if (actionKey === lastActionKey) {
            consecutiveSameAction += 1;
          } else {
            lastActionKey = actionKey;
            consecutiveSameAction = 1;
          }
          if (consecutiveSameAction === MAX_REPEAT_ACTION) {
            // Strong nudge before aborting on next repeat.
            history.push({ role: 'system', content: `You called ${action.action} ${MAX_REPEAT_ACTION} times in a row with the same arguments. Either use the data already returned, try a different action, or call finish().` });
          } else if (consecutiveSameAction > MAX_REPEAT_ACTION) {
            await sb.rpc('record_agent_step', {
              p_run_id: run.id, p_kind: 'error',
              p_payload: { phase: 'repeat_action', action: action.action, count: consecutiveSameAction },
            });
            outcome = 'failed';
            summary = `Stopped: called ${action.action} ${consecutiveSameAction} times without progress. Use the data from the first call or change approach.`;
            abortRun = true;
            break;
          }

          await sb.rpc('record_agent_step', {
            p_run_id: run.id, p_kind: 'browser_action',
            p_payload: {
              action,
              result: {
                ok: result.ok,
                error: result.error || null,
                at: result.at,
                key: result.key,
                ms: result.ms,
                dx: result.dx,
                dy: result.dy,
                // Light stats for UI; full data only goes to the model history.
                ...(action.action === 'extract_links' ? { link_count: (result.links || []).length, image_count: (result.images || []).length } : {}),
                ...(action.action === 'extract_text' ? { text_chars: (result.text || '').length } : {}),
              },
            },
            p_screenshot_b64: screenshotB64,
            p_cost_cents: 0,
          });
          history.push({ role: 'assistant', content: '', tool_calls: [{ id: tc.id, type: 'function', function: { name: 'browser_action', arguments: tc.argumentsJson } }] });
          history.push({ role: 'tool', tool_call_id: tc.id, name: 'browser_action', content: modelContent });
          stepsExecuted += 1;
          continue;
        }

        // SyncScript tool (create_task / add_to_resource_library / create_document / add_note)
        const ssRes = await executeSyncScriptTool({ userId, name: tc.name, argumentsJson: tc.argumentsJson });
        await sb.rpc('record_agent_step', {
          p_run_id: run.id, p_kind: 'tool_call',
          p_payload: { tool: tc.name, args: tc.argumentsJson, result: ssRes }, p_cost_cents: 0,
        });
        history.push({ role: 'assistant', content: '', tool_calls: [{ id: tc.id, type: 'function', function: { name: tc.name, arguments: tc.argumentsJson } }] });
        history.push({ role: 'tool', tool_call_id: tc.id, name: tc.name, content: JSON.stringify(ssRes).slice(0, 800) });
        stepsExecuted += 1;
      }

      if (didFinish || abortRun) break;

      // Per-run cost cap
      if (totalCostCents >= (policy.per_run_cost_cents_cap || 1000)) {
        outcome = 'failed';
        summary = 'Stopped: per-run cost cap reached.';
        break;
      }
    }

    if (outcome === 'failed' && !summary) summary = 'Stopped: max steps reached.';
  } finally {
    // Persist storageState (cookies, localStorage) so the next run starts
    // already logged in. Best-effort — failure here is non-fatal.
    try {
      if (ctx) {
        const captured = await captureStorageState(ctx);
        await sb.rpc('admin_save_browser_context', {
          p_user_id: userId,
          p_storage_json: captured.json,
          p_hostnames: captured.hostnames,
          p_cookie_count: captured.cookieCount,
        });
      }
    } catch (e) {
      console.warn('[runner] save storageState failed (non-fatal):', e?.message || e);
    }
    try { await ctx?.close(); } catch {}
    try { await browser?.close(); } catch {}
  }

  await sb.rpc('complete_agent_run', {
    p_run_id: run.id, p_status: outcome,
    p_summary: summary, p_error_text: null, p_total_cost_cents: totalCostCents,
  });

  return { outcome, stepsExecuted, totalCostCents };
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

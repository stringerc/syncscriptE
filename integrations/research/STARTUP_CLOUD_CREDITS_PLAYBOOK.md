# Startup cloud credits — AWS Activate, Google for Startups, Microsoft (Azure)

**Purpose:** One repo-local checklist so you (or a browser agent) can complete applications with consistent facts. **You must click Submit / Apply** — automated tools cannot legally attest on your behalf, and model catalogs change weekly.

**SyncScript (public facts — verify before paste):**

- **Product:** SyncScript — productivity + AI assistant (Nexus) for tasks, calendar, documents, voice; see live site **`https://www.syncscript.app`**.
- **Stack (high level):** Vite/React on Vercel, Supabase (Postgres + Edge functions), optional Oracle VM for agent runner / TTS paths per **`MEMORY.md`** / **`deploy/`** runbooks.
- **Inference today:** Platform LLM routing in **`api/_lib/ai-service.ts`** (default primary NVIDIA NIM when `AI_PROVIDER` unset; failover Groq / optional Anthropic, etc.). Agent Mode uses **`api/_lib/agent-llm-adapter.ts`** (BYOK first, else first available **platform** env key: `NVIDIA_API_KEY`, `GROQ_API_KEY`, …).

---

## 1. AWS Activate → Amazon Bedrock (and other AWS spend)

**Official apply / credits hub:** [AWS Activate Credits](https://aws.amazon.com/startups/credits)  
**Terms (read before accepting):** [AWS Activate Terms](https://aws.amazon.com/activate/terms/)

**What AWS states (high level — read the live page):**

- Tiers such as **Founders** (e.g. self-funded starter credits) vs **Portfolio** (larger credits with an Activate Provider **Org ID**).
- Eligibility typically includes **pre-Series B**, company **website**, founded within **~10 years**, and a **paid-tier AWS account** linked via **AWS Builder ID** — confirm current copy on the site.
- AWS documents that Activate credits can apply to eligible services including use of **third-party foundation models on Amazon Bedrock** (see FAQ/marketing on the credits page).

**Before you apply — checklist**

- [ ] AWS account on **paid tier** (as required by current Activate copy).
- [ ] **Builder ID** with a **professional email** matching your company domain where possible.
- [ ] One-paragraph **product description** + link to **`www.syncscript.app`** + what you will spend credits on (e.g. Bedrock experiments, S3, RDS, etc.).
- [ ] If you need **Portfolio**-scale credits, obtain an **Activate Provider Organizational ID** from your VC/accelerator.

**After approval — Bedrock**

- In **AWS Console → Amazon Bedrock**, open **Model access** and verify **which models are enabled in your account/region** (Anthropic, Meta, Mistral, Amazon Titan, etc.). **Do not trust this file for model names** — the console is authoritative.

---

## 2. Google for Startups Cloud Program → Vertex AI / Gemini

**Program hub:** [Google Cloud — Startups](https://cloud.google.com/startup)  
**Pre-funded (Start tier) overview:** [Pre-funded startups](https://cloud.google.com/startup/pre-funded)  
**Funded (Scale tier) overview:** [Early stage funded startups](https://cloud.google.com/startup/early-stage)  
**FAQ:** [Google for Startups Cloud Program FAQ](https://cloud.google.com/startup/faq)

**What Google states (high level):**

- Multiple **tiers** (e.g. smaller credits for pre-funded vs larger packages for funded startups); amounts and eligibility change — read **Benefits** and **FAQ** on the day you apply.
- FAQ: have your **18-character Google Cloud billing account ID** ready; **business email** should align with your **public website domain** where possible.

**Vertex AI / Claude**

- If you need **Claude (or any partner model)** on Vertex, confirm in **Google Cloud Console → Vertex AI → Model Garden / endpoints** what is **available in your region and org** after credits land. **Do not assume “Claude is there” from memory.**

**Checklist**

- [ ] GCP project + **billing account** created.
- [ ] Domain/email alignment (see FAQ).
- [ ] Short deck or product summary with **syncscript.app** link and architecture bullets (Vercel + Supabase + optional GPU/VM).

---

## 3. Microsoft for Startups / Founders Hub → Azure OpenAI (and other Azure AI)

**Founders Hub signup:** [Microsoft for Startups — Founders Hub](https://foundershub.startups.microsoft.com/signup)  
**Overview (Learn):** [What is Microsoft for Startups?](https://learn.microsoft.com/en-us/startups/microsoft-for-startups/overview)  
**Azure startup credits (Learn):** [Get up to $5,000 in Azure credits for startups](https://learn.microsoft.com/en-us/azure/signups/overview)  
**Benefits guide (partner):** [Founders Hub benefits guide](https://partner.microsoft.com/en-us/partnership/founders-hub-benefits-guide)

**Paths (simplified):**

- **Broad startup credit path:** Microsoft documents up to **$5,000** Azure credits for eligible **new Azure customers** via personal **MSA**, with **$1,000** first tranche and more after **business verification** — read the Learn article for exact rules and timelines.
- **Investor-network path:** Higher tiers may require **investor affiliation** / referral — see Learn “Investor Offer”.

**Azure OpenAI + Claude**

- In **Azure Portal → Azure OpenAI** (or **Foundry**), open **Model catalog** and verify **which models** (OpenAI, Meta, Mistral, **Anthropic if listed**, etc.) your subscription/region supports. **Console beats any doc.**

**Checklist**

- [ ] Business email on your domain; LinkedIn/company profile consistent with SyncScript.
- [ ] Incorporation docs if you target **verification** tiers beyond the first credit tranche.
- [ ] Demo URL: **`https://www.syncscript.app`** (and staging if you use one).

---

## 4. Optional: use Cursor / browser automation safely

- Use **Composer / Browser** only on **official** domains above; **export drafts** (company description, funding, use-of-credits) from this file into the form fields; **you** review every screen.
- **Never** paste repo secrets, Supabase service role, JWTs, or Stripe keys into third-party forms.

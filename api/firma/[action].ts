/**
 * Single Vercel function for /api/firma/* (Hobby plan ≤12 serverless functions).
 * Routes: webhook | create-signing-request (URLs unchanged).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const FIRMA_URL =
  'https://api.firma.dev/functions/v1/signing-request-api/signing-requests/create-and-send';

function actionSegment(req: VercelRequest): string {
  const a = req.query.action;
  if (typeof a === 'string') return a;
  if (Array.isArray(a)) return a[0] || '';
  return '';
}

async function handleWebhook(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://kwhnrlzibgfedtxpkbgb.supabase.co';
  const anon =
    process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aG5ybHppYmdmZWR0eHBrYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzk3OTMsImV4cCI6MjA3NjY1NTc5M30.vvV5Ksaq70soeLzwDr7AuXiUFPhwcRV4m78PD4qtFu8';
  const secret = process.env.NEXUS_PHONE_EDGE_SECRET;
  const wh = process.env.FIRMA_WEBHOOK_SECRET || '';
  if (!secret) {
    return res.status(503).json({ error: 'Not configured' });
  }
  const payload =
    typeof req.body === 'string' ? req.body : JSON.stringify(req.body && Object.keys(req.body).length ? req.body : {});

  const r = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/make-server-57781ad9/internal/firma-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(anon ? { apikey: anon, Authorization: `Bearer ${anon}` } : {}),
      'x-firma-webhook-secret': wh,
      'x-nexus-internal-secret': secret,
    },
    body: payload,
  });
  const data = await r.json().catch(() => ({}));
  return res.status(r.ok ? 200 : 502).json(data);
}

function authorizeCreate(req: VercelRequest): boolean {
  const internal = process.env.NEXUS_PHONE_EDGE_SECRET;
  const h = req.headers['x-nexus-internal-secret'];
  if (internal && h === internal) return true;
  const cron = process.env.CRON_SECRET;
  const auth = req.headers.authorization;
  if (cron && auth === `Bearer ${cron}`) return true;
  return false;
}

async function buildPdfBuffer(title: string, content: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let y = 750;

  const drawWrapped = (text: string, size: number, lineGap: number) => {
    let rest = text;
    while (rest.length > 0 && y > 50) {
      let chunk = rest.slice(0, 90);
      if (rest.length > 90) {
        const sp = chunk.lastIndexOf(' ');
        if (sp > 40) chunk = rest.slice(0, sp);
      }
      page.drawText(chunk, { x: 50, y, size, font });
      rest = rest.slice(chunk.length).trimStart();
      y -= size + lineGap;
    }
  };

  drawWrapped(title, 16, 8);
  y -= 6;
  for (const para of content.split('\n\n').filter((s) => s.trim())) {
    drawWrapped(para.trim(), 11, 4);
    y -= 4;
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

async function handleCreateSigningRequest(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!authorizeCreate(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.FIRMA_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'FIRMA_API_KEY not configured' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const title = String(body.title || 'Agreement').slice(0, 200);
  const content = String(body.content || '').slice(0, 50000);
  const signerEmail = String(body.signer_email || '').trim();
  const signerName = String(body.signer_name || 'Signer').trim();
  if (!signerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail)) {
    return res.status(400).json({ error: 'signer_email required' });
  }

  const parts = signerName.split(/\s+/).filter(Boolean);
  const first = parts[0] || 'Signer';
  const last = parts.slice(1).join(' ') || ' ';

  const buffer = await buildPdfBuffer(title, content);
  const base64 = buffer.toString('base64');

  const fr = await fetch(FIRMA_URL, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: title,
      document: base64,
      recipients: [
        {
          first_name: first,
          last_name: last,
          email: signerEmail,
          designation: 'Signer',
          order: 1,
        },
      ],
    }),
  });

  const payload = await fr.json().catch(() => ({}));
  if (!fr.ok) {
    return res.status(502).json({ error: 'firma_request_failed', detail: payload });
  }

  return res.status(200).json({
    ok: true,
    signing_request: payload,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = actionSegment(req);
  switch (action) {
    case 'webhook':
      return handleWebhook(req, res);
    case 'create-signing-request':
      return handleCreateSigningRequest(req, res);
    default:
      return res.status(404).json({ error: 'Unknown Firma route' });
  }
}

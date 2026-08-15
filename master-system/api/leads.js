const { sql } = require('@vercel/postgres');

const STATUSES = ['new', 'contacted', 'quoted', 'converted', 'lost'];

function clean(value, max = 4000) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function send(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').end(JSON.stringify(payload));
}

function tokenFrom(req) {
  return String(req.headers.authorization || '').replace(/^Bearer\s+/i, '') || String(req.headers['x-lead-token'] || '');
}

function isAllowed(req, expected) {
  return !!expected && tokenFrom(req) === expected;
}

async function ensureTable() {
  await sql`CREATE TABLE IF NOT EXISTS website_leads (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'new',
    path TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    location TEXT,
    contact_preference TEXT,
    message TEXT,
    source_page TEXT,
    converted_job_id TEXT,
    last_contacted_at TIMESTAMPTZ,
    notes TEXT,
    source_submission_id TEXT
  )`;
  await sql`ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS source_submission_id TEXT`;
}

module.exports = async function handler(req, res) {
  try {
    await ensureTable();
    if (req.method === 'POST') {
      if (!isAllowed(req, process.env.LEAD_INGEST_TOKEN)) return send(res, 401, { ok: false, error: 'unauthorised' });
      const body = req.body || {};
      const submissionId = clean(body.submissionId, 120);
      if (submissionId) {
        const existing = await sql`SELECT id FROM website_leads WHERE source_submission_id = ${submissionId} LIMIT 1`;
        if (existing.rows[0]) return send(res, 200, { ok: true, id: existing.rows[0].id, duplicate: true });
      }
      const id = `web_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const path = clean(body.path, 40);
      const name = clean(body.name, 120);
      if (!path || !name || (!clean(body.phone, 80) && !clean(body.email, 160))) return send(res, 400, { ok: false, error: 'missing_required_details' });
      await sql`INSERT INTO website_leads (id, path, name, phone, email, location, contact_preference, message, source_page, source_submission_id)
        VALUES (${id}, ${path}, ${clean(body.phone, 80)}, ${clean(body.email, 160)}, ${clean(body.location, 160)}, ${clean(body.contactPreference, 40)}, ${clean(body.message, 4000)}, ${clean(body.sourcePage, 500)}, ${submissionId || null})`;
      return send(res, 201, { ok: true, id });
    }
    if (req.method === 'GET') {
      if (!isAllowed(req, process.env.LEAD_ADMIN_TOKEN)) return send(res, 401, { ok: false, error: 'unauthorised' });
      const limit = Math.min(Math.max(Number(req.query?.limit || 100), 1), 250);
      const result = await sql`SELECT id, created_at, status, path, name, phone, email, location, contact_preference, message, source_page, converted_job_id, last_contacted_at, notes FROM website_leads ORDER BY created_at DESC LIMIT ${limit}`;
      return send(res, 200, { ok: true, leads: result.rows });
    }
    if (req.method === 'PATCH') {
      if (!isAllowed(req, process.env.LEAD_ADMIN_TOKEN)) return send(res, 401, { ok: false, error: 'unauthorised' });
      const body = req.body || {};
      const id = clean(body.id, 120);
      const status = clean(body.status, 30);
      if (!id || !STATUSES.includes(status)) return send(res, 400, { ok: false, error: 'invalid_update' });
      const notes = clean(body.notes, 4000);
      const convertedJobId = clean(body.convertedJobId, 120);
      await sql`UPDATE website_leads SET status = ${status}, notes = ${notes}, converted_job_id = ${convertedJobId || null}, last_contacted_at = CASE WHEN ${status} IN ('contacted','quoted','converted') THEN NOW() ELSE last_contacted_at END WHERE id = ${id}`;
      return send(res, 200, { ok: true, id, status });
    }
    return send(res, 405, { ok: false, error: 'method_not_allowed' });
  } catch (error) {
    console.error('Website leads API error', error);
    return send(res, 500, { ok: false, error: 'server_error' });
  }
};

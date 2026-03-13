const COOKIE_NAME = 'sac_session';
const COOKIE_VALUE = 'authorised';
const SESSION_HOURS = 8;

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  const correctPassword = process.env.SITE_PASSWORD;

  if (!correctPassword) {
    return res.status(500).json({ error: 'Server misconfigured — set SITE_PASSWORD env variable' });
  }

  if (password !== correctPassword) {
    // Small delay to slow brute force attempts
    setTimeout(() => {
      res.status(401).json({ error: 'Incorrect password' });
    }, 600);
    return;
  }

  // Set secure HTTP-only cookie — JS in the browser cannot read or steal this
  const maxAge = SESSION_HOURS * 60 * 60;
  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=${COOKIE_VALUE}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/`
  ]);

  res.status(200).json({ ok: true });
}

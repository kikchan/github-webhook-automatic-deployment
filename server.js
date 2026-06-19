const express = require('express');
const crypto = require('crypto');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 4000;
const SECRET = process.env.SECRET_TOKEN;

if (!SECRET) {
  throw new Error('SECRET_TOKEN is not set');
}

/**
 * IMPORTANT:
 * Capture RAW BODY as STRING EXACTLY ONCE
 */
app.use('/deploy', express.raw({ type: '*/*' }));

function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature || !req.body) return false;

  // Convert Buffer -> string ONCE (GitHub signs this exact UTF-8 string)
  const payload = req.body.toString('utf8');

  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = hmac.update(payload, 'utf8').digest('hex');

  const expected = signature.split('=')[1];

  if (!expected) return false;

  // DIRECT STRING COMPARISON (THIS IS THE KEY FIX)
  return crypto.timingSafeEqual(
    Buffer.from(digest, 'utf8'),
    Buffer.from(expected, 'utf8')
  );
}

function deploy(project) {
  console.log(`[DEPLOY] ${project}`);

  execSync(`/usr/local/bin/deploy-project.sh ${project}`, {
    stdio: 'inherit'
  });

  console.log(`[DONE] ${project}`);
}

app.post('/deploy', (req, res) => {
  const project = req.query.project;

  if (!project) {
    return res.status(400).json({ error: 'Missing project' });
  }

  if (req.headers['x-github-event'] === 'ping') {
    return res.json({ ok: true });
  }

  if (!verifySignature(req)) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  deploy(project);

  res.json({ ok: true, deployed: project });
});

app.listen(PORT, () => {
  console.log(`Webhook running on port ${PORT}`);
});
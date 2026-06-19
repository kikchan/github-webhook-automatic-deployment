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
 * GitHub signs RAW request body bytes.
 * We must preserve Buffer exactly.
 */
app.use('/deploy', express.raw({ type: '*/*' }));

/**
 * GitHub signature verification (equivalent to Ruby secure_compare version)
 */
function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature || !req.body) return false;

  // IMPORTANT: raw Buffer, no conversion
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = hmac.update(req.body).digest('hex');

  const expected = signature.split('=')[1];

  if (!expected) return false;

  // convert both hex strings into buffers
  const digestBuf = Buffer.from(digest, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');

  if (digestBuf.length !== expectedBuf.length) return false;

  return crypto.timingSafeEqual(digestBuf, expectedBuf);
}

/**
 * Deploy logic
 */
function deploy(project) {
  console.log(`[DEPLOY] ${project}`);

  execSync(`/usr/local/bin/deploy-project.sh ${project}`, {
    stdio: 'inherit'
  });

  console.log(`[DONE] ${project}`);
}

/**
 * Webhook endpoint
 */
app.post('/deploy', (req, res) => {
  try {
    const project = req.query.project;

    if (!project) {
      return res.status(400).json({ error: 'Missing project' });
    }

    // GitHub ping event (no signature required)
    if (req.headers['x-github-event'] === 'ping') {
      return res.json({ ok: true });
    }

    // SECURITY CHECK
    if (!verifySignature(req)) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    deploy(project);

    return res.json({ ok: true, deployed: project });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Webhook running on port ${PORT}`);
});
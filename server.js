const express = require('express');
const crypto = require('crypto');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 4000;
const SECRET = process.env.SECRET_TOKEN;

if (!SECRET) {
  throw new Error('SECRET_TOKEN is not set in environment');
}

/**
 * We only need query/body parsing now
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Constant-time comparison to avoid trivial timing attacks
 */
function safeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));

  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

/**
 * Simple auth check
 */
function verifyRequest(req) {
  const secret = req.query.secret || req.body?.secret;

  if (!secret) return false;

  return safeEqual(secret, SECRET);
}

/**
 * Deploy logic
 */
function deploy(project) {
  console.log(`[DEPLOY] ${project}`);

  try {
    execSync(`/usr/local/bin/deploy-project.sh ${project}`, {
      stdio: 'inherit'
    });

    console.log(`[DONE] ${project}`);
  } catch (err) {
    console.error(`[DEPLOY FAILED] ${project}`, err.message);
    throw err;
  }
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

    if (!verifyRequest(req)) {
      return res.status(403).json({ error: 'Invalid secret' });
    }

    deploy(project);

    return res.json({
      ok: true,
      deployed: project
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Webhook running on port ${PORT}`);
});
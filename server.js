const express = require('express');
const crypto = require('crypto');
const { execSync } = require('child_process');

const app = express();
const PORT = 4000;
const SECRET = process.env.SECRET_TOKEN;

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

function verify(req) {
  const sig = req.headers['x-hub-signature-256'];
  if (!sig || !req.rawBody) return false;

  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(sig),
    Buffer.from(digest)
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
    return res.status(400).json({ error: "Missing project" });
  }

  if (req.headers['x-github-event'] === 'ping') {
    return res.json({ ok: true });
  }

  if (!verify(req)) {
    return res.status(403).json({ error: "Invalid signature" });
  }

  deploy(project);

  res.json({ ok: true, deployed: project });
});

app.listen(PORT, () => {
  console.log(`Webhook running on port ${PORT}`);
});
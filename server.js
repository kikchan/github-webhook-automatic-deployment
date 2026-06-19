const express = require('express');
const { execSync } = require('child_process');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

const SECRET = process.env.SECRET_TOKEN;
const PORT = process.env.PORT || 4000;

function deploy(project) {
  const path = "/home/kikchan/Metalforce/" + project;

  if (!path) {
    throw new Error("Unknown project: " + project);
  }

  console.log(`[DEPLOY] ${project} -> ${path}`);

  execSync("git restore .", { cwd: path, stdio: "inherit" });
  execSync("git pull", { cwd: path, stdio: "inherit" });
  execSync("docker compose up -d --build", { cwd: path, stdio: "inherit" });

  console.log(`[DONE] ${project}`);
}

function verifyGitHubSignature(req, secret) {
  const signature = req.headers['x-hub-signature-256'];

  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

/**
 * GitHub webhook (query string based)
 * Example:
 * /deploy?folder=HouseRepository&secret=xxx
 */
app.post('/deploy', (req, res) => {
  try {
    const project = req.query.project;

    if (req.headers['x-github-event'] === 'ping') {
      return res.json({ ok: true, message: "pong" });
    }

    if (!project) {
      return res.status(400).json({ error: "Missing ?project=" });
    }

    if (!verifyGitHubSignature(req, SECRET)) {
      return res.status(403).json({ error: "Invalid signature" });
    }

    deploy(project);

    res.json({ status: "ok", deployed: project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log("Deployer running on port", PORT);
});
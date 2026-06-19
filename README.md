# GitHub Webhook Deployer

A lightweight, Dockerized Express.js API that automatically deploys local Git repositories when triggered via GitHub Webhooks (or any HTTP client).

It is designed for self-hosted environments where multiple projects live under a single root directory and need to be deployed dynamically based on a folder name passed in the request.

---

## 🚀 What it does

When triggered, this service will:

1. Locate the target project inside:

```text
/home/kikchan/Metalforce/<folder>
```

2. Run deployment commands:

```bash
git restore .
git pull
docker compose up -d --build
```

3. Return a JSON response confirming deployment.

---

## 📡 API Usage

### Deploy a project

```http
POST /deploy?folder=<project-name>&secret=<your-secret>
```

### Example

```http
POST http://localhost:4000/deploy?folder=HouseRepository&secret=my_secret
```

---

## 🔐 Security

The API is protected using a simple shared secret:

Set via environment variable:

```env
SECRET_TOKEN=your_secret
```

Must be provided in request:

```text
?secret=your_secret
```

⚠️ This is a lightweight protection mechanism. For production, consider adding GitHub HMAC signature validation.

---

## 📁 Project Structure

All projects must live under:

```text
/home/kikchan/Metalforce/
```

Example:

```text
/ home/kikchan/Metalforce/HouseRepository
/ home/kikchan/Metalforce/net-api
/ home/kikchan/Metalforce/Dashy
```

The folder query parameter maps directly to a directory name.

---

## 🐳 Docker Setup

### Build & run

```bash
docker compose up -d --build
```

### Exposed port

```text
4000
```

---

## ⚙️ Environment Variables

Create a `.env` file:

```env
SECRET_TOKEN=change_me
PORT=4000
```

---

## 🔁 Example GitHub Webhook Setup

In your GitHub repository:

### Payload URL

```text
http://your-server:4000/deploy?folder=HouseRepository&secret=your_secret
```

### Content type

```text
application/json
```

### Events

```text
Just the push event
```

---

## ⚠️ Important Notes

- The server directly executes Git and Docker commands.
- It assumes repositories are already cloned locally.
- The process runs synchronously (blocking per request).

Ensure Docker socket access is available:

```text
/var/run/docker.sock
```

---

## 🧠 How it works internally

```text
GitHub Push Event
        ↓
Webhook call to Express API
        ↓
Validate secret
        ↓
Resolve /home/kikchan/Metalforce/<folder>
        ↓
git restore . && git pull
        ↓
docker compose up -d --build
        ↓
Done
```

---

## 📌 Recommended Improvements (optional)

- Add GitHub HMAC signature verification
- Add deployment queue (avoid concurrent conflicts)
- Add logs per project
- Add rollback support
- Add branch selection support
- Add retry system on failure

---

## 🧑‍💻 Author

Self-hosted deployment automation system for multi-repository environments.

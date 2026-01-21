# 🚀 Quick Start Guide - GitHub App API

## 📦 Installation

```bash
cd github_app
npm install
```

## ⚙️ Configuration

1. **Copy environment file**:
   ```bash
   cp example.env .env
   ```

2. **Edit `.env` with your credentials**:
   ```env
   GITHUB_APP_ID=your_app_id_here
   GITHUB_PRIVATE_KEY_PATH=./path/to/your-private-key.pem
   GITHUB_REPO_OWNER=your_github_username
   GITHUB_WEBHOOK_SECRET=your_webhook_secret
   PORT=3000
   ```

## 🏃 Run

```bash
node index.js
```

Server starts at: `http://localhost:3000`  
API Docs: `http://localhost:3000/api-docs`

## 🔑 Quick API Examples

### Create Repository
```bash
curl -X POST http://localhost:3000/create-repo \
  -H "Content-Type: application/json" \
  -d '{"owner":"username","name":"my-repo","description":"Test repo"}'
```

### Create Branch
```bash
curl -X POST http://localhost:3000/create-branch \
  -H "Content-Type: application/json" \
  -d '{"owner":"username","repo":"my-repo","branchName":"feature/test"}'
```

### Add File
```bash
curl -X POST http://localhost:3000/add-file \
  -H "Content-Type: application/json" \
  -d '{"owner":"username","repo":"my-repo","filePath":"test.txt","content":"Hello","commitMessage":"Add test file"}'
```

### Create Pull Request
```bash
curl -X POST http://localhost:3000/create-pull-request \
  -H "Content-Type: application/json" \
  -d '{"owner":"username","repo":"my-repo","title":"Test PR","body":"Description","head":"feature/test","base":"main"}'
```

## 📚 Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhook` | GitHub webhook handler |
| POST | `/create-repo` | Create repository |
| POST | `/create-branch` | Create branch |
| POST | `/add-file` | Add/update file |
| POST | `/create-pull-request` | Create PR |
| POST | `/push-changes` | Push multiple files |
| GET | `/installation-info` | Get installation info |
| GET | `/user-installation-status` | Check installation |
| GET | `/branches` | List branches |
| GET | `/branch` | Get branch details |
| GET | `/repository` | Get repo info |
| GET | `/contents` | Get file contents |
| GET | `/compare` | Compare commits |
| GET | `/commit-info` | Get commit info |
| GET | `/download-repo` | Download archive |

## 💻 Code Usage

```javascript
const { GitHubApp } = require('./github-app');
const githubApp = new GitHubApp();

// Create a repository
const repo = await githubApp.createRepository(
  'owner',
  'repo-name',
  'Description',
  false
);

// Create a branch
await githubApp.createBranch('owner', 'repo-name', 'feature/new');

// Add a file
await githubApp.addFile(
  'owner',
  'repo-name',
  'README.md',
  '# Hello World',
  'main',
  'Add README'
);

// Create PR
await githubApp.createPullRequest(
  'owner',
  'repo-name',
  'PR Title',
  'PR Description',
  'feature/new',
  'main'
);
```

## 🔧 Troubleshooting

**Installation ID not found?**
- Ensure GitHub App is installed on your account
- Check webhook is configured and receiving events

**Authentication errors?**
- Verify `GITHUB_APP_ID` is correct
- Check private key path and file exists
- Ensure private key matches your GitHub App

**Permission errors?**
- Review GitHub App permissions in settings
- Reinstall app if permissions changed

## 📖 Full Documentation

- **Complete Guide**: See `README.md`
- **Webhook Setup**: See `WEBHOOK_SETUP.md`
- **Extraction Info**: See `EXTRACTION_SUMMARY.md`

---

**Ready to go!** 🎉

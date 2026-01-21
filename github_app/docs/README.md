# GitHub App API - Extracted Code

This folder contains the extracted GitHub App related code from the Code Generation Platform project.

## 📁 File Structure

```
github_app/
├── 📄 github-app.js                    (15.5 KB) - Main GitHub App class with all API operations
├── 📄 index.js                         (41.1 KB) - Express server with GitHub App endpoints
├── 📄 package.json                     (1.0 KB)  - Dependencies and scripts
├── 🔒 .env                             (937 B)   - Environment variables (SENSITIVE - configure before use)
├── 📄 example.env                      (1.5 KB)  - Example environment configuration
├── 📖 README.md                        (7.7 KB)  - Complete setup and usage guide (this file)
├── 📖 QUICK_START.md                   (3.2 KB)  - Quick start guide with examples
├── 📖 EXTRACTION_SUMMARY.md            (5.8 KB)  - Extraction details and next steps
├── 📖 WEBHOOK_SETUP.md                 (2.1 KB)  - GitHub App webhook setup guide
├── 📁 utils/
│   ├── 📄 installation-storage.js      (2.6 KB)  - Installation ID mapping storage
│   └── 📄 git-ops.js                   (9.6 KB)  - Git operations utilities
└── 📁 .keystore/
    └── 📄 installation-map.json        (201 B)   - Persistent installation ID storage (created at runtime)
```

**Total: 12 files (~82 KB)**

## 🚀 Core Components

### 1. **github-app.js**
Main GitHub App class providing:
- Repository operations (create, delete, get)
- Branch management (create, list, get)
- File operations (add, update, get contents)
- Commit operations (push changes, compare, get info)
- Pull request creation
- Repository download/archive
- Installation management

### 2. **utils/installation-storage.js**
Manages GitHub App installation ID mappings:
- Persistent storage of installation IDs
- Maps GitHub accounts (username/org) to installation IDs
- Auto-saves to `.keystore/installation-map.json`

### 3. **utils/git-ops.js**
Git operations utilities:
- Directory copying (excluding .git)
- Delta calculation (additions, modifications, deletions)
- Batch file pushing to GitHub
- Complete Git setup and push workflow

### 4. **index.js**
Express server with REST API endpoints:
- `/webhook` - GitHub App webhook handler
- `/create-repo` - Create repository
- `/create-branch` - Create branch
- `/add-file` - Add/update files
- `/create-pull-request` - Create pull requests
- `/push-changes` - Push multiple file changes
- `/installation-info` - Get installation info
- `/user-installation-status` - Check installation status
- `/branches`, `/branch`, `/repository` - Repository queries
- `/contents`, `/compare`, `/commit-info` - Content operations
- `/download-repo` - Download repository archive

## 📦 Dependencies

Key dependencies from `package.json`:
```json
{
  "@octokit/auth-app": "^7.1.3",
  "@octokit/rest": "^21.0.2",
  "express": "^4.21.2",
  "express-fileupload": "^1.5.1",
  "dotenv": "^16.4.7",
  "unzipper": "^0.12.3"
}
```

## ⚙️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `example.env` to `.env` and configure:

```bash
# GitHub App Configuration
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY_PATH=./path/to/private-key.pem
GITHUB_INSTALLATION_ID=your_installation_id  # Optional fallback
GITHUB_REPO_OWNER=your_github_username_or_org

# Webhook Configuration
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Server Configuration
PORT=3000
```

### 3. GitHub App Setup
1. Create a GitHub App at https://github.com/settings/apps/new
2. Configure permissions:
   - Repository permissions:
     - Contents: Read & Write
     - Pull requests: Read & Write
     - Metadata: Read-only
3. Generate and download a private key
4. Install the app on your account/organization
5. Note the App ID and Installation ID

See `WEBHOOK_SETUP.md` for detailed webhook configuration.

### 4. Run the Server
```bash
node index.js
```

The server will start on `http://localhost:3000` (or your configured PORT).

## 🔧 Usage Examples

### Create a Repository
```bash
curl -X POST http://localhost:3000/create-repo \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "your-username",
    "name": "new-repo",
    "description": "My new repository",
    "isPrivate": false
  }'
```

### Create a Branch
```bash
curl -X POST http://localhost:3000/create-branch \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "your-username",
    "repo": "new-repo",
    "branchName": "feature/new-feature",
    "sourceBranch": "main"
  }'
```

### Add a File
```bash
curl -X POST http://localhost:3000/add-file \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "your-username",
    "repo": "new-repo",
    "filePath": "README.md",
    "content": "# Hello World",
    "branch": "main",
    "commitMessage": "Add README"
  }'
```

### Create a Pull Request
```bash
curl -X POST http://localhost:3000/create-pull-request \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "your-username",
    "repo": "new-repo",
    "title": "Add new feature",
    "body": "This PR adds a new feature",
    "head": "feature/new-feature",
    "base": "main"
  }'
```

## 🔐 Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env` file to version control
- Keep your private key secure
- Use webhook secrets for production
- Validate all incoming webhook payloads

## 📚 Integration Guide

### Using in Your Project

1. **Import the GitHubApp class:**
```javascript
const { GitHubApp } = require('./github-app');
const githubApp = new GitHubApp();
```

2. **Create a repository:**
```javascript
const repo = await githubApp.createRepository(
  'owner',
  'repo-name',
  'Description',
  false // isPrivate
);
```

3. **Push changes:**
```javascript
const files = [
  { path: 'file1.js', content: 'console.log("Hello");', encoding: 'utf-8' },
  { path: 'file2.js', content: 'console.log("World");', encoding: 'utf-8' }
];

await githubApp.pushChanges(
  'owner',
  'repo-name',
  'Commit message',
  files,
  'main',
  'main'
);
```

4. **Use Git Operations:**
```javascript
const { setupGitAndPush } = require('./utils/git-ops');

await setupGitAndPush(
  './local-project-path',
  'repo-name',
  'Repository description',
  githubApp,
  {
    onStatusUpdate: (status) => console.log(status),
    onLog: (msg) => console.log(msg)
  }
);
```

## 🛠️ Customization

### Modifying Endpoints
Edit `index.js` to add/modify endpoints. The file uses Express.js and includes Swagger documentation.

### Extending GitHubApp
Add new methods to `github-app.js` using the Octokit REST API:
```javascript
async myCustomMethod(owner, repo) {
  const github = await this.getGitHubClientForOwner(owner);
  // Use github.* methods from Octokit
}
```

## 📖 API Documentation

When running the server, Swagger documentation is available at:
- `http://localhost:3000/api-docs`

## 🐛 Troubleshooting

### Installation ID Not Found
- Ensure the GitHub App is installed on your account/organization
- Check that webhook events are being received
- Verify `.keystore/installation-map.json` contains your mapping

### Authentication Errors
- Verify `GITHUB_APP_ID` is correct
- Check that private key path is valid
- Ensure the private key matches your GitHub App

### Permission Errors
- Review GitHub App permissions in app settings
- Reinstall the app if permissions were changed
- Check that the app has access to the specific repository

## 📝 License

This code is extracted from the Code Generation Platform project.

## 🤝 Contributing

When integrating into your project:
1. Review and update environment variables
2. Customize endpoints as needed
3. Add error handling for your use cases
4. Implement proper logging and monitoring

---

**Last Updated**: 2026-01-20
**Extracted From**: Code Generation Platform

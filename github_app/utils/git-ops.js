const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * Git Operations Utility Module
 * 
 * Provides helper functions for file system operations and git status analysis
 * to facilitate interacting with the GitHub App.
 * 
 * Usage Example:
 * 
 * ```javascript
 * const { calculateDeltas, copyDirectory, setupGitAndPush } = require('./utils/git-ops');
 * 
 * // 1. Copy a directory (skipping .git)
 * await copyDirectory('./source', './dest');
 * 
 * // 2. Initialize Git (Required before calculating deltas)
 * // Note: specific implementation depends on your needs (e.g., configuring user)
 * const { execSync } = require('child_process');
 * execSync('git init', { cwd: './dest' });
 * execSync('git add .', { cwd: './dest' }); // Optional: if you want base state
 * 
 * // 3. Calculate Git Deltas (Additions, Modifications, Deletions)
 * // Returns { additions: [], modifications: [], deletions: [] }
 * const deltas = await calculateDeltas('./dest');
 * 
 * // 3. Full Setup and Push (Template + Deltas)
 * // Requires initialized Git repo at projectPath and a GitHubApp instance
 * await setupGitAndPush(
 *   './project-path', 
 *   'repo-name', 
 *   'repo-description', 
 *   githubAppInstance, 
 *   {
 *     onStatusUpdate: (status) => console.log(status),
 *     onLog: (msg) => console.log(msg)
 *   }
 * );
 * ```
 */

/**
 * Recursively copies a directory, skipping .git directories.
 * @param {string} src - Source directory path
 * @param {string} dest - Destination directory path
 */
async function copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (let entry of entries) {
        // Skip .git directories to avoid permission issues with locked files
        if (entry.name === '.git') {
            continue;
        }

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

/**
 * Calculates git deltas (additions, modifications, deletions) for a project path.
 * @param {string} projectPath - Path to the local git project
 * @returns {Promise<Object>} - Object containing arrays of additions, modifications, deletions
 */
async function calculateDeltas(projectPath) {
    try {
        // Ensure we capture all changes, including untracked files
        // We don't need to git add because status --porcelain shows untracked files too
        const statusOutput = execSync('git status --porcelain', { cwd: projectPath, encoding: 'utf8' });

        const changes = {
            additions: [],
            modifications: [],
            deletions: []
        };

        const lines = statusOutput.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
            // The status code is the first 2 characters
            const status = line.substring(0, 2);
            // The file path starts from index 3
            const filePath = line.substring(3).trim();

            // Remove quotes if present (git status might quote filenames with spaces)
            const cleanPath = filePath.replace(/^"|"$/g, '');

            // ?? = Untracked (Addition)
            // A  = Added (Staged)
            //  M = Modified (Unstaged)
            // M  = Modified (Staged)
            //  D = Deleted (Unstaged)
            // D  = Deleted (Staged)

            if (status.includes('??') || status.includes('A')) {
                changes.additions.push(cleanPath);
            } else if (status.includes('M')) {
                changes.modifications.push(cleanPath);
            } else if (status.includes('D')) {
                changes.deletions.push(cleanPath);
            }
        }

        console.log(`Calculated deltas: ${changes.additions.length} additions, ${changes.modifications.length} modifications, ${changes.deletions.length} deletions`);
        return changes;
    } catch (error) {
        console.error('Error calculating deltas:', error);
        throw error;
    }
}

/**
 * Sets up a GitHub repository and pushes changes (base template + deltas).
 * @param {string} projectPath - Local path to the project
 * @param {string} repoName - Name of the repository to create/push to
 * @param {string} repoDescription - Description of the repository
 * @param {Object} githubApp - Initialized GitHubApp instance
 * @param {Object} options - Optional callbacks for status updates and logging
 * @param {Function} options.onStatusUpdate - Callback(statusObject)
 * @param {Function} options.onLog - Callback(message)
 */
async function setupGitAndPush(projectPath, repoName, repoDescription, githubApp, options = {}) {
    const { onStatusUpdate = () => { }, onLog = () => { } } = options;
    const username = process.env.GITHUB_REPO_OWNER;
    if (!username) {
        throw new Error('GITHUB_REPO_OWNER environment variable is required but not set.');
    }

    onStatusUpdate({ step: 'github-create-repo', message: 'Creating GitHub repository...' });

    // Create repository on GitHub
    await githubApp.createRepository(username, repoName, repoDescription, false);

    // Initialize with README to create 'main' branch so we have a parent for subsequent commits
    await githubApp.addFile(username, repoName, 'README.md', `# ${repoName}\n\n${repoDescription}`, 'main', 'Initial repository creation');

    // 1. Push Base State (Template files)
    // We get the files that were committed to the local git repo (HEAD)
    onStatusUpdate({ step: 'pushing-base', message: 'Pushing base template...' });

    // Get list of files in HEAD
    const baseFilesList = execSync('git ls-tree -r HEAD --name-only', { cwd: projectPath, encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim() !== '');

    const baseFiles = [];
    for (const filePath of baseFilesList) {
        try {
            // Read content from git object database to get the unmodified template version
            // Use quotes around filePath to handle spaces
            const contentBuffer = execSync(`git show HEAD:"${filePath}"`, { cwd: projectPath });
            baseFiles.push({
                path: filePath,
                content: contentBuffer.toString('base64'),
                encoding: 'base64'
            });
        } catch (err) {
            console.warn(`Warning: Could not read base file ${filePath}: ${err.message}`);
        }
    }

    // Helper function to push files in batches
    const pushInBatches = async (files, messagePrefix) => {
        const BATCH_SIZE = 50; // Number of files per batch
        const TOTAL_FILES = files.length;

        for (let i = 0; i < TOTAL_FILES; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(TOTAL_FILES / BATCH_SIZE);

            const commitMsg = totalBatches > 1
                ? `${messagePrefix} (Batch ${batchNumber}/${totalBatches})`
                : messagePrefix;

            await onLog(`Pushing batch ${batchNumber}/${totalBatches} (${batch.length} files)...`);

            // We always push to 'main' and use 'main' as parent
            // This works sequentially: Batch 2 will use the commit from Batch 1 as parent
            await githubApp.pushChanges(username, repoName, commitMsg, batch, 'main', 'main');
        }
    };

    if (baseFiles.length > 0) {
        onStatusUpdate({ step: 'pushing-base', message: `Pushing base template (${baseFiles.length} files)...` });
        await pushInBatches(baseFiles, 'Initial commit from template');
    }

    // 2. Push Deltas (AI Changes)
    onStatusUpdate({ step: 'pushing-deltas', message: 'Pushing AI changes...' });

    const deltas = await calculateDeltas(projectPath);
    const deltaFiles = [];

    // Handle Additions and Modifications
    for (const filePath of [...deltas.additions, ...deltas.modifications]) {
        try {
            // Read from filesystem (working directory)
            const contentBuffer = await fs.readFile(path.join(projectPath, filePath));
            deltaFiles.push({
                path: filePath,
                content: contentBuffer.toString('base64'),
                encoding: 'base64'
            });
        } catch (err) {
            console.warn(`Warning: Could not read modified file ${filePath}: ${err.message}`);
        }
    }

    // Handle Deletions
    for (const filePath of deltas.deletions) {
        deltaFiles.push({
            path: filePath,
            content: null // Signals deletion in our modified commitChanges
        });
    }

    if (deltaFiles.length > 0) {
        onStatusUpdate({ step: 'pushing-deltas', message: `Pushing AI changes (${deltaFiles.length} files)...` });
        await pushInBatches(deltaFiles, 'AI Implementation');
    }

    onStatusUpdate({ step: 'completed', message: 'Codebase generation completed successfully' });
    console.log(`Codebase generation completed successfully! Repository: https://github.com/${username}/${repoName}`);
}

module.exports = {
    copyDirectory,
    calculateDeltas,
    setupGitAndPush
};

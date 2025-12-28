# How to Debug GitHub Actions Workflow Errors

When a workflow fails, you need to identify **which step failed** and **what the error was**. Here's how:

## Method 1: View Errors in GitHub UI (Recommended)

### Step-by-Step:

1. **Go to your repository on GitHub**
   - Navigate to: `https://github.com/{owner}/{repo}`

2. **Click the "Actions" tab**
   - This shows all workflow runs

3. **Find the failed workflow run**
   - Look for runs with a red ❌ icon
   - Or check the Activity Log in your app - it includes the workflow URL

4. **Click on the failed workflow run**
   - You'll see a list of jobs

5. **Click on the failed job** (usually has a red ❌)
   - This shows all steps in that job

6. **Expand each step** to see detailed logs
   - Look for steps with red ❌ or ⚠️ icons
   - Click on the step name to expand and see error messages
   - Error messages are usually highlighted in red

7. **Read the error message**
   - Common errors:
     - **Command failed**: Check the command syntax
     - **File not found**: Check file paths
     - **Permission denied**: Check file permissions
     - **Exit code 1**: Command returned an error
     - **Timeout**: Step took too long

## Method 2: From Activity Log in Your App

When a workflow fails, the Activity Log will show:

- **Title**: `❌ Workflow Failed: {workflow_name}`
- **Status**: `FAILED`
- **Action**: Contains workflow details and a clickable URL
- **Result**: Instructions on how to find the error

Click the workflow URL in the action details to go directly to the GitHub workflow run page.

## Method 3: Enable Debug Logging (Advanced)

For more detailed logs, enable debug logging:

1. **Go to repository Settings → Secrets and variables → Actions**
2. **Add the following secrets:**
   - `ACTIONS_RUNNER_DEBUG` = `true`
   - `ACTIONS_STEP_DEBUG` = `true`
3. **Re-run the workflow**
4. **Check the logs** - you'll see much more detailed output

## Common Workflow Error Patterns

### 1. **Step Failed with Exit Code**
```
Error: Process completed with exit code 1.
```
- **Cause**: A command in the step failed
- **Solution**: Check the command output above the error

### 2. **File Not Found**
```
Error: ENOENT: no such file or directory
```
- **Cause**: File path is incorrect or file doesn't exist
- **Solution**: Verify file paths in your workflow

### 3. **Permission Denied**
```
Error: EACCES: permission denied
```
- **Cause**: Insufficient permissions
- **Solution**: Check file permissions or use `sudo` (if appropriate)

### 4. **Timeout**
```
Error: The operation was canceled due to timeout
```
- **Cause**: Step took too long
- **Solution**: Increase timeout or optimize the step

### 5. **Syntax Error**
```
Error: YAML syntax error
```
- **Cause**: Invalid YAML in workflow file
- **Solution**: Check workflow file syntax

## Understanding Workflow Structure

A typical workflow has:
- **Workflow**: The entire `.github/workflows/*.yml` file
- **Job**: A group of steps that run on the same runner
- **Step**: A single command or action

When a workflow fails:
1. The **workflow** shows as failed
2. One or more **jobs** show as failed
3. One or more **steps** within those jobs show as failed

## Quick Checklist

When debugging a workflow failure:

- [ ] Check which **job** failed (click on the red ❌)
- [ ] Check which **step** failed (expand each step)
- [ ] Read the **error message** in the step logs
- [ ] Check the **command** that failed
- [ ] Verify **file paths** are correct
- [ ] Check **permissions** if applicable
- [ ] Look for **environment variable** issues
- [ ] Verify **dependencies** are installed

## Example: Finding a Failed Step

```
Workflow: CI/CD Pipeline
  └─ Job: Build and Test ❌
      ├─ Step: Checkout code ✅
      ├─ Step: Setup Node.js ✅
      ├─ Step: Install dependencies ✅
      ├─ Step: Run tests ❌  <-- THIS STEP FAILED
      │   └─ Error: Test "should validate user input" failed
      └─ Step: Build application (skipped)
```

In this example:
- The **"Run tests"** step failed
- The error is: `Test "should validate user input" failed`
- You would fix the test or the code being tested

## Getting Help

If you can't identify the error:
1. Copy the full error message
2. Check the workflow file (`.github/workflows/*.yml`)
3. Review recent changes to the codebase
4. Check GitHub Actions documentation: https://docs.github.com/en/actions


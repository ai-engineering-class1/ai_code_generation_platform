# Deployment Commands

Use these commands to deploy the application. They handle cleaning up old containers and ensuring the project name is consistent.

## 1. Cleanup Old Containers
Remove any containers that might be lingering from previous deployments with inconsistent names.

```bash
docker rm -f $(docker ps -aq --filter "name=Lee-ai-code-platform")
```

## 2. Deploy with Auto-Update
Build and start the containers. This uses the `backend/.env` file and forces the project name to `aicode` to prevent future conflicts.

```bash
docker-compose --env-file backend/.env -p aicode up -d --build
```

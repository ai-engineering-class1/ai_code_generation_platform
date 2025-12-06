# AI Business Consultant

AI Business Consultant project with Quasar frontend and Python FastAPI backend.

## Prerequisites for Windows

Before you begin, ensure you have the following installed on your Windows system:

### Required Software

1. **Node.js** (version >= 10.18.1)
   - Download from: https://nodejs.org/
   - Recommended: LTS version
   - Verify installation:
     ```powershell
     node --version
     npm --version
     ```

2. **Yarn** (version >= 1.21.1)
   - Install via npm:
     ```powershell
     npm install -g yarn
     ```
   - Or download from: https://yarnpkg.com/getting-started/install
   - Verify installation:
     ```powershell
     yarn --version
     ```

3. **Python** (version 3.8 or higher)
   - Download from: https://www.python.org/downloads/
   - **Important**: Check "Add Python to PATH" during installation
   - Verify installation:
     ```powershell
     python --version
     pip --version
     ```

4. **Git** (optional but recommended)
   - Download from: https://git-scm.com/download/win

### Optional but Recommended

- **Visual Studio Code** or any code editor
- **Windows Terminal** (for better PowerShell experience)

## Project Structure

```
ai-business-consultant/
├── ai-business-consultant/      # Frontend (Quasar/Vue.js)
│   ├── package.json
│   └── ...
└── ai-business-consultant-py/  # Backend (Python/FastAPI)
    ├── requirements.txt
    ├── config.py
    └── ...
```

## Installation

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```powershell
   cd ai-business-consultant
   ```

2. **Install dependencies:**
   ```powershell
   # Use yarn as specified (some dependencies are locked)
   yarn install
   ```
   
   **Note**: If you encounter issues with node-gyp or native modules on Windows, you may need to install Windows Build Tools:
   ```powershell
   npm install --global windows-build-tools
   ```
   Or install Visual Studio Build Tools manually.

3. **Verify installation:**
   ```powershell
   yarn --version
   ```

### Backend Setup

1. **Navigate to the backend directory:**
   ```powershell
   cd ..\ai-business-consultant-py
   ```

2. **Create a virtual environment (recommended):**
   ```powershell
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   .\venv\Scripts\Activate.ps1
   ```
   
   **Note**: If you get an execution policy error, run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Install Python dependencies:**
   ```powershell
   # Make sure virtual environment is activated first
   pip install -r requirements.txt
   ```
   
   **Important**: This will install all required packages including:
   - `oss2` (Alibaba Cloud OSS SDK)
   - `openai` (OpenAI API client)
   - `redis` (Redis client)
   - `python-docx` (Word document generation)
   - And all other dependencies listed in requirements.txt
   
   If you encounter "ModuleNotFoundError" after installation, make sure you're running the server with the virtual environment activated.

4. **Set up the database:**
   
   The system requires a database to store report data. You can use **SQLite** (recommended for getting started), **MySQL**, or **PostgreSQL**.
   
   **✅ Option A: SQLite (RECOMMENDED - Easiest Setup)**
   
   SQLite is perfect for development and testing - no separate database server needed!
   
   1. Install aiosqlite (required for async SQLite support):
      ```powershell
      # Make sure virtual environment is activated
      .\venv\Scripts\Activate.ps1
      
      pip install aiosqlite
      ```
   
   2. In your `.env` file, add:
      ```env
      DATABASE_URL=sqlite+aiosqlite:///./easiio_ai_consultant.db
      ```
   
   3. Run migrations to create the database file and tables:
      ```powershell
      # Install alembic if not already installed
      pip install alembic
      
      # Run migrations (this will create the database file automatically)
      alembic upgrade head
      ```
   
   That's it! The database file `easiio_ai_consultant.db` will be created in the `ai-business-consultant-py` directory.
   
   **Option B: MySQL Setup**
   
   1. Install MySQL Server:
      - Download from: https://dev.mysql.com/downloads/mysql/
      - Or use MySQL via XAMPP/WAMP
   
   2. Create the database:
      ```sql
      CREATE DATABASE easiio_ai_consultant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      ```
   
   3. Create a user (optional, or use root):
      ```sql
      CREATE USER 'your_user'@'localhost' IDENTIFIED BY 'your_password';
      GRANT ALL PRIVILEGES ON easiio_ai_consultant.* TO 'your_user'@'localhost';
      FLUSH PRIVILEGES;
      ```
   
   **Option B: PostgreSQL Setup**
   
   1. Install PostgreSQL:
      - Download from: https://www.postgresql.org/download/windows/
   
   2. Create the database:
      ```sql
      CREATE DATABASE easiio_ai_consultant;
      ```
   
   3. Create a user (optional, or use postgres):
      ```sql
      CREATE USER your_user WITH PASSWORD 'your_password';
      GRANT ALL PRIVILEGES ON DATABASE easiio_ai_consultant TO your_user;
      ```
   
   **Run Database Migrations:**
   
   After creating the database and setting up your `.env` file with `DATABASE_URL`, run migrations to create the tables:
   ```powershell
   # Make sure virtual environment is activated
   .\venv\Scripts\Activate.ps1
   
   # Install alembic and required database drivers if not already installed
   pip install alembic
   
   # For MySQL (if using MySQL):
   pip install aiomysql
   
   # For PostgreSQL (if using PostgreSQL):
   pip install asyncpg
   
   # For SQLite (if using SQLite with async):
   pip install aiosqlite
   
   # Run migrations (this will create the tables automatically)
   # The migrations will read DATABASE_URL from your .env file
   alembic upgrade head
   ```
   
   **Note**: The migrations will automatically read your `DATABASE_URL` from the `.env` file. Make sure your `.env` file is configured before running migrations.
   
   This will create the `reports` table automatically.

5. **Create environment file:**
   Create a `.env` file in the `ai-business-consultant-py` directory with the following variables:
   ```env
   # OpenAI API Configuration (REQUIRED)
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Perplexity API Configuration (optional, used for some report generation)
   PERPLEXITY_KEY=your_perplexity_api_key_here
   
   # Database Configuration (REQUIRED)
   # For SQLite (easiest for development, requires aiosqlite):
   DATABASE_URL=sqlite+aiosqlite:///./easiio_ai_consultant.db
   # For MySQL (requires aiomysql):
   # DATABASE_URL=mysql+aiomysql://user:password@localhost:3306/easiio_ai_consultant
   # For PostgreSQL (requires asyncpg):
   # DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/easiio_ai_consultant
   # Replace user, password, and database name with your actual values
   
   # Alibaba Cloud OSS Configuration (REQUIRED for file uploads)
   OSS_ACCESS_KEY_ID=your_oss_access_key_id
   OSS_ACCESS_KEY_SECRET=your_oss_access_key_secret
   OSS_ENDPOINT=your_oss_endpoint
   # Example: oss-cn-hangzhou.aliyuncs.com
   OSS_BUCKET_NAME=your_oss_bucket_name
   
   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_DB=0
   REDIS_PASSWORD=your_redis_password_if_needed
   ```
   
   **Important**: 
   - Replace all placeholder values with your actual credentials
   - The `OPENAI_API_KEY` is required for the application to work
   - The `DATABASE_URL` must point to an existing database (created in step 4)
   - Make sure you've run the database migrations before starting the server

## Running the Application

**Important**: This application requires THREE services to run:
1. **GraphQL Backend Service** (for authentication and business logic) - Port 7001
2. **Python FastAPI Server** (for script execution) - Port 8000
3. **Frontend Quasar App** - Port 9000

### Start the GraphQL Backend Service (REQUIRED for Login)

The GraphQL service handles authentication, user management, and all business logic.

1. **Navigate to GraphQL service directory:**
   ```powershell
   cd ai-business-consultant-service
   ```

2. **Install dependencies (if not already installed):**
   ```powershell
   npm install
   ```

3. **Create a `.env` file** in the `ai-business-consultant-service` directory with your database and other configuration:
   ```env
   # Database Configuration (REQUIRED)
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=your_db_user
   DB_PASSWORD=your_db_password
   DB_DATABASE=easiio_ai_consultant
   
   # JWT Secret (REQUIRED for authentication)
   JWT_SECRET=your_jwt_secret_key_here
   
   # Redis Configuration
   REDIS_URL=redis://localhost:6379
   
   # Server Port (optional, defaults to 7001)
   PORT=7001
   
   # Add other required environment variables as needed
   ```

4. **Start the GraphQL server:**
   ```powershell
   npm run dev
   ```
   
   Or for production:
   ```powershell
   npm run build
   npm start
   ```
   
   The GraphQL server will start on `http://localhost:7001`
   The GraphQL endpoint will be available at `http://localhost:7001/graphql`

**Note**: The frontend is now configured to use `http://localhost:7001/graphql` by default. 
If you need to use a different URL, you can modify `src/graphql/client.ts` or set the `VUE_APP_GRAPHQL_URL` environment variable.

**For detailed GraphQL service setup instructions, see:** `../ai-business-consultant-service/SETUP.md`

### Start the Backend Server (Python FastAPI)

1. **Navigate to backend directory:**
   ```powershell
   cd ai-business-consultant-py
   ```

2. **Activate virtual environment (REQUIRED):**
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   
   **Important**: You MUST activate the virtual environment before running the server. 
   You should see `(venv)` at the beginning of your PowerShell prompt after activation.
   
   If you get a "ModuleNotFoundError", it means the virtual environment is not activated.

3. **Start the FastAPI server:**
   ```powershell
   python pythonhttpserver.py
   ```
   
   **Note**: Make sure you're using the Python from the virtual environment. 
   You can verify by checking: `python --version` and `where python` should point to the venv.
   
   The server will start on `http://localhost:8000`
   
   **Alternative**: You can also use uvicorn directly:
   ```powershell
   uvicorn pythonhttpserver:app --reload --host 0.0.0.0 --port 8000
   ```

### Start the Frontend Development Server

1. **Open a new PowerShell window** (keep the backend running)

2. **Navigate to frontend directory:**
   ```powershell
   cd ai-business-consultant
   ```

3. **Start the Quasar development server:**
   ```powershell
   yarn start
   ```
   
   Or use the Quasar CLI directly:
   ```powershell
   quasar dev
   ```
   
   The frontend will be available at `http://localhost:9000` (or the port specified in quasar.conf.js)

## Development Commands

### Frontend Commands

```powershell
# Install dependencies
yarn install

# Start development server
yarn start
# or
quasar dev

# Lint the files
yarn lint

# Build for production
quasar build
```

### Backend Commands

```powershell
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Run the server
python pythonhttpserver.py

# Install new package
pip install package_name

# Update requirements.txt
pip freeze > requirements.txt
```

## Configuration

### Frontend Configuration

- Edit `quasar.conf.js` to customize Quasar settings
- Edit `package.json` to modify dependencies and scripts

### GraphQL Endpoint Configuration

The frontend GraphQL client is configured in `src/graphql/client.ts`. By default, it uses:
- **Local development**: `http://localhost:7001/graphql`

To use the remote production server instead, you can:
1. **Option 1**: Modify `src/graphql/client.ts` and change the default URL to `https://abc.easiio.com/graphql`
2. **Option 2**: Set the `VUE_APP_GRAPHQL_URL` environment variable before starting the frontend:
   ```powershell
   $env:VUE_APP_GRAPHQL_URL="https://abc.easiio.com/graphql"
   yarn start
   ```

### Backend Configuration

- Edit `config.py` for database and other backend settings
- Create/update `.env` file for environment variables:
  - `DATABASE_URL`: Database connection string

## Troubleshooting

### Common Windows Issues

1. **PowerShell Execution Policy Error**
   ```
   Solution: Run as Administrator
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Node modules installation fails**
   ```
   Solution: Clear cache and reinstall
   yarn cache clean
   Remove node_modules folder
   yarn install
   ```

3. **Python virtual environment activation fails**
   ```
   Solution: Use full path or check Python installation
   .\venv\Scripts\python.exe
   ```

4. **Port already in use**
   ```
   Solution: Change port in quasar.conf.js or kill the process
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F
   ```

5. **Native module compilation errors**
   ```
   Solution: Install Windows Build Tools
   npm install --global windows-build-tools
   ```

6. **Path too long error**
   ```
   Solution: Enable long paths in Windows
   Run as Administrator:
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```

7. **OpenAI API Key Error**
   ```
   Error: OpenAIError: The api_key client option must be set...
   
   Solution:
   1. Create a .env file in the ai-business-consultant-py directory
   2. Add your OpenAI API key:
      OPENAI_API_KEY=sk-your-actual-api-key-here
   3. Make sure the .env file is in the correct location (ai-business-consultant-py folder)
   4. Restart the Python server after creating/updating the .env file
   
   To verify the .env file is being loaded:
   - Check that the file exists: ai-business-consultant-py\.env
   - Make sure there are no spaces around the = sign
   - Ensure the file is saved with UTF-8 encoding
   ```

8. **ModuleNotFoundError (e.g., "No module named 'oss2'")**
   ```
   Error: ModuleNotFoundError: No module named 'oss2'
   
   Solution:
   1. Make sure the virtual environment is activated:
      .\venv\Scripts\Activate.ps1
      You should see (venv) at the start of your prompt
   
   2. Verify you're using the venv's Python:
      where python
      Should show: ...\ai-business-consultant-py\venv\Scripts\python.exe
   
   3. Install/reinstall all requirements:
      pip install -r requirements.txt
   
   4. Verify the package is installed:
      pip list | Select-String oss2
   
   5. If still not working, try reinstalling the specific package:
      pip install --force-reinstall oss2==2.19.1
   
   6. Make sure you're running the server from the correct directory with venv activated
   ```

## API Endpoints

The backend provides the following endpoints:

- `GET /list-services` - List available services
- `GET /list-functions/{service}` - List functions for a service
- `GET /execute/{service}/{script}/{function}` - Execute a function

## Production Build

### Frontend Production Build

```powershell
cd ai-business-consultant
quasar build
```

The built files will be in the `dist` directory.

### Backend Production Deployment

For production, use a proper ASGI server like Gunicorn with Uvicorn workers:

```powershell
pip install gunicorn
gunicorn pythonhttpserver:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Additional Resources

- [Quasar Framework Documentation](https://quasar.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Node.js Windows Installation Guide](https://nodejs.org/en/download/)
- [Python Windows Installation Guide](https://www.python.org/downloads/windows/)

## Support

For issues or questions, please check:
- Project documentation
- Quasar and FastAPI official documentation
- GitHub issues (if applicable)

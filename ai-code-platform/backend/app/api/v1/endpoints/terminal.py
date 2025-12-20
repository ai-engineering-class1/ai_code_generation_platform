from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import asyncio
import os
import sys
import shutil
import json
import httpx
from app.core.config import settings

router = APIRouter()

async def download_repo(owner: str, repo: str, branch: str, target_dir: str) -> str:
    """Download and extract a GitHub repository using the GitHub service.
    
    Args:
        owner: Repository owner
        repo: Repository name
        branch: Branch/ref to download
        target_dir: Target directory to extract to
        
    Returns:
        Path to the extracted repository folder
    """
    github_service_url = "http://103.98.213.149:8510"
    
    print(f"Downloading repo '{owner}/{repo}' (ref: {branch}) to '{target_dir}'...")
    
    try:
        # Call GitHub service download-repo endpoint
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                f"{github_service_url}/download-repo",
                params={"owner": owner, "repo": repo, "ref": branch},
                headers={"Accept": "application/zip"}
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to download repo: {response.status_code} {response.text}")
            
            # Create target directory
            os.makedirs(target_dir, exist_ok=True)
            
            # Save zip file
            zip_path = os.path.join(target_dir, "repo.zip")
            with open(zip_path, "wb") as f:
                f.write(response.content)
            
            print(f"Repo downloaded to {zip_path}. Unzipping...")
            
            # Extract zip file
            if os.name == 'nt':  # Windows
                try:
                    # Try tar first (available in modern Windows)
                    import subprocess
                    subprocess.run(
                        ["tar", "-xf", zip_path, "-C", target_dir],
                        check=True,
                        capture_output=True
                    )
                except Exception as e:
                    print(f"tar failed, trying PowerShell Expand-Archive... {e}")
                    # Fallback to PowerShell
                    subprocess.run(
                        ["powershell", "-command", f"Expand-Archive -Path '{zip_path}' -DestinationPath '{target_dir}' -Force"],
                        check=True,
                        capture_output=True
                    )
            else:  # Linux/Mac
                import subprocess
                subprocess.run(
                    ["unzip", "-o", zip_path, "-d", target_dir],
                    check=True,
                    capture_output=True
                )
            
            print("Unzip complete.")
            
            # GitHub zips extract to a subfolder like 'owner-repo-sha/'
            # Find this subfolder and return its path
            entries = os.listdir(target_dir)
            for entry in entries:
                entry_path = os.path.join(target_dir, entry)
                if os.path.isdir(entry_path) and entry not in ['.', '..']:
                    print(f"Found extracted folder: {entry_path}")
                    return entry_path
            
            # If no subfolder found, return the target directory
            return target_dir
            
    except Exception as e:
        print(f"Error downloading repo: {e}")
        import traceback
        traceback.print_exc()
        raise

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, cols: int = Query(80), rows: int = Query(24), taskId: str = Query(None)):
    await websocket.accept()

    session = RestrictedShell(websocket, rows=rows, cols=cols, task_id=taskId)
    await session.run()

class RestrictedShell:
    def __init__(self, websocket: WebSocket, rows: int = 24, cols: int = 80, task_id: str = None):
        self.websocket = websocket
        self.safe_mode = settings.TERMINAL_SAFE_MODE
        self.loop = asyncio.get_running_loop()
        self.proc_obj = None
        self.buffer = ""
        self.dims = (rows, cols)
        self.task_id = task_id
        
        # PTY State for Linux
        self.master_fd = None
        
        # Determine strict shell command or path for claude
        self.claude_path = self._find_claude()
        
        # Move CWD up one level if we are in 'backend' to serve the project root
        self.cwd = os.getcwd()
        if os.path.basename(self.cwd) == 'backend':
            self.cwd = os.path.dirname(self.cwd)
            
        self.use_pty = False
        if os.name == 'nt':
            try:
                from winpty import PtyProcess
                self.use_pty = True
                self.PtyProcess = PtyProcess
            except ImportError:
                print("WARNING: pywinpty not found.")

        # Determine Shell Title based on OS
        self.shell_title = "PowerShell Console" if os.name == 'nt' else "Bash Console"


    def _find_claude(self):
        # Try to find claude in path
        return shutil.which("claude") or "claude"

    async def spawn_full_shell(self, working_dir):
        if os.name == 'nt':
            shell_cmd = "powershell.exe"
            shell_path = shutil.which(shell_cmd)
            if not shell_path:
                shell_path = r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
        else:
            shell_cmd = "bash"
            shell_path = shutil.which(shell_cmd) or "/bin/bash"
            
        # Add arguments to suppress banner and profile for a cleaner experience
        args = [shell_path]
        if "powershell" in shell_path.lower():
            args.extend(["-NoLogo", "-NoProfile"])
            
        # Use self.cwd instead of arguments
        await self.spawn_process(args)

    async def run(self):
        try:
             # Send Setup Packet
            await self.send_json({
                "type": "setup",
                "title": self.shell_title,
                "safe_mode": self.safe_mode
            })

            # Download repository if taskId is provided (OpenSpec Editor context)
            if self.task_id:
                try:
                    await self.send_output(f"\r\n\x1b[36m--- Downloading repository for code context ---\x1b[0m\r\n")
                    
                    # Define paths
                    # Target: backend/temp/{taskId}/codebase/simplest-repo
                    base_dir = os.getcwd()
                    if os.path.basename(base_dir) == 'backend':
                        base_dir = os.path.dirname(base_dir)
                    
                    codebase_dir = os.path.join(base_dir, "backend", "temp", self.task_id, "codebase")
                    repo_target_dir = os.path.join(codebase_dir, "simplest-repo")
                    
                    # Download from https://github.com/DrLinAITeam2/simplest-repo/
                    owner = "DrLinAITeam2"
                    repo = "simplest-repo"
                    branch = "main"
                    
                    await self.send_output(f"Downloading {owner}/{repo} (branch: {branch})...\r\n")
                    
                    # Download and extract
                    extracted_path = await download_repo(owner, repo, branch, repo_target_dir)
                    
                    await self.send_output(f"\x1b[32m✓ Repository downloaded successfully\x1b[0m\r\n")
                    
                    # Update working directory to the simplest-repo folder
                    # This folder contains:
                    #   - DrLinAITeam2-simplest-repo-{hash}/ (the extracted repo with openspec/)
                    # Both repo code and OpenSpec files are accessible from this location
                    self.cwd = repo_target_dir
                    
                    await self.send_output(f"Working directory: {self.cwd}\r\n")
                    
                except Exception as e:
                    await self.send_output(f"\x1b[31mWarning: Failed to download repository: {e}\x1b[0m\r\n")
                    # Continue anyway - terminal will still work

            if self.safe_mode:
                # Initial banner
                await self.send_output(f"\r\n\x1b[36m--- AI Platform Restricted Terminal ---\x1b[0m\r\n")
                await self.send_output(f"Allowed commands: \x1b[33mclaude, openspec\x1b[0m, clear, exit, help\r\n")
                if not self.claude_path:
                     await self.send_output(f"\x1b[31mWarning: 'claude' executable not found in PATH.\x1b[0m\r\n")
                
                await self.send_prompt()
            else:
                 # Full Mode
                # Clear screen to sync PTY (0,0) with Frontend (0,0)
                await self.send_output("\x1b[2J\x1b[H")
                # Removed text message to prevent PTY/Frontend coordinate mismatch
                # Use self.cwd directly
                await self.spawn_full_shell(self.cwd)

            while True:
                raw_data = await self.websocket.receive_text()
                
                try:
                    message = json.loads(raw_data)
                    msg_type = message.get("type", "")
                    
                    if msg_type == "resize":
                        self.dims = (message.get("rows", 24), message.get("cols", 80))
                        await self.handle_resize()
                                 
                    elif msg_type == "input":
                        data = message.get("data", "")
                        await self.handle_input(data)
                        
                except json.JSONDecodeError:
                    # Fallback
                    await self.handle_input(raw_data)
                    
        except WebSocketDisconnect:
            print("WebSocket disconnected")
        except Exception as e:
            print(f"Shell Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            self.kill_process()

    async def handle_resize(self):
        # Universal resize handler
        rows, cols = self.dims

        
        # Windows PTY
        if self.proc_obj and self.use_pty and os.name == 'nt':
            try:
                self.proc_obj.set_winsize(rows, cols)
            except:
                pass
        
        # Linux PTY
        if self.proc_obj and self.master_fd is not None and os.name != 'nt':
            try:
                import termios
                import struct
                import fcntl
                # struct winsize { unsigned short ws_row; unsigned short ws_col; ... }
                winsize = struct.pack("HHHH", rows, cols, 0, 0)
                fcntl.ioctl(self.master_fd, termios.TIOCSWINSZ, winsize)
            except Exception as e:
                print(f"Linux resize error: {e}")

    async def handle_input(self, data: str):
        # If process is running, passthrough
        if self.proc_obj:
            if self.use_pty and os.name == 'nt':
                 if self.proc_obj.isalive():
                    self.proc_obj.write(data)
                 else:
                    self.proc_obj = None
                    if self.safe_mode:
                        await self.send_prompt()
                    else:
                        await self.websocket.close()
            elif os.name != 'nt' and self.master_fd is not None:
                # Linux PTY Write
                try:
                    os.write(self.master_fd, data.encode())
                except OSError:
                    # Process likely dead
                    pass
            else:
                 # Standard subprocess fallback (rare)
                 if self.proc_obj.poll() is None:
                    if self.proc_obj.stdin:
                        try:
                            self.proc_obj.stdin.write(data.encode())
                            self.proc_obj.stdin.flush()
                        except:
                            pass
                 else:
                    self.proc_obj = None
                    if self.safe_mode:
                        await self.send_prompt()
                    else:
                        await self.websocket.close()
            return

        # Local Line Editing for shell mode
        for char in data:
            if char == '\r': # Enter
                await self.send_output("\r\n")
                cmd = self.buffer.strip()
                self.buffer = ""
                if cmd:
                    await self.execute_command(cmd)
                else:
                    await self.send_prompt()
            elif char == '\x7f' or char == '\b': # Backspace
                if len(self.buffer) > 0:
                    self.buffer = self.buffer[:-1]
                    # Backspace, Space, Backspace to visually delete
                    await self.send_output("\b \b")
            elif ord(char) >= 32: # Printable
                self.buffer += char
                await self.send_output(char)

    async def execute_command(self, cmd_line: str):
        try:
            import shlex
            parts = shlex.split(cmd_line)
        except:
            parts = cmd_line.split()
            
        if not parts:
            await self.send_prompt()
            return

        base_cmd = parts[0].lower()
        
        # Allowed commands
        if base_cmd in ['claude', 'openspec']:
            await self.spawn_process(parts)
        elif base_cmd in ['cls', 'clear']:
            await self.send_output("\x1b[2J\x1b[H") # Clear screen ANSI
            await self.send_prompt()
        elif base_cmd == 'exit':
            await self.websocket.close()
        elif base_cmd == 'help':
            await self.send_output("Available commands:\r\n  claude [args]  - Run Claude CLI\r\n  openspec [args] - Run OpenSpec CLI\r\n  clear, cls     - Clear screen\r\n  exit           - Close terminal\r\n  help           - Show this help\r\n")
            await self.send_prompt()
        else:
            await self.send_output(f"\x1b[31mError: Command '{base_cmd}' is not allowed.\x1b[0m\r\n")
            await self.send_prompt()

    async def spawn_process(self, args):
        try:
            print(f"Spawning: {args} in {self.cwd}")
            
            # Windows Handling
            if self.use_pty and os.name == 'nt':
                env = os.environ.copy()
                env["TERM"] = "xterm-256color"
                env["COLORTERM"] = "truecolor"
                
                self.proc_obj = self.PtyProcess.spawn(
                    args,
                    cwd=self.cwd,
                    dimensions=self.dims,
                    env=env
                )
                
                import threading
                thread = threading.Thread(target=self.read_win_pty, daemon=True)
                thread.start()
                print(f"DEBUG: Reader thread started for PID {self.proc_obj.pid}")
                
                # Force a resize to ensure PTY sync
                await self.handle_resize()

            # Linux/Mac Handling with real PTY
            elif os.name != 'nt':
                import pty
                import subprocess
                
                # Create master/slave pair
                self.master_fd, slave_fd = pty.openpty()
                
                env = os.environ.copy()
                env["TERM"] = "xterm-256color"
                env["COLORTERM"] = "truecolor"
                
                self.proc_obj = subprocess.Popen(
                    args,
                    # stdin/out/err to the SLAVE side
                    stdin=slave_fd,
                    stdout=slave_fd,
                    stderr=slave_fd,
                    cwd=self.cwd,
                    env=env,
                    # detaches from parent TTY so it uses the new one properly
                    start_new_session=True 
                )
                
                # Close slave in parent so EOF is detected correctly when child closes it
                os.close(slave_fd)
                
                # Apply initial size
                await self.handle_resize()

                import threading
                thread = threading.Thread(target=self.read_linux_pty, daemon=True)
                thread.start()
                
            else:
                # Fallback (Should be rare now for Linux/Windows)
                import subprocess
                self.proc_obj = subprocess.Popen(
                    args,
                    cwd=self.cwd,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    bufsize=0
                )
                import threading
                thread = threading.Thread(target=self.read_pipe, daemon=True)
                thread.start()
            
        except Exception as e:
            await self.send_output(f"Failed to start command: {e}\r\n")
            await self.send_prompt()

    def read_win_pty(self):
        try:
            while self.proc_obj and self.proc_obj.isalive():
                try:
                    text = self.proc_obj.read(1024)
                    if not text: continue
                    asyncio.run_coroutine_threadsafe(self.send_output(text), self.loop)
                except EOFError:
                    break
                except Exception:
                    break
        finally:
            print("DEBUG: Reader thread exiting")
            self._on_proc_exit()

    def read_linux_pty(self):
        try:
            while self.proc_obj:
                try:
                    # Use os.read for file descriptor
                    data = os.read(self.master_fd, 4096)
                    if not data: 
                        break # EOF
                    
                    text = data.decode('utf-8', errors='replace')
                    asyncio.run_coroutine_threadsafe(self.send_output(text), self.loop)
                except OSError:
                    # E.g. Input/output error on close
                    break
                except Exception as e:
                    print(f"Linux read error: {e}")
                    break
                    
                # Check if process died
                if self.proc_obj.poll() is not None:
                    # One last read maybe?
                    break
        finally:
            self._on_proc_exit()

    def read_pipe(self):
        try:
            while self.proc_obj and self.proc_obj.poll() is None:
                data = self.proc_obj.stdout.read(4096)
                if data:
                    text = data.decode('utf-8', errors='replace')
                    asyncio.run_coroutine_threadsafe(self.send_output(text), self.loop)
                else:
                    break
        except Exception:
            pass
        finally:
            self._on_proc_exit()

    def _on_proc_exit(self):
        # Cleanup
        if self.master_fd is not None:
            try:
                os.close(self.master_fd)
            except:
                pass
            self.master_fd = None
            
        self.proc_obj = None
        
        if self.safe_mode:
            # Auto-clear screen removed to preserve command output
            # asyncio.run_coroutine_threadsafe(self.send_output("\x1b[2J\x1b[H"), self.loop)
            
            # Signal prompt return
            asyncio.run_coroutine_threadsafe(self.send_prompt(), self.loop)
        else:
            # In full mode, if shell exits, close connection
            asyncio.run_coroutine_threadsafe(self.websocket.close(), self.loop)

    async def send_output(self, text: str):
        try:
            await self.websocket.send_json({"type": "output", "data": text})
        except:
            pass

    async def send_json(self, data: dict):
        try:
            await self.websocket.send_json(data)
        except:
            pass
            
    async def send_prompt(self):
        # ANSI color for prompt
        await self.send_output("\r\n\x1b[32mrestricted> \x1b[0m")

    def kill_process(self):
        print("DEBUG: kill_process called")
        if self.master_fd is not None:
            try:
                os.close(self.master_fd)
            except:
                pass
            self.master_fd = None

        if self.proc_obj:
            try:
                print(f"DEBUG: Terminating process {self.proc_obj}")
                if self.use_pty and os.name == 'nt':
                    self.proc_obj.close()
                else:
                    self.proc_obj.terminate()
                print("DEBUG: Process terminated successfully")
            except Exception as e:
                print(f"DEBUG: Error terminating process: {e}")
            self.proc_obj = None



from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import os
import sys
import shutil

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Check for pywinpty on Windows
    use_pty = False
    if os.name == 'nt':
        try:
            from winpty import PtyProcess
            use_pty = True
            print("DEBUG: Using pywinpty for pseudo-console support")
        except ImportError:
            print("WARNING: pywinpty not found, falling back to basic pipes. Interactive CLIs may fail.")
            use_pty = False

    # Determine shell based on OS
    if os.name == 'nt':
        shell_cmd = "powershell.exe"
        shell_path = shutil.which(shell_cmd)
        if not shell_path:
            shell_path = r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
    else:
        shell_cmd = "bash"
        shell_path = shutil.which(shell_cmd) or "/bin/bash"

    print(f"DEBUG: Attempting to spawn shell: {shell_path}")
    
    import threading
    import asyncio


    # Get current loop to schedule updates from thread
    loop = asyncio.get_running_loop()
    
    proc_obj = None

    try:
        if use_pty and os.name == 'nt':
            # Create PTY process with proper environment
            # This is crucial for interactive tools like 'claude', 'vim', etc.
            env = os.environ.copy()
            env["TERM"] = "xterm-256color"
            env["COLORTERM"] = "truecolor"
            env["PYTHONIOENCODING"] = "utf-8"
            
            proc_obj = PtyProcess.spawn(
                [shell_path, "-NoLogo"],
                dimensions=(24, 80),
                env=env
            )
            print(f"DEBUG: PTY Subprocess created with PID: {proc_obj.pid}")

        else:
            # Fallback to standard subprocess
            import subprocess
            proc_obj = subprocess.Popen(
                [shell_path, "-NoLogo"] if os.name == 'nt' else [shell_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT, 
                bufsize=0, 
            )
            print(f"DEBUG: Standard Subprocess created with PID: {proc_obj.pid}")

        # Thread function to read stdout
        def read_stream():
            try:
                while True:
                    data = None
                    if use_pty and os.name == 'nt':
                        if not proc_obj.isalive():
                            break
                        try:
                            # read(bytes) checks for blocking
                            data = proc_obj.read(1024).encode('utf-8')
                        except EOFError:
                            break
                    else:
                        if proc_obj.poll() is not None:
                            break
                        data = proc_obj.stdout.read(4096)
                    
                    if not data:
                        break
                        
                    try:
                        # Decode
                        encoding = 'utf-8' # winpty output is usually already unicode string, but .read() might return str
                        # Note: winpty.read() returns STRING, not bytes.
                        text = ""
                        if use_pty and os.name == 'nt':
                             # proc_obj.read() returns str directly
                             # I did .encode() above to match 'data' variable semantics if I wanted to share code
                             # Let's fix loop to handle str vs bytes
                             pass 
                        # RE-DOING LOOP LOGIC FOR CLARITY BELOW
                    except Exception as _e:
                        pass
            except Exception as _e:
                pass
        
        # Simpler separate readers to avoid complexity
        def read_pty():
            try:
                while proc_obj.isalive():
                    try:
                        # read returns string
                        text = proc_obj.read(1024)
                        if not text:
                            continue
                        asyncio.run_coroutine_threadsafe(websocket.send_text(text), loop)
                    except EOFError:
                        break
            except Exception as e:
                print(f"PTY Reader thread error: {e}")

        def read_pipe():
            try:
                while True:
                    if proc_obj.poll() is not None:
                         # Flush remaining
                         remaining = proc_obj.stdout.read()
                         if remaining:
                            text = remaining.decode('cp437' if os.name == 'nt' else 'utf-8', errors='replace')
                            asyncio.run_coroutine_threadsafe(websocket.send_text(text), loop)
                         break
                    
                    data = proc_obj.stdout.read(4096)
                    if not data:
                        break
                    text = data.decode('cp437' if os.name == 'nt' else 'utf-8', errors='replace')
                    asyncio.run_coroutine_threadsafe(websocket.send_text(text), loop)
            except Exception as e:
                print(f"Pipe Reader thread error: {e}")

        # Start reading
        reader_target = read_pty if (use_pty and os.name == 'nt') else read_pipe
        reader = threading.Thread(target=reader_target, daemon=True)
        reader.start()

        try:
            while True:
                # Receive data from client
                data = await websocket.receive_text()
                
                if use_pty and os.name == 'nt':
                    # PTY write (string)
                    # Note: xterm.js sends \r for Enter. PTY usually expects \r or \n.
                    proc_obj.write(data)
                else:
                    # Pipe write (bytes)
                    if proc_obj.stdin:
                        try:
                            proc_obj.stdin.write(data.encode())
                            proc_obj.stdin.flush()
                        except BrokenPipeError:
                            break
                        except Exception as e:
                            print(f"Error writing to stdin: {e}")
                            break
                    
        except WebSocketDisconnect:
            print("WebSocket disconnected")
        except Exception as e:
            print(f"WebSocket error: {e}")
        finally:
            print("DEBUG: Cleaning up process")
            if use_pty and os.name == 'nt':
                proc_obj.close() 
            else:
                 proc_obj.terminate()
            
    except Exception as e:
        import traceback
        print(f"Terminal failed to start: {e}")
        traceback.print_exc()
        await websocket.close()

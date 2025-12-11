from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import os
import sys
import shutil

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
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
    
    import subprocess
    import threading

    # Get current loop to schedule updates from thread
    loop = asyncio.get_running_loop()

    try:
        # Use subprocess.Popen for synchronous process creation
        # This works regardless of the asyncio event loop type
        process = subprocess.Popen(
            [shell_path, "-NoLogo"] if os.name == 'nt' else [shell_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, # Merge stderr
            bufsize=0, # Unbuffered
        )
        
        print(f"DEBUG: Subprocess created with PID: {process.pid}")

        # Thread function to read stdout
        def read_stream():
            try:
                while True:
                    if process.poll() is not None:
                        break
                    
                    # Read larger chunks for better performance
                    data = process.stdout.read(4096)
                    if not data:
                        break
                        
                    try:
                        # Decode
                        text = data.decode('cp437' if os.name == 'nt' else 'utf-8', errors='replace')
                        # Schedule sending to websocket on the main event loop
                        future = asyncio.run_coroutine_threadsafe(websocket.send_text(text), loop)
                        # Optional: check for exceptions in future? usually fire and forget is okay here
                    except Exception as e:
                        print(f"Error sending data to WS from thread: {e}")
                        break
            except Exception as e:
                print(f"Reader thread error: {e}")
            finally:
                print("DEBUG: Reader thread exiting")

        # Start reading stdout in background thread
        reader = threading.Thread(target=read_stream, daemon=True)
        reader.start()

        try:
            while True:
                # Receive data from client (awaiting here yields control to loop)
                data = await websocket.receive_text()
                
                # Write to stdin synchronously
                if process.stdin:
                    try:
                        process.stdin.write(data.encode())
                        process.stdin.flush()
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
            process.terminate()
            # Wait a bit or kill
            # process.wait() # Blocking wait might hang loop if not careful, but terminate should help
            
    except Exception as e:
        import traceback
        print(f"Terminal failed to start: {e}")
        traceback.print_exc()
        await websocket.close()

import os
import json
from pathlib import Path
from dotenv import load_dotenv

def setup():
    """
    Sets up the Codex authentication configuration file.
    Reads OPENAI_API_KEY from environment and writes to ~/.codex/auth.json.
    """
    # Load .env file explicitly for cases where Docker didn't inject it but file exists
    load_dotenv()
    
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("OPENAI_API_KEY environment variable not found. Skipping Codex auth setup.")
        return

    try:
        # Determine the user's home directory
        home = Path.home()
        codex_dir = home / ".codex"
        
        # Create directory if it doesn't exist
        codex_dir.mkdir(parents=True, exist_ok=True)
        
        auth_file = codex_dir / "auth.json"
        
        # Write the configuration
        config = {"OPENAI_API_KEY": api_key}
        with open(auth_file, "w") as f:
            json.dump(config, f, indent=2)
            
        print(f"Successfully configured Codex auth at {auth_file}")
        
    except Exception as e:
        print(f"Error setting up Codex auth: {e}")

if __name__ == "__main__":
    setup()

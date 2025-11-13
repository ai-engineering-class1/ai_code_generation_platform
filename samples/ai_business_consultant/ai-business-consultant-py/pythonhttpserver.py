from fastapi import FastAPI, HTTPException
from pathlib import Path
import importlib.util
import sys
import inspect

app = FastAPI()

# Define directories for different services
SCRIPT_DIRECTORIES = {
    "service1": "./scripts/testapi",
    "service2": "./scripts/videoscript",
    "service3": "./scripts/aibusiness"
}

def load_script_functions(script_path):
    module_name = script_path.stem
    spec = importlib.util.spec_from_file_location(module_name, script_path)
    if spec and spec.loader:
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
        functions = {name: func for name, func in inspect.getmembers(module, inspect.isfunction)}
        return functions
    return {}

# Discover scripts and functions
script_functions = {}
for service, directory in SCRIPT_DIRECTORIES.items():
    script_functions[service] = {}
    path = Path(directory)
    if path.exists():
        for script in path.glob("*.py"):
            script_functions[service][script.stem] = load_script_functions(script)

@app.get("/list-services")
def list_services():
    return {"available_services": list(SCRIPT_DIRECTORIES.keys())}

@app.get("/list-functions/{service}")
def list_functions(service: str):
    if service not in script_functions:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"functions": {script: list(funcs.keys()) for script, funcs in script_functions[service].items()}}

@app.get("/execute/{service}/{script}/{function}")
def execute_function(service: str, script: str, function: str, args: dict = {}):
    if service not in script_functions or script not in script_functions[service]:
        raise HTTPException(status_code=404, detail="Service or script not found")
    if function not in script_functions[service][script]:
        raise HTTPException(status_code=404, detail="Function not found")
    
    try:
        result = script_functions[service][script][function](**args)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

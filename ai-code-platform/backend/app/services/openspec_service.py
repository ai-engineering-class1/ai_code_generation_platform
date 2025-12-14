"""OpenSpec file handling service."""
import zipfile
import io
import os
import tempfile
from pathlib import Path
from typing import Dict, Any, List, Tuple
from uuid import uuid4


class OpenSpecService:
    """Service for handling OpenSpec file operations."""
    
    def __init__(self, temp_dir: str = "./temp"):
        self.temp_dir = Path(temp_dir)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
    
    def get_workspace_root(self, task_id: str = None, use_system_temp: bool = True) -> Path:
        """
        Get the workspace root directory for OpenSpec files.
        
        Args:
            task_id: Optional task ID to create task-specific workspace
            use_system_temp: If True, use system temp dir; otherwise use self.temp_dir
        
        Returns:
            Path to workspace root (e.g., /tmp/{task_id}/codebase/simpestrepo)
        """
        if use_system_temp:
            # Use system temp directory with task_id at the root
            base = Path(tempfile.gettempdir())
        else:
            # Use configured temp_dir
            base = self.temp_dir
        
        if task_id:
            workspace = base / task_id / "codebase" / "simpestrepo"
        else:
            workspace = base / "default" / "codebase" / "simpestrepo"
        
        workspace.mkdir(parents=True, exist_ok=True)
        return workspace
    
    def get_openspec_changes_dir(self, task_id: str = None, use_system_temp: bool = True) -> Path:
        """Get the openspec/changes directory within the workspace."""
        workspace = self.get_workspace_root(task_id, use_system_temp)
        changes_dir = workspace / "openspec" / "changes"
        changes_dir.mkdir(parents=True, exist_ok=True)
        return changes_dir
    
    def write_spec_file(self, task_id: str, relative_path: str, content: str, use_system_temp: bool = True):
        """
        Write a specification file to the workspace.
        
        Args:
            task_id: Task ID for workspace isolation
            relative_path: Relative path from repo root (e.g., "openspec/changes/update-xxx/task.md")
            content: File content to write
            use_system_temp: If True, use system temp dir
        """
        workspace = self.get_workspace_root(task_id, use_system_temp)
        file_path = workspace / relative_path
        
        # Ensure parent directories exist
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write the file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return str(file_path)
    
    def build_tree_from_directory(self, task_id: str, use_system_temp: bool = True) -> Dict[str, Any]:
        """
        Build a specTree from existing files in the workspace's openspec/changes directory.
        
        Returns:
            Dict with 'specTree' and 'rootSpec' keys, similar to extract_content
        """
        changes_dir = self.get_openspec_changes_dir(task_id, use_system_temp)
        
        if not changes_dir.exists():
            return {"specTree": [], "rootSpec": None}
        
        spec_tree = []
        
        def build_node_from_path(path: Path, relative_to: Path) -> Dict[str, Any]:
            """Recursively build tree nodes from filesystem."""
            rel_path = path.relative_to(relative_to)
            
            node = {
                "id": str(uuid4()),
                "name": path.name,
                "path": str(rel_path).replace("\\", "/"),
                "type": "directory" if path.is_dir() else "specification",
                "content": "",
                "children": [],
                "suggestions": []
            }
            
            if path.is_file() and path.suffix == '.md':
                # Read content
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        node["content"] = f.read()
                except Exception as e:
                    print(f"Error reading {path}: {e}")
            elif path.is_dir():
                # Mark special directories
                if path.name.lower() == "changes":
                    node["type"] = "change"
                
                # Recursively add children
                try:
                    for child in sorted(path.iterdir()):
                        if child.name.startswith('.') or child.name == '__pycache__':
                            continue
                        node["children"].append(build_node_from_path(child, relative_to))
                except Exception as e:
                    print(f"Error listing {path}: {e}")
            
            return node
        
        # Start from openspec directory (parent of changes)
        openspec_dir = changes_dir.parent
        if openspec_dir.exists():
            for item in sorted(openspec_dir.iterdir()):
                if item.name.startswith('.'):
                    continue
                spec_tree.append(build_node_from_path(item, openspec_dir.parent))
        
        return {
            "specTree": spec_tree,
            "rootSpec": None
        }
    
    def validate_structure(self, file_content: bytes) -> Dict[str, Any]:
        """Validate OpenSpec zip structure."""
        try:
            with zipfile.ZipFile(io.BytesIO(file_content)) as zip_file:
                entries = zip_file.namelist()
                
                has_openspec_dir = False
                has_changes_dir = False
                has_specs_dir = False
                has_project_md = False
                
                for entry_path in entries:
                    entry_lower = entry_path.lower()
                    if 'openspec/' in entry_lower or entry_lower.startswith('openspec'):
                        has_openspec_dir = True
                    if 'changes/' in entry_lower:
                        has_changes_dir = True
                    if 'specs/' in entry_lower:
                        has_specs_dir = True
                    if 'project.md' in entry_lower:
                        has_project_md = True
                    
                    # Also check for any markdown file to be permissive
                    if entry_lower.endswith('.md'):
                        has_project_md = True  # Treat as having project metadata for validation purposes
                
                # Debug print
                print(f"Validation keys: openspec={has_openspec_dir}, changes={has_changes_dir}, specs={has_specs_dir}, project={has_project_md}")
                
                return {
                    "isValid": has_openspec_dir or has_changes_dir or has_project_md or has_specs_dir,
                    "hasOpenspecDir": has_openspec_dir,
                    "hasChangesDir": has_changes_dir,
                    "hasSpecsDir": has_specs_dir,
                    "hasProjectMd": has_project_md,
                    "errors": []
                }
                
        except Exception as e:
            return {
                "isValid": False,
                "errors": [str(e)]
            }
    
    def export_changes_as_zip(self, task_id: str, use_system_temp: bool = True) -> bytes:
        """
        Export the openspec/changes directory as a zip file.
        
        Returns:
            bytes: Zip file content
        """
        changes_dir = self.get_openspec_changes_dir(task_id, use_system_temp)
        
        if not changes_dir.exists():
            # Return empty zip
            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
                pass
            return buffer.getvalue()
        
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Walk the changes directory
            for root, dirs, files in os.walk(changes_dir):
                for file in files:
                    file_path = Path(root) / file
                    # Calculate archive name relative to changes dir
                    arcname = str(file_path.relative_to(changes_dir.parent))
                    zf.write(file_path, arcname.replace("\\", "/"))
        
        return buffer.getvalue()
    
    def extract_content(self, file_content: bytes, task_id: str = None, write_to_disk: bool = False, use_system_temp: bool = True) -> Dict[str, Any]:
        """Extract OpenSpec content from zip file and build tree structure."""
        spec_tree = []
        
        try:
            with zipfile.ZipFile(io.BytesIO(file_content)) as zip_file:
                # Helper to find or create a node in the tree
                def find_or_create_node(tree: List[Dict], path_parts: List[str], full_path: str) -> Dict:
                    current_level = tree
                    current_path = ""
                    
                    for i, part in enumerate(path_parts):
                        is_file = (i == len(path_parts) - 1)
                        current_path = os.path.join(current_path, part).replace("\\", "/")
                        
                        # Find existing node
                        found = None
                        for node in current_level:
                            if node["name"] == part:
                                found = node
                                break
                        
                        if found:
                            if is_file:
                                return found
                            current_level = found["children"]
                        else:
                            # Create new node
                            new_node = {
                                "id": str(uuid4()),
                                "name": part,
                                "path": full_path if is_file else current_path,
                                "type": "file" if is_file else "directory",
                                "content": "",
                                "children": [],
                                "suggestions": []
                            }
                            
                            # Identify specific folder types for icon coloring
                            if not is_file:
                                if part.lower() == "changes":
                                    new_node["type"] = "change"
                            
                            current_level.append(new_node)
                            
                            if not is_file:
                                current_level = new_node["children"]
                            else:
                                return new_node

                for entry_path in sorted(zip_file.namelist()):
                    # Skip skipped directories/files
                    if entry_path.endswith('/') or '__MACOSX' in entry_path or entry_path.startswith('.'):
                        continue
                    
                    # Normalize path
                    path_parts = entry_path.strip('/').split('/')
                    file_name = path_parts[-1]
                    
                    # Only process markdown files, but let the tree builder handle structure
                    if file_name.endswith('.md'):
                        try:
                            content = zip_file.read(entry_path).decode('utf-8')
                            node = find_or_create_node(spec_tree, path_parts, entry_path)
                            node["content"] = content
                            node["type"] = "specification" # Mark files as specifications
                            
                            # Write to disk if requested
                            if write_to_disk and task_id:
                                # Normalize the path to be relative to repo root
                                # If path doesn't start with "openspec", prepend it
                                norm_path = entry_path.strip('/')
                                if not norm_path.startswith('openspec/'):
                                    norm_path = f"openspec/{norm_path}"
                                self.write_spec_file(task_id, norm_path, content, use_system_temp)
                        except Exception as e:
                            print(f"Error reading {entry_path}: {e}")
                            continue

            return {
                "specTree": spec_tree,
                "rootSpec": None
            }
            
        except Exception as e:
            raise Exception(f"Failed to extract OpenSpec content: {str(e)}")
    
    async def save_uploaded_file(
        self,
        project_id: str,
        filename: str,
        content: bytes
    ) -> str:
        """Save an uploaded file to the temp directory."""
        project_dir = self.temp_dir / project_id
        project_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = project_dir / filename
        with open(file_path, 'wb') as f:
            f.write(content)
        
        return str(file_path)

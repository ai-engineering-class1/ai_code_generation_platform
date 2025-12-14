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
            Path to workspace root (e.g., backend/temp/{task_id}/codebase/simplestrepo)
        """
        # For this project, the workspace must live under the backend's temp folder,
        # not the OS/system temp. `self.temp_dir` is configured by the endpoint module
        # (e.g. OpenSpecService("./temp")) so it resolves to backend/temp/.
        base = self.temp_dir
        
        if task_id:
            workspace = base / task_id / "codebase" / "simplestrepo"
        else:
            workspace = base / "default" / "codebase" / "simplestrepo"
        
        workspace.mkdir(parents=True, exist_ok=True)
        return workspace

    def get_openspec_uploads_dir(self, task_id: str = None, use_system_temp: bool = True) -> Path:
        """Get the openspec/uploads directory within the workspace (for storing uploaded zips)."""
        workspace = self.get_workspace_root(task_id, use_system_temp)
        uploads_dir = workspace / "openspec" / "uploads"
        uploads_dir.mkdir(parents=True, exist_ok=True)
        return uploads_dir
    
    def get_openspec_changes_dir(self, task_id: str = None, use_system_temp: bool = True) -> Path:
        """Get the openspec/changes directory within the workspace."""
        workspace = self.get_workspace_root(task_id, use_system_temp)
        changes_dir = workspace / "openspec" / "changes"
        changes_dir.mkdir(parents=True, exist_ok=True)
        return changes_dir

    def collect_changes_files_for_push(self, task_id: str, use_system_temp: bool = True) -> List[Dict[str, str]]:
        """
        Collect files under openspec/changes for pushing to GitHub.

        Returns a list of dicts:
          { "path": "openspec/changes/...", "content": "<utf-8 text>", "encoding": "utf-8" }

        Note: The GitHub proxy service expects text content. For now we only push
        UTF-8 decodable files and skip binaries (logging a warning).
        """
        changes_dir = self.get_openspec_changes_dir(task_id, use_system_temp)
        files: List[Dict[str, str]] = []

        if not changes_dir.exists():
            return files

        root = changes_dir.parent  # .../openspec
        for path in changes_dir.rglob("*"):
            if not path.is_file():
                continue

            rel = path.relative_to(root.parent)  # repo_root relative: openspec/changes/...
            rel_posix = str(rel).replace("\\", "/")

            try:
                raw = path.read_bytes()
                content = raw.decode("utf-8")
            except UnicodeDecodeError:
                print(f"Skipping non-utf8 file for push: {rel_posix}")
                continue
            except Exception as e:
                print(f"Failed reading file for push {rel_posix}: {e}")
                continue

            files.append({"path": rel_posix, "content": content, "encoding": "utf-8"})

        return files
    
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

    def write_repo_file_bytes(self, task_id: str, relative_path: str, content: bytes, use_system_temp: bool = True):
        """
        Write any file (binary or text) into the workspace.

        Args:
            task_id: Task ID for workspace isolation
            relative_path: Relative path from repo root
            content: Raw bytes to write
            use_system_temp: If True, use system temp dir (not used in this project)
        """
        workspace = self.get_workspace_root(task_id, use_system_temp)
        file_path = workspace / relative_path
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(file_path, 'wb') as f:
            f.write(content)
        return str(file_path)

    def normalize_to_changes_path(self, entry_path: str, change_set: str) -> str:
        """
        Normalize a zip entry path to always land under:
          openspec/changes/<change_set>/...

        If the zip already contains openspec/changes/<change_set>/..., keep it.
        If the zip contains openspec/<change_set>/..., rewrite to openspec/changes/<change_set>/...
        """
        p = (entry_path or "").strip("/").replace("\\", "/")
        if not p:
            return p

        # Already correct
        if p.startswith("openspec/changes/"):
            return p

        # Remove leading openspec/ if present
        if p.startswith("openspec/"):
            p2 = p[len("openspec/"):]
        else:
            p2 = p

        # If p2 already starts with changes/, keep under openspec/changes/...
        if p2.startswith("changes/"):
            return f"openspec/{p2}"

        # If p2 already starts with the change_set folder, don't duplicate it
        if change_set and (p2 == change_set or p2.startswith(f"{change_set}/")):
            return f"openspec/changes/{p2}"

        # Default: nest under the change set
        return f"openspec/changes/{change_set}/{p2}" if change_set else f"openspec/changes/{p2}"
    
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
        workspace = self.get_workspace_root(task_id, use_system_temp)
        changes_dir = self.get_openspec_changes_dir(task_id, use_system_temp)
        
        buffer = io.BytesIO()

        # Always return a valid zip (even if no files yet). Also include the
        # expected folder prefix so unzip tools show it.
        if not changes_dir.exists():
            with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
                zf.writestr("openspec/changes/", b"")
            return buffer.getvalue()
        
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Ensure folder exists in the zip even if empty
            zf.writestr("openspec/changes/", b"")

            # Walk the changes directory
            for root, dirs, files in os.walk(changes_dir):
                for file in files:
                    file_path = Path(root) / file
                    # Calculate archive name relative to repo root so zip contains:
                    #   openspec/changes/...
                    arcname = str(file_path.relative_to(workspace))
                    zf.write(file_path, arcname.replace("\\", "/"))
        
        return buffer.getvalue()
    
    def extract_content(
        self,
        file_content: bytes,
        task_id: str = None,
        write_to_disk: bool = False,
        use_system_temp: bool = True,
        change_set: str = ""
    ) -> Dict[str, Any]:
        """
        Extract OpenSpec content from zip file and build tree structure.

        When write_to_disk is True, unzip ALL files into:
          backend/temp/<taskId>/codebase/simplestrepo/openspec/changes/<change_set>/...

        The tree returned is still focused on Markdown (.md) files for editing.
        """
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
                    
                    # Normalize and force into openspec/changes/<change_set>/...
                    normalized_path = self.normalize_to_changes_path(entry_path, change_set)
                    if not normalized_path:
                        continue

                    path_parts = normalized_path.strip('/').split('/')
                    file_name = path_parts[-1]

                    # Always write ALL files to disk when requested (not only .md)
                    if write_to_disk and task_id:
                        try:
                            raw = zip_file.read(entry_path)
                            self.write_repo_file_bytes(task_id, normalized_path, raw, use_system_temp)
                        except Exception as e:
                            print(f"Error extracting {entry_path} -> {normalized_path}: {e}")
                    
                    # Only process markdown files, but let the tree builder handle structure
                    if file_name.endswith('.md'):
                        try:
                            content = zip_file.read(entry_path).decode('utf-8')
                            node = find_or_create_node(spec_tree, path_parts, normalized_path)
                            node["content"] = content
                            node["type"] = "specification" # Mark files as specifications
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
        """
        Legacy helper (no longer used by OpenSpec Editor upload flow).

        The editor now extracts markdown files directly into:
          backend/temp/<taskId>/codebase/simplestrepo/openspec/changes/...

        Keeping this method for backwards compatibility for any other callers.
        """
        project_dir = self.temp_dir / project_id
        project_dir.mkdir(parents=True, exist_ok=True)

        file_path = project_dir / filename
        with open(file_path, 'wb') as f:
            f.write(content)

        return str(file_path)

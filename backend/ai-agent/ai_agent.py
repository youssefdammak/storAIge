from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import requests
import json

app = FastAPI()

OLLAMA_URL = "http://localhost:11434/api/chat"

# Pydantic models for request and file structure
class FileEntry(BaseModel):
    name: str
    path: str
    type: str  # "file" or "folder"
    size: int = 0

class AnalyzeRequest(BaseModel):
    filename: str
    content: str
    files: List[FileEntry]  # full file structure

class AnalyzeResponse(BaseModel):
    folder: str


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_file(req: AnalyzeRequest):
    # Extract info from request
    file_name = req.filename
    file_content = req.content
    files = req.files

    # Prepare folder list for prompt
    folder_names = [f.name for f in files if f.type == "folder"]

    # Build prompt
    prompt = f"""
You are an AI file organizer designed to categorize files into folders efficiently.
Existing folders: {folder_names}

Your task is to determine the **best single folder** for this file:

1. Prefer an existing folder if it fits the file content.
2. If no existing folder fits, create a new folder name that is short, lowercase, and uses only letters, numbers, and underscores (format: coursecode_type, e.g., 'math203_lectures').
3. Only output the folder name. No extra text.

File Name: {file_name}
File Content (first 500 chars): {file_content[:500]}
"""

    # Call OLLAMA AI
    folder_name = ""
    try:
        with requests.post(
            OLLAMA_URL,
            json={
                "model": "phi3",
                "messages": [{"role": "user", "content": prompt}],
                "stream": True
            },
            stream=True
        ) as r:
            r.raise_for_status()
            for line in r.iter_lines(decode_unicode=True):
                if line.strip():
                    try:
                        chunk_json = json.loads(line)
                        content = chunk_json.get("message", {}).get("content", "")
                        folder_name += content
                    except json.JSONDecodeError:
                        continue
    except Exception as e:
        print("Error calling AI agent:", e)
        folder_name = "Uncategorized"

    folder_name = folder_name.strip()
    if not folder_name:
        folder_name = "Uncategorized"

    return {"folder": folder_name}
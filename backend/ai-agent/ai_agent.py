from fastapi import FastAPI, Request
import requests
import json

app = FastAPI()

OLLAMA_URL = "http://localhost:11434/api/chat"

@app.post("/analyze")
async def analyze_file(request: Request):
    data = await request.json()
    file_content = data.get("content", "")
    file_name = data.get("filename", "")
    folders = data.get("folders", [])  # List of existing folder names

    # Build a prompt including the available folders
    prompt = f"""
    You are an AI file organizer designed to categorize files into folders efficiently. You are given a list of existing folder names: {folders}.

    Your task is to determine the **best single folder** for this file. Follow these instructions carefully:

    1. Prefer an **existing folder** if it fits the file content. Do not create a new folder if an existing one matches closely.
    2. If no existing folder fits, create a **new folder name** that is:
    - Short and concise
    - Standardized in the format: coursecode_type (e.g., 'math203_lectures', 'comp348_assignments')
    - Only letters, numbers, and underscores; no spaces, punctuation, or extra symbols
    - All lowercase
    3. The folder name should reflect the main topic or course context of the file.
    4. Only output the **folder name**. Do **not** add explanations, extra text, or punctuation.
    5. Avoid descriptive phrases like 'Professional Practice Folder' or 'Folder for ENGR201'; just give the short, standardized folder name.
    6. Use the file name and the first 500 characters of its content to make your decision.

    File Name: {file_name}
    File Content (first 500 chars): {file_content[:500]}

    Remember: Output **only** the folder name. Nothing else.
    """


    # Stream the response from OLLAMA
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
        folder_name = ""
        for line in r.iter_lines(decode_unicode=True):
            if line.strip():
                try:
                    chunk_json = json.loads(line)
                    content = chunk_json.get("message", {}).get("content", "")
                    folder_name += content
                except json.JSONDecodeError:
                    continue

    folder_name = folder_name.strip()
    return {"folder": folder_name or "Uncategorized"}

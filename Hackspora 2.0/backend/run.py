import sys
import os

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    import uvicorn
    print("[OBSERVA] Starting FastAPI backend on http://0.0.0.0:8000 ...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

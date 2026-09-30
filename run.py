import subprocess
import sys
import time
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"

def main():
    print("=================================================================")
    print("  AI-Powered 3D Watershed Intelligence System (SIH26015)")
    print("  Team: INNOVAID | Smart India Hackathon 2026")
    print("=================================================================")
    print("\n[1/2] Starting Python FastAPI Backend on http://localhost:8000...")
    
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=str(BACKEND_DIR)
    )

    time.sleep(2)

    print("\n[2/2] Starting Frontend Vite Dev Server on http://localhost:5173...")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=str(FRONTEND_DIR),
        shell=True
    )

    print("\n>>> System is LIVE!")
    print(">>> Frontend: http://localhost:5173")
    print(">>> Backend API Docs: http://localhost:8000/docs")
    print(">>> Press Ctrl+C to terminate both servers.\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()

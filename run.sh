#!/bin/bash

# Exit immediately if any command fails
set -e

# Get the directory where the script is located and move to root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# 1. Check if virtual environment exists, create if missing
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# 2. Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# 3. Ensure dependencies are installed/up-to-date
echo "Checking requirements..."
pip install --quiet -r requirements.txt

# 4. Start the FastAPI server using --app-dir src
echo "Starting FastAPI server on http://127.0.0.1:8000 ..."
uvicorn main:app --app-dir src --reload --reload-dir src
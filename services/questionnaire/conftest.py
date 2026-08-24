import os
import sys

# Allow `from main import app` etc. when pytest is run from the repo root
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import os
import sys
import tempfile

# main.py's imports (models, schemas, db, seed) are unqualified, so the lab
# service directory must be on sys.path for `import main` to resolve them.
SERVICE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SERVICE_DIR not in sys.path:
    sys.path.insert(0, SERVICE_DIR)

# db.py creates its SQLite engine against a relative path at import time, so
# chdir into a throwaway directory before anything imports it — keeps test
# runs from creating/polluting services/lab/lab.db in the working tree.
os.chdir(tempfile.mkdtemp())

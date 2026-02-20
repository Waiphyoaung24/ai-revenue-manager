"""Root conftest.py — ensures the local project root is first in sys.path."""

import sys
import os

# Insert the project root as the first path entry so the local `app` package
# takes priority over any installed `app` packages from other projects.
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

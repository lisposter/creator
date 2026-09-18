#!/usr/bin/env python3
"""Compatibility entry point; watermarks belong to inm-watermark-image."""

import runpy
from pathlib import Path

if __name__ == "__main__":
    script = Path(__file__).resolve().parents[2] / "inm-watermark-image/scripts/add_watermark.py"
    runpy.run_path(str(script), run_name="__main__")

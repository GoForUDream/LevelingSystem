"""
Crop badge images by removing near-transparent pixels around the edges,
then resize all to a consistent square resolution.

Usage:
  python3 frontend/scripts/crop-badges.py

Processes all PNG files in frontend/public/badges/ directory.
"""

from __future__ import annotations

import os
from PIL import Image

BADGES_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "badges")
ALPHA_THRESHOLD = 100
OUTPUT_SIZE = 512


def crop_badge(filepath: str) -> Image.Image | None:
    img = Image.open(filepath).convert("RGBA")
    original_size = img.size

    # Make pixels with low alpha fully transparent
    data = img.getdata()
    new_data = []
    for r, g, b, a in data:
        if a < ALPHA_THRESHOLD:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append((r, g, b, a))
    img.putdata(new_data)

    # Crop to bounding box of visible content
    alpha = img.split()[3]
    bbox = alpha.point(lambda x: 255 if x > 0 else 0).getbbox()

    if bbox is None:
        print(f"  SKIP {os.path.basename(filepath)} — fully transparent")
        return None

    cropped = img.crop(bbox)

    # Fit into a square canvas, centered
    w, h = cropped.size
    max_dim = max(w, h)
    canvas = Image.new("RGBA", (max_dim, max_dim), (0, 0, 0, 0))
    canvas.paste(cropped, ((max_dim - w) // 2, (max_dim - h) // 2))

    # Resize to consistent output size
    final = canvas.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.LANCZOS)
    final.save(filepath)
    print(f"  {os.path.basename(filepath)}: {original_size[0]}x{original_size[1]} → {OUTPUT_SIZE}x{OUTPUT_SIZE}")
    return final


def main() -> None:
    if not os.path.isdir(BADGES_DIR):
        os.makedirs(BADGES_DIR)
        print(f"Created {BADGES_DIR}")
        print("Place badge PNGs in this folder and run again.")
        return

    files = sorted(f for f in os.listdir(BADGES_DIR) if f.lower().endswith(".png"))

    if not files:
        print(f"No PNG files found in {BADGES_DIR}")
        return

    print(f"Cropping {len(files)} badge(s) to {OUTPUT_SIZE}x{OUTPUT_SIZE}...")
    for f in files:
        crop_badge(os.path.join(BADGES_DIR, f))
    print("Done.")


if __name__ == "__main__":
    main()

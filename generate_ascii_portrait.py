#!/usr/bin/env python3
"""
generate_ascii_portrait.py

Turn a photo into ASCII art you can drop into your terminal-portfolio
(replace the BANNER string in index.html) or your README code block.

Usage:
    pip install pillow
    python3 generate_ascii_portrait.py your_photo.jpg --width 60

Tips for a good result:
  - A square-ish, front-facing, high-contrast photo works best.
  - Try a few --width values (40-80) and pick what looks cleanest.
  - Pass --invert if your terminal is light-on-dark vs dark-on-light.
"""

import argparse
from PIL import Image

# Ramp from darkest to lightest (reverse with --invert)
RAMP = "@%#*+=-:. "


def image_to_ascii(path, width=60, invert=False):
    img = Image.open(path).convert("L")  # grayscale

    # Terminal characters are taller than wide, so squash vertically
    aspect_correction = 0.55
    w, h = img.size
    new_h = int((width / w) * h * aspect_correction)
    img = img.resize((width, max(new_h, 1)))

    pixels = img.getdata()
    ramp = RAMP[::-1] if invert else RAMP
    scale = (len(ramp) - 1) / 255

    chars = [ramp[int(p * scale)] for p in pixels]
    lines = [
        "".join(chars[i : i + width]) for i in range(0, len(chars), width)
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert a photo to ASCII art.")
    parser.add_argument("image", help="Path to your photo (jpg/png)")
    parser.add_argument("--width", type=int, default=60, help="Output width in characters")
    parser.add_argument("--invert", action="store_true", help="Invert the brightness ramp")
    parser.add_argument("--out", help="Optional file to save the ASCII art to")
    args = parser.parse_args()

    art = image_to_ascii(args.image, width=args.width, invert=args.invert)
    print(art)

    if args.out:
        with open(args.out, "w") as f:
            f.write(art)
        print(f"\nSaved to {args.out}")

import math
from PIL import Image

def generate_svg(image_path, output_path, width=80):
    img = Image.open(image_path).convert("RGB")
    
    # Crop to square
    w, h = img.size
    size = min(w, h)
    left = (w - size) // 2
    top = (h - size) // 2
    img = img.crop((left, top, left+size, top+size))
    
    # Resize
    aspect_ratio = 1.0  # Terminal fonts are usually 2:1 height:width, but we can adjust font size/spacing
    # To make it look square with a typical monospaced font, we stretch height by 0.5 when resizing, 
    # but we can also just use SVG dx/dy spacing.
    height = int(width * 0.5) 
    img = img.resize((width, height), Image.Resampling.LANCZOS)
    
    # ASCII Ramp
    RAMP = "@%#*+=-:. "
    
    # SVG setup
    char_width = 2
    char_height = 4
    svg_w = width * char_width
    svg_h = height * char_height
    
    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {svg_w} {svg_h}" width="{svg_w}" height="{svg_h}">',
        f'<style> text {{ font-family: "JetBrains Mono", "Courier New", monospace; font-size: 4px; font-weight: bold; white-space: pre; }} </style>',
        '<rect width="100%" height="100%" fill="transparent" />'
    ]
    
    for y in range(height):
        line = f'<text x="0" y="{y * char_height + char_height}">'
        for x in range(width):
            r, g, b = img.getpixel((x, y))
            # Calculate brightness
            brightness = sum([r, g, b]) / 3
            # Get character
            char_idx = int((brightness / 255.0) * (len(RAMP) - 1))
            char = RAMP[char_idx]
            
            # Use real color, but if it's very dark, maybe lighten it so it's visible on dark backgrounds
            # Or just use the exact color.
            hex_color = f"#{r:02x}{g:02x}{b:02x}"
            if char in [' ', '<', '>', '&']:
                if char == ' ':
                    char = '&#160;'
                elif char == '<':
                    char = '&lt;'
                elif char == '>':
                    char = '&gt;'
                elif char == '&':
                    char = '&amp;'
            line += f'<tspan fill="{hex_color}">{char}</tspan>'
        line += '</text>'
        svg.append(line)
        
    svg.append('</svg>')
    
    with open(output_path, "w") as f:
        f.write("\\n".join(svg))
        
if __name__ == "__main__":
    generate_svg("deepak@kumar.png", "ascii_portrait.svg", width=320)

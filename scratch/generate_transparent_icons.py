import os
from PIL import Image

def generate_transparent_favicons():
    logo_path = r"c:\Users\USER\Downloads\app-eventgrid\public\ng-new-logo.png"
    public_dir = r"c:\Users\USER\Downloads\app-eventgrid\public"
    
    if not os.path.exists(logo_path):
        print(f"Error: {logo_path} not found")
        return
        
    # Open original image
    img = Image.open(logo_path)
    w, h = img.size
    print(f"Original transparent size: {w}x{h}")
    
    # Calculate new square size (max of width/height)
    square_size = max(w, h)
    
    # Create new square transparent image
    square_img = Image.new("RGBA", (square_size, square_size), (0, 0, 0, 0))
    
    # Center the logo in the square image
    x_offset = (square_size - w) // 2
    y_offset = (square_size - h) // 2
    
    # Paste the original logo
    square_img.paste(img, (x_offset, y_offset))
    print(f"Created square transparent image of size: {square_size}x{square_size}")
    
    # Target sizes to save as PNG with -transparent suffix
    targets = {
        "favicon-16x16-transparent.png": 16,
        "favicon-32x32-transparent.png": 32,
        "favicon-48x48-transparent.png": 48,
        "favicon-96x96-transparent.png": 96,
        "apple-touch-icon-transparent.png": 180,
    }
    
    for name, size in targets.items():
        out_path = os.path.join(public_dir, name)
        resized = square_img.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(out_path, "PNG", optimize=True)
        print(f"Saved {name} ({size}x{size})")

if __name__ == "__main__":
    generate_transparent_favicons()

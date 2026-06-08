import os
import sys

def install_pillow():
    try:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    except Exception as e:
        print(f"Failed to install Pillow: {e}")

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Pillow not found. Trying to install...")
    install_pillow()
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("Could not import Pillow even after attempted install. Exiting.")
        sys.exit(1)

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def create_icon(size, path):
    # Create a simple colored square with a letter
    img = Image.new('RGB', (size, size), color=(74, 222, 128)) # #4ade80 Green
    d = ImageDraw.Draw(img)
    
    # Draw border
    border_width = int(size * 0.05)
    d.rectangle([0, 0, size-1, size-1], outline=(22, 163, 74), width=border_width) # #16a34a Darker green
    
    # Draw a simple "U" shape using rectangles since we might not have fonts
    # U dimensions
    u_width = int(size * 0.5)
    u_height = int(size * 0.5)
    u_thickness = int(size * 0.15)
    
    start_x = (size - u_width) // 2
    start_y = (size - u_height) // 2
    
    # Left vertical
    d.rectangle(
        [start_x, start_y, start_x + u_thickness, start_y + u_height], 
        fill=(255, 255, 255)
    )
    
    # Right vertical
    d.rectangle(
        [start_x + u_width - u_thickness, start_y, start_x + u_width, start_y + u_height], 
        fill=(255, 255, 255)
    )
    
    # Bottom horizontal
    d.rectangle(
        [start_x, start_y + u_height - u_thickness, start_x + u_width, start_y + u_height], 
        fill=(255, 255, 255)
    )
    
    img.save(path)
    print(f"Created {path}")

def main():
    base_dir = os.getcwd()
    images_dir = os.path.join(base_dir, 'public', 'assets', 'images')
    sounds_dir = os.path.join(base_dir, 'public', 'assets', 'sounds')
    
    ensure_dir(images_dir)
    ensure_dir(sounds_dir)
    
    # Generate icons
    create_icon(192, os.path.join(images_dir, 'icon-192.png'))
    create_icon(512, os.path.join(images_dir, 'icon-512.png'))
    
    print("Assets generated successfully.")

if __name__ == "__main__":
    main()
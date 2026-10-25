"""
High-fidelity HireNova brand asset generator with morphological edge cleaning.
Produces perfectly clean transparent PNGs and favicons.
"""

import os
from PIL import Image
import numpy as np
from scipy.ndimage import binary_erosion

src_image_path = r"C:\Users\AKHILESH KR GAUTAM.AKHILESH\.gemini\antigravity-ide\brain\6bee27ee-a03d-40e6-b004-7bb9f5017b5c\.user_uploaded\media_1792924440720.jpg"

def create_clean_assets():
    img = Image.open(src_image_path).convert("RGB")
    arr = np.array(img, dtype=np.float64)
    h, w, _ = arr.shape
    
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    
    # In the cyan/turquoise mark, Green and Blue are much higher than Red.
    cyan_diff = np.maximum(g - r, b - r)
    
    # Only keep the H mark (exclude the drop shadow below y=595)
    y_coords, _ = np.mgrid[0:h, 0:w]
    valid_region = y_coords <= 595
    
    # Threshold for solid logo
    # Background compression noise has cyan_diff < 10
    # Clean edge boundary starts around 20.0 to 50.0
    low_thresh = 18.0
    high_thresh = 48.0
    
    alpha = np.zeros((h, w), dtype=np.float64)
    in_range = valid_region & (cyan_diff >= low_thresh)
    alpha[in_range] = np.clip((cyan_diff[in_range] - low_thresh) / (high_thresh - low_thresh), 0.0, 1.0)
    
    # Smooth step
    alpha = alpha * alpha * (3.0 - 2.0 * alpha)
    
    # Dematting: remove the white background from semi-transparent edge pixels
    fg = np.copy(arr)
    active = alpha > 0.01
    for c in range(3):
        channel = arr[:, :, c]
        unmixed = (channel[active] - 255.0 * (1.0 - alpha[active])) / np.maximum(alpha[active], 0.01)
        fg[active, c] = np.clip(unmixed, 0.0, 255.0)
        
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = np.clip(fg, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)
    
    clean_img = Image.fromarray(rgba, mode="RGBA")
    
    # Bounding box of the logo
    bbox = clean_img.getbbox()
    print("Clean logo bounding box:", bbox)
    
    cropped = clean_img.crop(bbox)
    cw, ch = cropped.size
    print(f"Cropped dimensions: {cw}x{ch}")
    
    # Target 512x512 square with optical centering and 8% padding
    target_dim = 512
    max_side = max(cw, ch)
    scale = (target_dim * 0.88) / max_side
    new_w = int(round(cw * scale))
    new_h = int(round(ch * scale))
    
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    square_icon = Image.new("RGBA", (target_dim, target_dim), (0, 0, 0, 0))
    offset_x = (target_dim - new_w) // 2
    offset_y = (target_dim - new_h) // 2
    square_icon.paste(resized, (offset_x, offset_y), resized)
    
    # Target directories
    public_assets = r"c:\Desktop\Resume-screening-system\frontend\public\assets"
    src_assets = r"c:\Desktop\Resume-screening-system\frontend\src\assets"
    public_dir = r"c:\Desktop\Resume-screening-system\frontend\public"
    
    os.makedirs(public_assets, exist_ok=True)
    os.makedirs(src_assets, exist_ok=True)
    
    # 1. Main brand logos
    square_icon.save(os.path.join(public_assets, "hirenova-logo.png"), "PNG", optimize=True)
    square_icon.save(os.path.join(public_assets, "hirenova-icon.png"), "PNG", optimize=True)
    square_icon.save(os.path.join(src_assets, "hirenova-logo.png"), "PNG", optimize=True)
    
    # 2. Browser Favicons
    fav_32 = square_icon.resize((32, 32), Image.Resampling.LANCZOS)
    fav_32.save(os.path.join(public_dir, "favicon.png"), "PNG")
    fav_32.save(os.path.join(public_dir, "favicon-32x32.png"), "PNG")
    
    fav_192 = square_icon.resize((192, 192), Image.Resampling.LANCZOS)
    fav_192.save(os.path.join(public_dir, "favicon-192x192.png"), "PNG")
    
    # Multi-resolution ICO
    square_icon.save(
        os.path.join(public_dir, "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    
    # 3. Clean SVG Favicon embedding the crisp asset
    import base64
    with open(os.path.join(public_assets, "hirenova-logo.png"), "rb") as f:
        b64_logo = base64.b64encode(f.read()).decode("utf-8")
        
    svg_markup = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%" fill="none">
  <image href="data:image/png;base64,{b64_logo}" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>'''
    with open(os.path.join(public_dir, "favicon.svg"), "w", encoding="utf-8") as f:
        f.write(svg_markup)
        
    print("Pristine brand assets and favicons successfully built!")

if __name__ == "__main__":
    create_clean_assets()

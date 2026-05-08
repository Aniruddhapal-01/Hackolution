import os
from PIL import Image, ImageDraw

output_folder = "blender_output"

# Pick the first image to verify
img_path = os.path.join(output_folder, "synthetic_3d_000.jpg")
lbl_path = os.path.join(output_folder, "synthetic_3d_000.txt")

if not os.path.exists(img_path) or not os.path.exists(lbl_path):
    print("Files not found! Make sure you run it inside the blindspot-ai folder.")
    exit(1)

# Open image
img = Image.open(img_path)
draw = ImageDraw.Draw(img)
img_w, img_h = img.size

# Read the YOLO label
with open(lbl_path, "r") as f:
    line = f.read().strip()
    
if not line:
    print("Label file is empty!")
    exit(1)

parts = line.split()
class_id = int(parts[0])
x_center = float(parts[1])
y_center = float(parts[2])
width = float(parts[3])
height = float(parts[4])

# Convert YOLO normalized coordinates back to absolute pixel coordinates
abs_x = x_center * img_w
abs_y = y_center * img_h
abs_w = width * img_w
abs_h = height * img_h

# Calculate bounding box edges (Left, Top, Right, Bottom)
left = abs_x - (abs_w / 2)
top = abs_y - (abs_h / 2)
right = abs_x + (abs_w / 2)
bottom = abs_y + (abs_h / 2)

# Draw a thick Red Box around those exact coordinates!
draw.rectangle([left, top, right, bottom], outline="red", width=4)

# Save the verification image
verify_path = os.path.join(output_folder, "VERIFIED_000.jpg")
img.save(verify_path)
print(f"Verification complete! Open: {verify_path}")

import os
import sys

print("Loading Blender Physics Engine (bpy)... this might take a few seconds.")
try:
    import bpy
    import bpy_extras
    import math
    import random
except ImportError:
    print("Error: 'bpy' is not installed. Run: pip install bpy")
    sys.exit(1)


def create_synthetic_blender_data(output_folder="blender_output", num_images=3):
    """
    Renders 3D objects with randomized camera angles and lighting,
    and automatically outputs perfect YOLO bounding box annotations.
    """
    # Get the absolute path so Python and Blender both save to the exact same folder
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    abs_output_folder = os.path.join(BASE_DIR, output_folder)
    os.makedirs(abs_output_folder, exist_ok=True)
    
    # 1. Clear default scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # 2. Add our "Blindspot Target" (we'll use Suzanne the Monkey for now)
    bpy.ops.mesh.primitive_monkey_add(location=(0, 0, 0), size=1.5)
    target = bpy.context.active_object
    target.name = "TargetObject"
    # Give it smooth shading to look realistic
    bpy.ops.object.shade_smooth()
    
    # Change render engine to EEVEE for blazing fast renders
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(scene.render, 'engine') and 'EEVEE' in dir() else 'BLENDER_EEVEE'
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.resolution_x = 640
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100

    print(f"--- Starting 3D Domain Randomization ---")
    
    for i in range(num_images):
        filename_prefix = f"synthetic_3d_{i:03d}"
        
        # 3. Randomize Camera
        if "Camera" in bpy.data.objects:
            cam_obj = bpy.data.objects["Camera"]
        else:
            cam_data = bpy.data.cameras.new(name="Camera")
            cam_obj = bpy.data.objects.new("Camera", cam_data)
            scene.collection.objects.link(cam_obj)
            scene.camera = cam_obj

        # Put the camera at a random angle around the object
        angle = random.uniform(0, 2 * math.pi)
        distance = random.uniform(4.0, 7.0)
        cam_x = math.cos(angle) * distance
        cam_y = math.sin(angle) * distance
        cam_z = random.uniform(1.0, 4.0)
        cam_obj.location = (cam_x, cam_y, cam_z)
        
        # Point the camera directly at the target
        direction = target.location - cam_obj.location
        rot_quat = direction.to_track_quat('-Z', 'Y')
        cam_obj.rotation_euler = rot_quat.to_euler()

        # 4. Randomize Lighting
        if "Sunlight" in bpy.data.objects:
            light_obj = bpy.data.objects["Sunlight"]
            light_obj.data.energy = random.uniform(1.0, 6.0)
        else:
            light_data = bpy.data.lights.new(name="Sunlight", type='SUN')
            light_data.energy = random.uniform(1.0, 6.0)
            light_obj = bpy.data.objects.new(name="Sunlight", object_data=light_data)
            scene.collection.objects.link(light_obj)
        light_obj.rotation_euler = (random.uniform(0, math.pi), random.uniform(0, math.pi), 0)

        # 5. Render the Image
        img_path = os.path.join(abs_output_folder, f"{filename_prefix}.jpg")
        scene.render.filepath = img_path
        bpy.ops.render.render(write_still=True)

        # 6. Mathematical Auto-Labeling (Calculate Perfect 2D Bounding Box from 3D Mesh)
        # We project every 3D vertex to the 2D camera view to draw a flawless box
        depsgraph = bpy.context.evaluated_depsgraph_get()
        eval_obj = target.evaluated_get(depsgraph)
        mesh = eval_obj.to_mesh()
        
        min_x, max_x = 1.0, 0.0
        min_y, max_y = 1.0, 0.0
        
        for v in mesh.vertices:
            # Get 2D pixel coordinate
            co2D = bpy_extras.object_utils.world_to_camera_view(scene, cam_obj, eval_obj.matrix_world @ v.co)
            if co2D.x < min_x: min_x = co2D.x
            if co2D.x > max_x: max_x = co2D.x
            if co2D.y < min_y: min_y = co2D.y
            if co2D.y > max_y: max_y = co2D.y
            
        eval_obj.to_mesh_clear()

        # Blender sets Y=0 at the bottom. YOLO needs Y=0 at the top. Flip it.
        min_y_yolo = 1.0 - max_y
        max_y_yolo = 1.0 - min_y

        # Convert to YOLO standard (center_x, center_y, width, height)
        width = max_x - min_x
        height = max_y_yolo - min_y_yolo
        x_center = min_x + (width / 2.0)
        y_center = min_y_yolo + (height / 2.0)

        # Constrain to screen bounds [0.0 - 1.0]
        x_center = max(0.0, min(1.0, x_center))
        y_center = max(0.0, min(1.0, y_center))
        width = max(0.0, min(1.0, width))
        height = max(0.0, min(1.0, height))

        # 7. Write to YOLO Text file
        lbl_path = os.path.join(abs_output_folder, f"{filename_prefix}.txt")
        with open(lbl_path, "w") as f:
            f.write(f"0 {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}\n")
            
        print(f"[{i+1}/{num_images}] Rendered: {filename_prefix}.jpg with math-perfect YOLO labels.")

    print(f"\nDone! Check the '{output_folder}' directory.")

if __name__ == "__main__":
    create_synthetic_blender_data(num_images=3)

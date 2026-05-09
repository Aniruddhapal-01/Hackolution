import os, math

path = r"c:\Users\aniru\OneDrive\Documents\HACKOLUTION - 1.0\Hackolution\backend\services\dataset_fetch_service.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "\n# IMAGE DATASET GENERATOR\n"
end_marker = "\n# TABULAR DATASET GENERATOR\n"
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

NEW_SECTION = r"""

# IMAGE DATASET GENERATOR

def _generate_image_dataset(out_dir, stressor_key, n_samples, image_domain="general"):
    images_dir = out_dir / "images"
    labels_dir = out_dir / "labels"
    images_dir.mkdir(exist_ok=True)
    labels_dir.mkdir(exist_ok=True)
    cat_names = {"medical":"pathology_region","satellite":"land_cover_region","autonomous":"vehicle","general":"target_object"}
    coco = {
        "info": {"description": f"BlindSpot.AI Synthetic - {stressor_key} ({image_domain})", "version": "2.0"},
        "images": [], "annotations": [],
        "categories": [{"id": 1, "name": cat_names.get(image_domain, "target_object")}]
    }
    count = min(n_samples, 40)
    for i in range(count):
        img = _make_base_image(i, image_domain)
        img = _apply_image_stressor(img, stressor_key, image_domain)
        fname = f"{stressor_key}_{i:04d}.jpg"
        img.save(str(images_dir / fname), quality=88)
        w, h = img.size
        bx = random.randint(20, w // 3)
        by = random.randint(20, h // 3)
        bw = random.randint(w // 4, w // 2)
        bh = random.randint(h // 4, h // 2)
        coco["images"].append({"id": i+1, "file_name": fname, "width": w, "height": h, "stressor": stressor_key, "domain": image_domain})
        coco["annotations"].append({"id": i+1, "image_id": i+1, "category_id": 1, "bbox": [bx, by, bw, bh], "area": bw*bh, "iscrowd": 0, "score": round(random.uniform(0.45, 0.92), 3)})
        cx2 = (bx + bw/2) / w; cy2 = (by + bh/2) / h; nw = bw / w; nh = bh / h
        with open(str(labels_dir / fname.replace(".jpg", ".txt")), "w") as lf:
            lf.write(f"0 {cx2:.6f} {cy2:.6f} {nw:.6f} {nh:.6f}\n")
    ann_dir = out_dir / "annotations"; ann_dir.mkdir(exist_ok=True)
    with open(str(ann_dir / "instances.json"), "w") as jf:
        json.dump(coco, jf, indent=2)
    suggestion = DATASET_SUGGESTIONS.get(stressor_key, {})
    readme = f"# BlindSpot.AI Synthetic Dataset\nDomain: {image_domain}\nStressor: {stressor_key}\nSamples: {count}\nFormat: COCO JSON + YOLO TXT\n\n## Suggested Real Dataset\n{suggestion.get('name','N/A')}\n{suggestion.get('real_url','')}\n"
    with open(str(out_dir / "README.md"), "w") as rf:
        rf.write(readme)
    zip_path = str(out_dir.parent / f"{stressor_key}_image_dataset.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fp in out_dir.rglob("*"):
            if fp.is_file():
                zf.write(fp, fp.relative_to(out_dir.parent))
    return zip_path, count


def _make_base_image(idx, image_domain="general"):
    if image_domain == "medical":
        return _make_medical_image(idx)
    elif image_domain == "satellite":
        return _make_satellite_image(idx)
    elif image_domain == "autonomous":
        return _make_car_image(idx)
    else:
        return _make_general_image(idx)


def _make_medical_image(idx):
    import math as _math
    w, h = 512, 512
    base_val = random.randint(15, 35)
    img = Image.new("L", (w, h), base_val)
    draw = ImageDraw.Draw(img)
    scan = ["xray", "mri", "ct"][idx % 3]
    if scan == "xray":
        for cx_l in [w//4, 3*w//4]:
            lw, lh = w//3, h//2
            for y in range(h//6, h//6+lh):
                for x in range(cx_l-lw//2, cx_l+lw//2):
                    if 0<=x<w and 0<=y<h:
                        dist = ((x-cx_l)**2/(lw//2)**2 + (y-(h//6+lh//2))**2/(lh//2)**2)
                        if dist < 1.0:
                            img.putpixel((x,y), min(255, int(120+60*(1-dist)+random.randint(-10,10))))
        for rib_y in range(h//6, 2*h//3, h//12):
            for x in range(w//8, 7*w//8):
                curve = int(10*_math.sin((x-w//2)*_math.pi/(w//2)))
                ry = rib_y+curve
                if 0<=ry<h: draw.line([(x,ry),(x,ry+3)], fill=random.randint(180,220))
        hcx, hcy = w//2-20, h//2
        for y in range(hcy-80, hcy+80):
            for x in range(hcx-60, hcx+60):
                if 0<=x<w and 0<=y<h:
                    dist = ((x-hcx)**2/60**2+(y-hcy)**2/80**2)
                    if dist<1.0: img.putpixel((x,y), int(90+30*(1-dist)))
        for y in range(h//6, 5*h//6):
            for dx in range(-4,5):
                if 0<=w//2+dx<w: img.putpixel((w//2+dx,y), random.randint(160,200))
    elif scan == "mri":
        cx, cy = w//2, h//2; skull_r = min(w,h)//2-20
        for angle in range(360):
            rad = _math.radians(angle)
            for r in range(skull_r-8, skull_r+8):
                x=int(cx+r*_math.cos(rad)); y=int(cy+r*_math.sin(rad))
                if 0<=x<w and 0<=y<h: img.putpixel((x,y), random.randint(180,240))
        for y in range(cy-skull_r+10, cy+skull_r-10):
            for x in range(cx-skull_r+10, cx+skull_r-10):
                if _math.sqrt((x-cx)**2+(y-cy)**2) < skull_r-10:
                    img.putpixel((x,y), int(100+40*random.random()))
        for side in [-1,1]:
            vcx=cx+side*30
            for y in range(cy-40,cy+40):
                for x in range(vcx-20,vcx+20):
                    if 0<=x<w and 0<=y<h:
                        if ((x-vcx)**2/20**2+(y-cy)**2/40**2)<1.0: img.putpixel((x,y), random.randint(20,45))
    else:
        cx, cy = w//2, h//2; body_r = min(w,h)//2-30
        for y in range(cy-body_r, cy+body_r):
            for x in range(cx-body_r, cx+body_r):
                if _math.sqrt((x-cx)**2+(y-cy)**2)<body_r: img.putpixel((x,y), int(80+40*random.random()))
        for y in range(cy-20,cy+20):
            for x in range(cx-15,cx+15):
                if 0<=x<w and 0<=y<h: img.putpixel((x,y), random.randint(180,220))
        for y in range(cy-60,cy+40):
            for x in range(cx+20,cx+120):
                if 0<=x<w and 0<=y<h:
                    if ((x-(cx+70))**2/50**2+(y-(cy-10))**2/50**2)<1.0: img.putpixel((x,y), int(110+20*random.random()))
    draw2 = ImageDraw.Draw(img)
    label_text = {"xray":"CHEST PA","mri":"BRAIN MRI","ct":"ABDO CT"}[scan]
    draw2.rectangle([5,5,120,22], fill=0); draw2.text((8,7), label_text, fill=200)
    draw2.text((w-80,5), f"#{idx:04d}", fill=150)
    return img.convert("RGB")


def _make_satellite_image(idx):
    w, h = 512, 512
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    terrain = ["urban","agricultural","forest","coastal"][idx % 4]
    if terrain == "urban":
        img.paste((80,85,90), [0,0,w,h])
        for gx in range(0, w, random.randint(30,60)):
            draw.rectangle([gx,0,gx+random.randint(20,50),h], fill=(random.randint(100,160),)*3)
        for gy in range(0, h, random.randint(30,60)):
            draw.rectangle([0,gy,w,gy+random.randint(20,50)], fill=(random.randint(100,160),)*3)
        for _ in range(5):
            draw.line([(random.randint(0,w),0),(random.randint(0,w),h)], fill=(50,50,55), width=4)
            draw.line([(0,random.randint(0,h)),(w,random.randint(0,h))], fill=(50,50,55), width=4)
    elif terrain == "agricultural":
        for fy in range(0,h,40):
            for fx in range(0,w,40):
                draw.rectangle([fx,fy,fx+38,fy+38], fill=(random.randint(60,120),random.randint(80,160),random.randint(30,80)))
    elif terrain == "forest":
        img.paste((20,60,20),[0,0,w,h])
        for _ in range(300):
            cx2=random.randint(0,w); cy2=random.randint(0,h); r2=random.randint(8,25)
            draw.ellipse([cx2-r2,cy2-r2,cx2+r2,cy2+r2], fill=(10,random.randint(40,100),10))
    else:
        draw.rectangle([0,0,w,h//2], fill=(30,80,160))
        draw.rectangle([0,h//2,w,h//2+30], fill=(210,190,140))
        draw.rectangle([0,h//2+30,w,h], fill=(60,120,50))
    for gx in range(0,w,128): draw.line([(gx,0),(gx,h)], fill=(200,200,200), width=1)
    for gy in range(0,h,128): draw.line([(0,gy),(w,gy)], fill=(200,200,200), width=1)
    draw.rectangle([0,0,160,18], fill=(0,0,0))
    draw.text((3,2), f"SAT {terrain.upper()} #{idx:04d}", fill=(200,255,100))
    return img


def _make_car_image(idx):
    w, h = 640, 480
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    sky_palettes = [[(100,149,237),(135,180,255)],[(180,180,200),(210,210,220)],[(255,200,100),(255,160,60)],[(40,50,80),(60,70,100)]]
    sky = sky_palettes[idx % len(sky_palettes)]
    for y in range(h*2//3):
        t=y/(h*2//3); r=int(sky[0][0]*(1-t)+sky[1][0]*t); g=int(sky[0][1]*(1-t)+sky[1][1]*t); b=int(sky[0][2]*(1-t)+sky[1][2]*t)
        draw.line([(0,y),(w,y)], fill=(r,g,b))
    road_y=h*2//3; draw.rectangle([0,road_y,w,h], fill=(75,75,75)); draw.rectangle([0,road_y,w,road_y+8], fill=(110,110,110))
    lane_y=road_y+(h-road_y)//2
    for lx in range(0,w,60): draw.rectangle([lx,lane_y-3,lx+35,lane_y+3], fill=(220,220,180))
    for bx in range(0,w,random.randint(55,90)):
        bh2=random.randint(35,110); bw2=random.randint(28,65); bc=(random.randint(90,150),)*3
        draw.rectangle([bx,road_y-bh2,bx+bw2,road_y], fill=bc)
    car_colors=[(220,30,30),(30,80,200),(240,240,240),(30,30,30),(180,140,40),(60,160,60),(160,160,160)]
    car_col=car_colors[idx%len(car_colors)]; dark_col=tuple(max(0,c-60) for c in car_col); glass_col=(160,200,230)
    cx=w//2+random.randint(-50,50); car_w,car_h2=220,80; car_top=road_y-car_h2-10; car_bot=road_y-10
    draw.rectangle([cx-car_w//2,car_top+30,cx+car_w//2,car_bot], fill=car_col)
    draw.polygon([(cx-car_w//2+30,car_top+30),(cx+car_w//2-30,car_top+30),(cx+car_w//2-55,car_top),(cx-car_w//2+55,car_top)], fill=car_col)
    draw.polygon([(cx-car_w//2+35,car_top+28),(cx-car_w//2+60,car_top+2),(cx,car_top+2),(cx,car_top+28)], fill=glass_col)
    draw.polygon([(cx,car_top+28),(cx,car_top+2),(cx+car_w//2-58,car_top+2),(cx+car_w//2-33,car_top+28)], fill=glass_col)
    draw.rectangle([cx-car_w//2+62,car_top+4,cx-4,car_top+26], fill=glass_col)
    draw.rectangle([cx+4,car_top+4,cx+car_w//2-60,car_top+26], fill=glass_col)
    draw.rectangle([cx-car_w//2,car_top+30,cx-car_w//2+35,car_top+50], fill=dark_col)
    draw.rectangle([cx+car_w//2-35,car_top+30,cx+car_w//2,car_top+50], fill=dark_col)
    draw.ellipse([cx-car_w//2+5,car_top+35,cx-car_w//2+28,car_top+52], fill=(255,255,200))
    draw.ellipse([cx+car_w//2-28,car_top+35,cx+car_w//2-5,car_top+52], fill=(255,100,100))
    for wx2 in [cx-car_w//2+45,cx+car_w//2-45]:
        draw.ellipse([wx2-22,car_bot-27,wx2+22,car_bot+17], fill=(25,25,25))
        draw.ellipse([wx2-12,car_bot-17,wx2+12,car_bot+7], fill=(160,160,160))
    draw.line([(cx-5,car_top+30),(cx-5,car_bot)], fill=dark_col, width=2)
    draw.rectangle([cx-car_w//2,car_top-16,cx-car_w//2+90,car_top-2], fill=(0,0,0))
    draw.text((cx-car_w//2+3,car_top-14), "CAR", fill=(0,255,0))
    return img


def _make_general_image(idx):
    w, h = 512, 512
    bg_colors = [(40,40,50),(50,45,40),(35,50,45),(45,40,55)]
    img = Image.new("RGB", (w, h), bg_colors[idx % len(bg_colors)])
    draw = ImageDraw.Draw(img)
    cx=w//2+random.randint(-60,60); cy=h//2+random.randint(-40,40)
    obj_w=random.randint(100,200); obj_h=random.randint(80,160)
    col=(random.randint(80,220),random.randint(80,220),random.randint(80,220))
    draw.rectangle([cx-obj_w//2,cy-obj_h//2,cx+obj_w//2,cy+obj_h//2], fill=col, outline=(255,255,255), width=2)
    draw.rectangle([cx-obj_w//2,cy-obj_h//2-18,cx-obj_w//2+100,cy-obj_h//2-2], fill=(0,0,0))
    draw.text((cx-obj_w//2+3,cy-obj_h//2-16), "OBJECT", fill=(0,255,0))
    return img

"""

content = content[:start_idx] + NEW_SECTION + content[end_idx:]
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Image section replaced. File size:", os.path.getsize(path), "bytes")

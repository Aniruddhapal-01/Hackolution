import os

path = r"c:\Users\aniru\OneDrive\Documents\HACKOLUTION - 1.0\Hackolution\backend\services\dataset_fetch_service.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

marker = "\n# TABULAR DATASET GENERATOR\n"
idx = content.find(marker)
print("Tabular marker at:", idx)

STRESSOR_FUNC = """

def _apply_image_stressor(img, stressor_key, image_domain="general"):
    import io as _io
    from PIL import ImageEnhance
    arr = np.array(img, dtype=np.float32)
    w, h = img.size

    if stressor_key == "low_contrast":
        arr = arr * random.uniform(0.3, 0.55) + random.uniform(5, 20)
        img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    elif stressor_key == "image_noise":
        noise = np.random.normal(0, random.uniform(20, 50), arr.shape)
        img = Image.fromarray(np.clip(arr + noise, 0, 255).astype(np.uint8))
    elif stressor_key == "compression_artifact":
        buf = _io.BytesIO()
        img.save(buf, format="JPEG", quality=random.randint(5, 25))
        buf.seek(0); img = Image.open(buf).copy()
    elif stressor_key == "scanner_variation":
        img = ImageEnhance.Brightness(img).enhance(random.uniform(0.5, 1.8))
        img = ImageEnhance.Contrast(img).enhance(random.uniform(0.6, 1.4))
    elif stressor_key == "motion_artifact":
        img = img.filter(ImageFilter.GaussianBlur(radius=random.randint(6, 18)))
    elif stressor_key == "staining_variation":
        img = ImageEnhance.Color(img).enhance(random.uniform(0.2, 2.5))
        img = ImageEnhance.Contrast(img).enhance(random.uniform(0.7, 1.5))
    elif stressor_key == "overexposure":
        arr = arr * random.uniform(1.8, 3.0)
        img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    elif stressor_key == "cloud_cover":
        cloud = np.ones_like(arr) * 240
        mask = np.zeros((h, w), dtype=np.float32)
        for _ in range(random.randint(3, 8)):
            cx2=random.randint(0,w); cy2=random.randint(0,h); rr=random.randint(40,120)
            for y in range(max(0,cy2-rr),min(h,cy2+rr)):
                for x in range(max(0,cx2-rr),min(w,cx2+rr)):
                    dist=((x-cx2)**2+(y-cy2)**2)**0.5
                    if dist<rr: mask[y,x]=min(1.0,mask[y,x]+(1-dist/rr)*0.9)
        mask3=mask[:,:,np.newaxis]; arr=arr*(1-mask3)+cloud*mask3
        img=Image.fromarray(np.clip(arr,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=2))
    elif stressor_key == "atmospheric_haze":
        haze=np.ones_like(arr)*200; density=random.uniform(0.3,0.65)
        img=Image.fromarray(np.clip(arr*(1-density)+haze*density,0,255).astype(np.uint8))
    elif stressor_key == "sensor_noise":
        noise=np.random.normal(0,random.uniform(15,35),arr.shape); arr=arr+noise
        sp=np.random.rand(h,w)<0.02; arr[sp]=255; sp2=np.random.rand(h,w)<0.02; arr[sp2]=0
        img=Image.fromarray(np.clip(arr,0,255).astype(np.uint8))
    elif stressor_key == "resolution_drop":
        factor=random.randint(4,8)
        img=img.resize((w//factor,h//factor),Image.NEAREST).resize((w,h),Image.NEAREST)
    elif stressor_key == "seasonal_change":
        arr[:,:,1]=np.clip(arr[:,:,1]*random.uniform(0.4,1.8),0,255)
        arr[:,:,0]=np.clip(arr[:,:,0]*random.uniform(0.7,1.3),0,255)
        img=Image.fromarray(np.clip(arr,0,255).astype(np.uint8))
    elif stressor_key == "color_shift":
        img=ImageEnhance.Color(img).enhance(random.uniform(0.0,0.3))
        img=ImageEnhance.Brightness(img).enhance(random.uniform(0.6,1.4))
    elif "fog" in stressor_key:
        fog=np.ones_like(arr)*220; density=random.uniform(0.5,0.85)
        img=Image.fromarray(np.clip(arr*(1-density)+fog*density,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=2))
    elif "rain" in stressor_key:
        arr=arr*0.78; img2=Image.fromarray(np.clip(arr,0,255).astype(np.uint8)); d2=ImageDraw.Draw(img2)
        for _ in range(random.randint(800,2000)):
            rx,ry=random.randint(0,w-1),random.randint(0,h-10)
            d2.line([(rx,ry),(rx-3,ry+12)],fill=(200,220,255),width=1)
        img=img2.filter(ImageFilter.GaussianBlur(radius=0.5))
    elif "occlusion" in stressor_key:
        parts=stressor_key.split("_"); sev=float(parts[-1])/100 if parts[-1].isdigit() else 0.5
        draw=ImageDraw.Draw(img)
        for _ in range(int(sev*8)+2):
            ox=random.randint(0,int(w*0.7)); oy=random.randint(0,int(h*0.7))
            ow=int(w*sev*random.uniform(0.1,0.3)); oh=int(h*sev*random.uniform(0.1,0.3))
            draw.rectangle([ox,oy,ox+ow,oy+oh],fill=(random.randint(0,60),)*3)
    elif "night" in stressor_key:
        arr=arr*0.15+np.random.normal(0,10,arr.shape); arr[:,:,0]*=0.7
        img=Image.fromarray(np.clip(arr,0,255).astype(np.uint8))
    elif "blur" in stressor_key or "motion" in stressor_key:
        img=img.filter(ImageFilter.GaussianBlur(radius=random.randint(4,10)))
    elif "flare" in stressor_key or "lens" in stressor_key:
        draw=ImageDraw.Draw(img); cx2,cy2=random.randint(w//4,3*w//4),random.randint(0,h//3)
        for r in range(0,80,6): draw.ellipse([cx2-r,cy2-r,cx2+r,cy2+r],outline=(255,240,180))
    return img

"""

content = content[:idx] + STRESSOR_FUNC + content[idx:]
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Stressor function added. Size:", os.path.getsize(path))

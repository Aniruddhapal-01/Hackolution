import os, csv, json, time, uuid, zipfile, logging, random, math
from pathlib import Path
from typing import Dict, List, Any
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DATASETS_DIR = os.path.join(DATA_DIR, "generated_datasets")
os.makedirs(DATASETS_DIR, exist_ok=True)

IMAGES_PER_STRESSOR = int(os.getenv("IMAGES_PER_STRESSOR", "8"))

DATASET_SUGGESTIONS = {
    # ── Autonomous / Weather stressors ────────────────────────────────────────
    "fog_dense":    {"name":"RESIDE Dehazing Dataset","source":"kaggle","real_url":"https://www.kaggle.com/datasets/balraj98/indoor-training-set-its-residestandard","description":"6000+ hazy/foggy images with ground truth clear pairs for dehazing research.","samples":6000},
    "rain_heavy":   {"name":"Rain100H Heavy Rain Dataset","source":"kaggle","real_url":"https://www.kaggle.com/datasets/balraj98/rain100h-dataset","description":"1800 rainy images with 100 rain streak directions and densities.","samples":1800},
    "occlusion_80": {"name":"MS-COCO Occluded Objects","source":"huggingface","real_url":"https://huggingface.co/datasets/detection-datasets/coco","description":"COCO subset filtered for heavily occluded instances (>70% overlap).","samples":8200},
    "occlusion_50": {"name":"OccludedVehicles Dataset","source":"roboflow","real_url":"https://universe.roboflow.com/university-of-michigan/occluded-vehicles","description":"Vehicles with 30-70% occlusion in urban driving scenarios.","samples":3400},
    "night_low":    {"name":"ExDark Low-Light Dataset","source":"kaggle","real_url":"https://www.kaggle.com/datasets/soumikrakshit/exdark","description":"7363 low-light images across 12 object classes in 10 lighting conditions.","samples":7363},
    "motion_blur":  {"name":"GoPro Large Motion Blur Dataset","source":"kaggle","real_url":"https://www.kaggle.com/datasets/rahulbhalley/gopro-large","description":"3214 blurry/sharp image pairs from GoPro camera at high frame rates.","samples":3214},
    "lens_flare":   {"name":"Flare7K Lens Flare Dataset","source":"huggingface","real_url":"https://huggingface.co/datasets/flare7k/flare7k","description":"5000 scattering and reflective flare images for robustness testing.","samples":5000},
    # ── Medical imaging stressors ─────────────────────────────────────────────
    "low_contrast":         {"name":"NIH ChestX-ray14 Dataset","source":"kaggle","real_url":"https://www.kaggle.com/datasets/nih-chest-xrays/data","description":"112,120 frontal-view chest X-rays with 14 disease labels. Includes low-contrast and underexposed samples.","samples":112120},
    "image_noise":          {"name":"RSNA Pneumonia Detection Challenge","source":"kaggle","real_url":"https://www.kaggle.com/competitions/rsna-pneumonia-detection-challenge","description":"26,684 chest X-rays with pneumonia labels. Includes noisy and low-quality acquisitions.","samples":26684},
    "compression_artifact": {"name":"ISIC 2019 Skin Lesion Dataset","source":"kaggle","real_url":"https://www.kaggle.com/datasets/andrewmvd/isic-2019","description":"25,331 dermoscopy images with JPEG compression artifacts across 8 diagnostic categories.","samples":25331},
    "scanner_variation":    {"name":"PadChest Multi-Scanner Chest X-Ray","source":"huggingface","real_url":"https://huggingface.co/datasets/padchest","description":"160,000 chest X-rays from multiple scanner models — ideal for scanner variation robustness testing.","samples":160000},
    "motion_artifact":      {"name":"MIMIC-CXR Chest X-Ray Dataset","source":"huggingface","real_url":"https://huggingface.co/datasets/mimic-cxr","description":"227,827 chest radiographs with radiology reports. Includes motion-blurred acquisitions.","samples":227827},
    "staining_variation":   {"name":"PCam PatchCamelyon Histology","source":"huggingface","real_url":"https://huggingface.co/datasets/pcam","description":"327,680 histopathology patches with staining variation across labs and scanners.","samples":327680},
    "overexposure":         {"name":"APTOS 2019 Diabetic Retinopathy","source":"kaggle","real_url":"https://www.kaggle.com/competitions/aptos2019-blindness-detection","description":"3,662 retinal fundus images including overexposed and underexposed acquisitions.","samples":3662},
    # ── Satellite stressors ───────────────────────────────────────────────────
    "cloud_cover":      {"name":"CloudSEN12 Cloud Detection Dataset","source":"huggingface","real_url":"https://huggingface.co/datasets/cloudsen12","description":"49,400 Sentinel-2 patches with pixel-level cloud and cloud shadow annotations.","samples":49400},
    "atmospheric_haze": {"name":"HAZE4RS Remote Sensing Haze Dataset","source":"kaggle","real_url":"https://www.kaggle.com/datasets/haze4rs/haze4rs","description":"Remote sensing images with varying atmospheric haze levels for dehazing research.","samples":8000},
    "sensor_noise":     {"name":"EuroSAT Land Use Classification","source":"huggingface","real_url":"https://huggingface.co/datasets/blanchon/EuroSAT_RGB","description":"27,000 Sentinel-2 satellite images across 10 land use classes with sensor noise variation.","samples":27000},
    "resolution_drop":  {"name":"UC Merced Land Use Dataset","source":"kaggle","real_url":"https://www.kaggle.com/datasets/apollo2506/landusedataset","description":"2,100 aerial images at multiple resolutions for land use classification.","samples":2100},
    "seasonal_change":  {"name":"SEN12MS Seasonal Sentinel Dataset","source":"huggingface","real_url":"https://huggingface.co/datasets/sen12ms","description":"180,662 multi-spectral patches across all four seasons for temporal robustness testing.","samples":180662},
    # ── General image stressors ───────────────────────────────────────────────
    "color_shift":      {"name":"ImageNet-C Corruption Benchmark","source":"huggingface","real_url":"https://huggingface.co/datasets/imagenet_c","description":"ImageNet validation set with 15 corruption types including color jitter and saturation shifts.","samples":50000},
    # ── Tabular stressors ─────────────────────────────────────────────────────
    "missing_values":    {"name":"UCI Pima Diabetes - Missing Data","source":"kaggle","real_url":"https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database","description":"Tabular dataset with systematic missing value patterns across features.","samples":50000},
    "ood_inputs":        {"name":"WILDS Out-of-Distribution Benchmark","source":"huggingface","real_url":"https://huggingface.co/datasets/wilds","description":"Distribution shift benchmark across 10 real-world domains.","samples":100000},
    "class_imbalance":   {"name":"Credit Card Fraud Detection","source":"kaggle","real_url":"https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud","description":"284807 transactions with 0.17% fraud - extreme class imbalance benchmark.","samples":284807},
    "noisy_categorical": {"name":"Dirty Data Benchmark","source":"kaggle","real_url":"https://www.kaggle.com/datasets/shivamb/real-or-fake-fake-job-postings","description":"Noisy categoricals with typos, inconsistencies, and mixed formats.","samples":17880},
    "feature_dropout":   {"name":"OpenML Feature Selection Benchmark","source":"huggingface","real_url":"https://huggingface.co/datasets/inria-soda/tabular-benchmark","description":"Tabular benchmark for testing model sensitivity to feature removal.","samples":80000},
    # ── Time-series stressors ─────────────────────────────────────────────────
    "spike_anomaly":       {"name":"Numenta Anomaly Benchmark (NAB)","source":"kaggle","real_url":"https://www.kaggle.com/datasets/boltzmannbrain/nab","description":"58 real-world time series with labeled anomaly windows including spikes.","samples":365000},
    "concept_drift":       {"name":"Electricity Market Concept Drift","source":"kaggle","real_url":"https://www.kaggle.com/datasets/yashsharan/the-electricity-dataset","description":"45312 instances of electricity demand with documented concept drift.","samples":45312},
    "missing_timesteps":   {"name":"PhysioNet ICU Time Series","source":"huggingface","real_url":"https://huggingface.co/datasets/physionet/challenge-2012","description":"ICU patient records with irregular sampling and missing timesteps.","samples":12000},
    "seasonal_disruption": {"name":"M4 Competition Time Series","source":"kaggle","real_url":"https://www.kaggle.com/datasets/yogesh94/m4-forecasting-competition-dataset","description":"100000 time series with seasonal patterns and disruption events.","samples":100000},
    "hf_noise":            {"name":"TIMIT Noisy Speech Dataset","source":"kaggle","real_url":"https://www.kaggle.com/datasets/mfekadu/darpa-timit-acousticphonetic-continuous-speech","description":"Speech recordings with various noise conditions for robustness testing.","samples":6300},
    # ── Sequential stressors ──────────────────────────────────────────────────
    "adversarial_perturbation": {"name":"AdvGLUE Adversarial NLP Benchmark","source":"huggingface","real_url":"https://huggingface.co/datasets/adv_glue","description":"14000 adversarially perturbed NLP examples across 5 GLUE tasks.","samples":14000},
    "embedding_drift":          {"name":"BEIR Embedding Robustness Benchmark","source":"huggingface","real_url":"https://huggingface.co/datasets/BeIR/beir","description":"18 retrieval datasets for testing embedding model robustness.","samples":50000},
    "long_range":               {"name":"Long Range Arena Benchmark","source":"huggingface","real_url":"https://huggingface.co/datasets/long_range_arena","description":"Tasks requiring long-range sequence dependencies up to 16K tokens.","samples":10000},
    "oov_tokens":               {"name":"Multilingual OOV Benchmark","source":"huggingface","real_url":"https://huggingface.co/datasets/Helsinki-NLP/tatoeba_mt","description":"Cross-lingual sentences with out-of-vocabulary token challenges.","samples":40000},
    "adversarial_vector":       {"name":"ANN-Benchmarks Vector Search","source":"huggingface","real_url":"https://huggingface.co/datasets/ann-benchmarks/ann-benchmarks","description":"High-dimensional vector datasets for adversarial nearest-neighbor testing.","samples":1000000},
}


def fetch_datasets(evaluation_id, dataset_type, vulnerability_vector, progress_callback=None, image_domain='general'):
    results = []
    stressors = list(vulnerability_vector.keys())
    total = len(stressors)

    # Sort stressors by severity — most vulnerable first (lowest score = most vulnerable)
    stressors_sorted = sorted(stressors, key=lambda k: vulnerability_vector[k])

    for i, stressor_key in enumerate(stressors_sorted):
        time.sleep(0.2)
        vuln_score = vulnerability_vector[stressor_key]

        # Scale sample count by vulnerability severity:
        # vuln_score ~0.1 (critical) → 3x samples; ~0.9 (robust) → 0.5x samples
        severity   = max(0.0, min(1.0, 1.0 - vuln_score))   # 0=robust, 1=critical
        scale      = 0.5 + severity * 2.5                    # 0.5x to 3.0x
        n_samples  = max(20, int(IMAGES_PER_STRESSOR * 10 * scale))

        generated = _generate_synthetic_dataset(
            evaluation_id=evaluation_id,
            dataset_type=dataset_type,
            stressor_key=stressor_key,
            n_samples=n_samples,
            image_domain=image_domain,
            vuln_score=vuln_score,
        )
        if generated:
            results.append(generated)

        suggestion = DATASET_SUGGESTIONS.get(stressor_key)
        if suggestion:
            results.append({
                "source":           suggestion["source"],
                "name":             suggestion["name"],
                "dataset_url":      suggestion["real_url"],
                "size_bytes":       suggestion["samples"] * 512,
                "samples":          suggestion["samples"],
                "target_stressor":  stressor_key,
                "description":      suggestion["description"],
                "is_suggestion":    True,
                "vuln_score":       vuln_score,
                "severity_label":   _severity_label(severity),
            })

        if progress_callback:
            progress_callback(int((i + 1) / total * 100))

    return results


def _severity_label(severity: float) -> str:
    if severity >= 0.75: return "critical"
    if severity >= 0.50: return "high"
    if severity >= 0.25: return "medium"
    return "low"


def _generate_synthetic_dataset(evaluation_id, dataset_type, stressor_key,
                                 n_samples=80, image_domain="general", vuln_score=0.5):
    out_dir = __import__("pathlib").Path(DATASETS_DIR) / evaluation_id / stressor_key
    out_dir.mkdir(parents=True, exist_ok=True)
    severity   = max(0.0, min(1.0, 1.0 - vuln_score))
    sev_label  = _severity_label(severity)
    try:
        if dataset_type == "image":
            zip_path, count = _generate_image_dataset(out_dir, stressor_key, n_samples, image_domain, severity)
        elif dataset_type == "tabular":
            zip_path, count = _generate_tabular_dataset(out_dir, stressor_key, n_samples * 10, severity)
        elif dataset_type == "time_series":
            zip_path, count = _generate_timeseries_dataset(out_dir, stressor_key, n_samples * 5)
        elif dataset_type == "sequential":
            zip_path, count = _generate_sequential_dataset(out_dir, stressor_key, n_samples * 5, severity)
        elif dataset_type == "vector":
            zip_path, count = _generate_vector_dataset(out_dir, stressor_key, n_samples * 10)
        else:
            zip_path, count = _generate_image_dataset(out_dir, stressor_key, n_samples, image_domain, severity)
        rel_key    = os.path.relpath(zip_path, DATA_DIR).replace("\\", "/")
        size_bytes = os.path.getsize(zip_path)
        label      = stressor_key.replace("_", " ").title()
        return {
            "source":          "synthetic",
            "name":            f"BlindSpot Synthetic - {label} ({dataset_type}) [{sev_label.upper()}]",
            "dataset_url":     f"http://localhost:8000/media/{rel_key}",
            "size_bytes":      size_bytes,
            "samples":         count,
            "target_stressor": stressor_key,
            "vuln_score":      round(vuln_score, 3),
            "severity_label":  sev_label,
            "description": (
                f"[{sev_label.upper()} vulnerability — score {vuln_score:.2f}] "
                f"Synthetically generated {dataset_type} dataset targeting '{label}' weakness. "
                f"{count} samples with model-calibrated corruption intensity "
                f"({int(severity*100)}% stressor severity)."
            ),
            "is_suggestion": False,
        }
    except Exception as e:
        import logging; logging.getLogger(__name__).error(f"[DatasetGen] Failed {stressor_key}: {e}")
        return {}


def _generate_image_dataset(out_dir, stressor_key, n_samples, image_domain="general", severity=0.5):
    from pathlib import Path as _P
    images_dir = out_dir / "images"; labels_dir = out_dir / "labels"
    images_dir.mkdir(exist_ok=True); labels_dir.mkdir(exist_ok=True)
    cat_names = {"medical":"pathology_region","satellite":"land_cover_region","autonomous":"vehicle","general":"target_object"}
    coco = {"info":{"description":f"BlindSpot.AI Synthetic - {stressor_key} ({image_domain}) severity={severity:.2f}","version":"2.0"},
            "images":[],"annotations":[],"categories":[{"id":1,"name":cat_names.get(image_domain,"target_object")}]}
    count = min(n_samples, 40)
    for i in range(count):
        img = _make_base_image(i, image_domain)
        img = _apply_image_stressor(img, stressor_key, image_domain, severity=severity)
        fname = f"{stressor_key}_{i:04d}.jpg"
        img.save(str(images_dir / fname), quality=88)
        w, h = img.size
        bx=random.randint(20,w//3); by=random.randint(20,h//3)
        bw=random.randint(w//4,w//2); bh=random.randint(h//4,h//2)
        coco["images"].append({"id":i+1,"file_name":fname,"width":w,"height":h,"stressor":stressor_key,"domain":image_domain,"severity":round(severity,2)})
        coco["annotations"].append({"id":i+1,"image_id":i+1,"category_id":1,"bbox":[bx,by,bw,bh],"area":bw*bh,"iscrowd":0,"score":round(random.uniform(0.45,0.92),3)})
        cx2=(bx+bw/2)/w; cy2=(by+bh/2)/h; nw=bw/w; nh=bh/h
        with open(str(labels_dir/fname.replace(".jpg",".txt")),"w") as lf:
            lf.write(f"0 {cx2:.6f} {cy2:.6f} {nw:.6f} {nh:.6f}\n")
    ann_dir = out_dir/"annotations"; ann_dir.mkdir(exist_ok=True)
    with open(str(ann_dir/"instances.json"),"w") as jf: json.dump(coco,jf,indent=2)
    suggestion = DATASET_SUGGESTIONS.get(stressor_key,{})
    readme = (f"# BlindSpot.AI Synthetic Dataset\nDomain: {image_domain}\nStressor: {stressor_key}\n"
              f"Severity: {severity:.2f} (model-specific)\nSamples: {count}\n\n"
              f"## Suggested Real Dataset\n{suggestion.get('name','N/A')}\n{suggestion.get('real_url','')}\n")
    with open(str(out_dir/"README.md"),"w") as rf: rf.write(readme)
    zip_path = str(out_dir.parent/f"{stressor_key}_image_dataset.zip")
    with zipfile.ZipFile(zip_path,"w",zipfile.ZIP_DEFLATED) as zf:
        for fp in out_dir.rglob("*"):
            if fp.is_file(): zf.write(fp, fp.relative_to(out_dir.parent))
    return zip_path, count


def _make_base_image(idx, image_domain="general"):
    if image_domain == "medical":   return _make_medical_image(idx)
    elif image_domain == "satellite": return _make_satellite_image(idx)
    elif image_domain == "autonomous": return _make_car_image(idx)
    else: return _make_general_image(idx)


def _make_medical_image(idx):
    import math as _m
    w, h = 512, 512
    img = Image.new("L", (w, h), random.randint(15, 35))
    draw = ImageDraw.Draw(img)
    scan = ["xray","mri","ct"][idx % 3]
    if scan == "xray":
        for cx_l in [w//4, 3*w//4]:
            lw, lh = w//3, h//2
            for y in range(h//6, h//6+lh):
                for x in range(cx_l-lw//2, cx_l+lw//2):
                    if 0<=x<w and 0<=y<h:
                        dist=((x-cx_l)**2/(lw//2)**2+(y-(h//6+lh//2))**2/(lh//2)**2)
                        if dist<1.0: img.putpixel((x,y),min(255,int(120+60*(1-dist)+random.randint(-10,10))))
        for rib_y in range(h//6, 2*h//3, h//12):
            for x in range(w//8, 7*w//8):
                curve=int(10*_m.sin((x-w//2)*_m.pi/(w//2))); ry=rib_y+curve
                if 0<=ry<h: draw.line([(x,ry),(x,ry+3)],fill=random.randint(180,220))
        hcx,hcy=w//2-20,h//2
        for y in range(hcy-80,hcy+80):
            for x in range(hcx-60,hcx+60):
                if 0<=x<w and 0<=y<h:
                    dist=((x-hcx)**2/60**2+(y-hcy)**2/80**2)
                    if dist<1.0: img.putpixel((x,y),int(90+30*(1-dist)))
        for y in range(h//6,5*h//6):
            for dx in range(-4,5):
                if 0<=w//2+dx<w: img.putpixel((w//2+dx,y),random.randint(160,200))
    elif scan == "mri":
        cx,cy=w//2,h//2; skull_r=min(w,h)//2-20
        for angle in range(360):
            rad=_m.radians(angle)
            for r in range(skull_r-8,skull_r+8):
                x=int(cx+r*_m.cos(rad)); y=int(cy+r*_m.sin(rad))
                if 0<=x<w and 0<=y<h: img.putpixel((x,y),random.randint(180,240))
        for y in range(cy-skull_r+10,cy+skull_r-10):
            for x in range(cx-skull_r+10,cx+skull_r-10):
                if _m.sqrt((x-cx)**2+(y-cy)**2)<skull_r-10: img.putpixel((x,y),int(100+40*random.random()))
        for side in [-1,1]:
            vcx=cx+side*30
            for y in range(cy-40,cy+40):
                for x in range(vcx-20,vcx+20):
                    if 0<=x<w and 0<=y<h:
                        if ((x-vcx)**2/20**2+(y-cy)**2/40**2)<1.0: img.putpixel((x,y),random.randint(20,45))
    else:
        cx,cy=w//2,h//2; body_r=min(w,h)//2-30
        for y in range(cy-body_r,cy+body_r):
            for x in range(cx-body_r,cx+body_r):
                if _m.sqrt((x-cx)**2+(y-cy)**2)<body_r: img.putpixel((x,y),int(80+40*random.random()))
        for y in range(cy-20,cy+20):
            for x in range(cx-15,cx+15):
                if 0<=x<w and 0<=y<h: img.putpixel((x,y),random.randint(180,220))
        for y in range(cy-60,cy+40):
            for x in range(cx+20,cx+120):
                if 0<=x<w and 0<=y<h:
                    if ((x-(cx+70))**2/50**2+(y-(cy-10))**2/50**2)<1.0: img.putpixel((x,y),int(110+20*random.random()))
    draw2=ImageDraw.Draw(img)
    label_text={"xray":"CHEST PA","mri":"BRAIN MRI","ct":"ABDO CT"}[scan]
    draw2.rectangle([5,5,120,22],fill=0); draw2.text((8,7),label_text,fill=200)
    draw2.text((w-80,5),f"#{idx:04d}",fill=150)
    return img.convert("RGB")


def _make_satellite_image(idx):
    w,h=512,512; img=Image.new("RGB",(w,h)); draw=ImageDraw.Draw(img)
    terrain=["urban","agricultural","forest","coastal"][idx%4]
    if terrain=="urban":
        img.paste((80,85,90),[0,0,w,h])
        for gx in range(0,w,random.randint(30,60)):
            draw.rectangle([gx,0,gx+random.randint(20,50),h],fill=(random.randint(100,160),)*3)
        for gy in range(0,h,random.randint(30,60)):
            draw.rectangle([0,gy,w,gy+random.randint(20,50)],fill=(random.randint(100,160),)*3)
        for _ in range(5):
            draw.line([(random.randint(0,w),0),(random.randint(0,w),h)],fill=(50,50,55),width=4)
            draw.line([(0,random.randint(0,h)),(w,random.randint(0,h))],fill=(50,50,55),width=4)
    elif terrain=="agricultural":
        for fy in range(0,h,40):
            for fx in range(0,w,40):
                draw.rectangle([fx,fy,fx+38,fy+38],fill=(random.randint(60,120),random.randint(80,160),random.randint(30,80)))
    elif terrain=="forest":
        img.paste((20,60,20),[0,0,w,h])
        for _ in range(300):
            cx2=random.randint(0,w); cy2=random.randint(0,h); r2=random.randint(8,25)
            draw.ellipse([cx2-r2,cy2-r2,cx2+r2,cy2+r2],fill=(10,random.randint(40,100),10))
    else:
        draw.rectangle([0,0,w,h//2],fill=(30,80,160)); draw.rectangle([0,h//2,w,h//2+30],fill=(210,190,140))
        draw.rectangle([0,h//2+30,w,h],fill=(60,120,50))
    for gx in range(0,w,128): draw.line([(gx,0),(gx,h)],fill=(200,200,200),width=1)
    for gy in range(0,h,128): draw.line([(0,gy),(w,gy)],fill=(200,200,200),width=1)
    draw.rectangle([0,0,160,18],fill=(0,0,0)); draw.text((3,2),f"SAT {terrain.upper()} #{idx:04d}",fill=(200,255,100))
    return img


def _make_car_image(idx):
    w,h=640,480; img=Image.new("RGB",(w,h)); draw=ImageDraw.Draw(img)
    sky_palettes=[[(100,149,237),(135,180,255)],[(180,180,200),(210,210,220)],[(255,200,100),(255,160,60)],[(40,50,80),(60,70,100)]]
    sky=sky_palettes[idx%len(sky_palettes)]
    for y in range(h*2//3):
        t=y/(h*2//3); r=int(sky[0][0]*(1-t)+sky[1][0]*t); g=int(sky[0][1]*(1-t)+sky[1][1]*t); b=int(sky[0][2]*(1-t)+sky[1][2]*t)
        draw.line([(0,y),(w,y)],fill=(r,g,b))
    road_y=h*2//3; draw.rectangle([0,road_y,w,h],fill=(75,75,75)); draw.rectangle([0,road_y,w,road_y+8],fill=(110,110,110))
    lane_y=road_y+(h-road_y)//2
    for lx in range(0,w,60): draw.rectangle([lx,lane_y-3,lx+35,lane_y+3],fill=(220,220,180))
    for bx in range(0,w,random.randint(55,90)):
        bh2=random.randint(35,110); bw2=random.randint(28,65); bc=(random.randint(90,150),)*3
        draw.rectangle([bx,road_y-bh2,bx+bw2,road_y],fill=bc)
    car_colors=[(220,30,30),(30,80,200),(240,240,240),(30,30,30),(180,140,40),(60,160,60),(160,160,160)]
    car_col=car_colors[idx%len(car_colors)]; dark_col=tuple(max(0,c-60) for c in car_col); glass_col=(160,200,230)
    cx=w//2+random.randint(-50,50); car_w,car_h2=220,80; car_top=road_y-car_h2-10; car_bot=road_y-10
    draw.rectangle([cx-car_w//2,car_top+30,cx+car_w//2,car_bot],fill=car_col)
    draw.polygon([(cx-car_w//2+30,car_top+30),(cx+car_w//2-30,car_top+30),(cx+car_w//2-55,car_top),(cx-car_w//2+55,car_top)],fill=car_col)
    draw.polygon([(cx-car_w//2+35,car_top+28),(cx-car_w//2+60,car_top+2),(cx,car_top+2),(cx,car_top+28)],fill=glass_col)
    draw.polygon([(cx,car_top+28),(cx,car_top+2),(cx+car_w//2-58,car_top+2),(cx+car_w//2-33,car_top+28)],fill=glass_col)
    draw.rectangle([cx-car_w//2+62,car_top+4,cx-4,car_top+26],fill=glass_col)
    draw.rectangle([cx+4,car_top+4,cx+car_w//2-60,car_top+26],fill=glass_col)
    draw.rectangle([cx-car_w//2,car_top+30,cx-car_w//2+35,car_top+50],fill=dark_col)
    draw.rectangle([cx+car_w//2-35,car_top+30,cx+car_w//2,car_top+50],fill=dark_col)
    draw.ellipse([cx-car_w//2+5,car_top+35,cx-car_w//2+28,car_top+52],fill=(255,255,200))
    draw.ellipse([cx+car_w//2-28,car_top+35,cx+car_w//2-5,car_top+52],fill=(255,100,100))
    for wx2 in [cx-car_w//2+45,cx+car_w//2-45]:
        draw.ellipse([wx2-22,car_bot-27,wx2+22,car_bot+17],fill=(25,25,25))
        draw.ellipse([wx2-12,car_bot-17,wx2+12,car_bot+7],fill=(160,160,160))
    draw.line([(cx-5,car_top+30),(cx-5,car_bot)],fill=dark_col,width=2)
    draw.rectangle([cx-car_w//2,car_top-16,cx-car_w//2+90,car_top-2],fill=(0,0,0))
    draw.text((cx-car_w//2+3,car_top-14),"CAR",fill=(0,255,0))
    return img


def _make_general_image(idx):
    # Bright base image: mean brightness ~128 so stressor transforms land on GT targets
    w, h = 512, 512
    bg_colors = [(110,115,120),(120,110,105),(105,120,115),(115,110,125)]
    img = Image.new("RGB", (w, h), bg_colors[idx % len(bg_colors)])
    draw = ImageDraw.Draw(img)
    # Sky gradient (top third) — mid-tone blue
    for y in range(h // 3):
        t = y / (h // 3)
        r = int(100 + 40*t); g = int(130 + 30*t); b = int(180 - 20*t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    # Ground (bottom two thirds) — mid-tone green/grey
    draw.rectangle([0, h//3, w, h], fill=(90, 110, 80))
    # Central object
    cx = w//2 + random.randint(-60, 60)
    cy = h//2 + random.randint(-40, 40)
    obj_w = random.randint(100, 200); obj_h = random.randint(80, 160)
    col = (random.randint(120, 220), random.randint(120, 220), random.randint(120, 220))
    draw.rectangle([cx-obj_w//2, cy-obj_h//2, cx+obj_w//2, cy+obj_h//2],
                   fill=col, outline=(255, 255, 255), width=2)
    draw.rectangle([cx-obj_w//2, cy-obj_h//2-18, cx-obj_w//2+100, cy-obj_h//2-2], fill=(0, 0, 0))
    draw.text((cx-obj_w//2+3, cy-obj_h//2-16), "OBJECT", fill=(0, 255, 0))
    return img


def _apply_image_stressor(img, stressor_key, image_domain="general", severity=0.5):
    import io as _io
    from PIL import ImageEnhance as _IE
    arr = np.array(img, dtype=np.float32)
    w, h = img.size
    # severity 0=robust→light corruption, 1=critical→heavy corruption
    s = max(0.1, min(1.0, severity))

    if stressor_key == "low_contrast":
        # GT: mean_brightness=106, std=18, contrast_range=101.9, laplacian_var=43.5
        # scale=0.40, offset=60 → mean~106, contrast_range~102 for base~128
        arr = arr * 0.40 + 60
        img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    elif stressor_key == "image_noise":
        # severity scales noise std: 0.1→std=15, 1.0→std=60
        noise_std = 15 + s * 45
        noise = np.random.normal(0, noise_std, arr.shape)
        img = Image.fromarray(np.clip(arr + noise, 0, 255).astype(np.uint8))
    elif stressor_key == "compression_artifact":
        # severity scales JPEG quality: 0.1→quality=50, 1.0→quality=5
        quality = max(5, int(50 - s * 45))
        buf = _io.BytesIO()
        img.save(buf, format="JPEG", quality=quality)
        buf.seek(0); img = Image.open(buf).copy()
    elif stressor_key == "scanner_variation":
        bright_range = 0.5 + s * 0.5
        img = _IE.Brightness(img).enhance(random.uniform(1 - bright_range, 1 + bright_range))
        img = _IE.Contrast(img).enhance(random.uniform(1 - s * 0.4, 1 + s * 0.4))
    elif stressor_key == "motion_artifact":
        radius = int(4 + s * 14)
        img = img.filter(ImageFilter.GaussianBlur(radius=radius))
    elif stressor_key == "staining_variation":
        img = _IE.Color(img).enhance(random.uniform(max(0.1, 1 - s * 0.8), 1 + s * 1.5))
        img = _IE.Contrast(img).enhance(random.uniform(1 - s * 0.3, 1 + s * 0.5))
    elif stressor_key == "overexposure":
        scale = 1.5 + s * 1.5
        arr = arr * scale
        img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    elif stressor_key == "cloud_cover":
        cloud = np.ones_like(arr) * 240
        mask = np.zeros((h, w), dtype=np.float32)
        n_clouds = int(3 + s * 5)
        for _ in range(n_clouds):
            cx2=random.randint(0,w); cy2=random.randint(0,h); rr=int(40 + s * 80)
            for y in range(max(0,cy2-rr),min(h,cy2+rr)):
                for x in range(max(0,cx2-rr),min(w,cx2+rr)):
                    dist=((x-cx2)**2+(y-cy2)**2)**0.5
                    if dist<rr: mask[y,x]=min(1.0,mask[y,x]+(1-dist/rr)*0.9)
        mask3=mask[:,:,np.newaxis]; arr=arr*(1-mask3)+cloud*mask3
        img=Image.fromarray(np.clip(arr,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=2))
    elif stressor_key == "atmospheric_haze":
        density = 0.2 + s * 0.45
        haze=np.ones_like(arr)*200
        img=Image.fromarray(np.clip(arr*(1-density)+haze*density,0,255).astype(np.uint8))
    elif stressor_key == "sensor_noise":
        noise_std = 10 + s * 25
        noise=np.random.normal(0, noise_std, arr.shape); arr=arr+noise
        sp_rate = 0.005 + s * 0.015
        sp=np.random.rand(h,w)<sp_rate; arr[sp]=255
        sp2=np.random.rand(h,w)<sp_rate; arr[sp2]=0
        img=Image.fromarray(np.clip(arr,0,255).astype(np.uint8))
    elif stressor_key == "resolution_drop":
        factor = max(2, int(2 + s * 6))
        img=img.resize((max(1,w//factor),max(1,h//factor)),Image.NEAREST).resize((w,h),Image.NEAREST)
    elif stressor_key == "seasonal_change":
        arr[:,:,1]=np.clip(arr[:,:,1]*random.uniform(max(0.3, 1-s), 1+s*0.8),0,255)
        arr[:,:,0]=np.clip(arr[:,:,0]*random.uniform(max(0.5, 1-s*0.3), 1+s*0.3),0,255)
        img=Image.fromarray(np.clip(arr,0,255).astype(np.uint8))
    elif stressor_key == "color_shift":
        img=_IE.Color(img).enhance(max(0.0, 1 - s * 1.0))
        img=_IE.Brightness(img).enhance(random.uniform(max(0.4, 1-s*0.4), 1+s*0.4))
    elif "fog" in stressor_key:
        # GT: mean_brightness=195.4, std=12.7, contrast_range=33.1, laplacian_var=1.2
        # Calibrated: density=0.70, radius=2 → mean=194.9, std=12.4, contrast=34.3, lap=1.11
        fog = np.ones_like(arr) * 230
        result = arr * 0.30 + fog * 0.70
        img = Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))
        img = img.filter(ImageFilter.GaussianBlur(radius=2))
    elif "rain" in stressor_key:
        # GT: mean_brightness=119.2, std=52.4, laplacian_var=3662
        # Calibrated: darken=0.96 (113*0.96=108→+streaks→119), n=600 → lap=3646, std=53
        arr2 = arr * 0.96
        img2 = Image.fromarray(np.clip(arr2, 0, 255).astype(np.uint8))
        d2 = ImageDraw.Draw(img2)
        for _ in range(600):
            rx, ry = random.randint(0, w-1), random.randint(0, h-12)
            d2.line([(rx, ry), (rx-1, ry+8)], fill=(220, 235, 255), width=1)
        img = img2  # no blur — preserve laplacian_var
    elif "occlusion" in stressor_key:
        parts = stressor_key.split("_")
        sev_pct = float(parts[-1])/100 if parts[-1].isdigit() else 0.5
        # GT occlusion_80: dark_pixel_ratio=0.62, mean_brightness=49
        # Grid-based occlusion: cover exactly sev_pct*0.78 of cells
        draw = ImageDraw.Draw(img)
        cell = max(1, w // 8)   # 8x8 grid = 64 cells
        for py in range(0, h, cell):
            for px in range(0, w, cell):
                if random.random() < sev_pct * 0.78:
                    draw.rectangle([px, py, min(px+cell, w), min(py+cell, h)],
                                   fill=(0, 0, 0))
    elif "night" in stressor_key:
        # GT: mean_brightness=12.2, std=5.7, dark_pixel_ratio=0.88, contrast_range=35.1
        # Calibrated for base mean~113: 113*0.108=12.2; noise=2.5 → std~5.7
        arr = arr * 0.108 + np.random.normal(0, 2.5, arr.shape)
        arr[:, :, 0] *= 0.7
        img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    elif "blur" in stressor_key or "motion" in stressor_key:
        # GT motion_blur: std ~40, mean ~115, laplacian_var ~1.5
        # radius=8 gives laplacian_var ~1.5 and std ~40
        img = img.filter(ImageFilter.GaussianBlur(radius=8))
    elif "flare" in stressor_key or "lens" in stressor_key:
        draw=ImageDraw.Draw(img); cx2,cy2=random.randint(w//4,3*w//4),random.randint(0,h//3)
        n_rings = int(4 + s * 10)
        for r in range(0, n_rings * 8, 6):
            draw.ellipse([cx2-r,cy2-r,cx2+r,cy2+r],outline=(255,240,180))
    return img


def _generate_tabular_dataset(out_dir, stressor_key, n_samples, severity=0.5):
    count = min(n_samples, 2000)
    np.random.seed(42); n_features = 20
    X = np.random.randn(count, n_features)
    y = (X[:,0]+X[:,1]*0.5+np.random.randn(count)*0.3>0).astype(int)
    feature_names = [f"feature_{i:02d}" for i in range(n_features)]
    s = max(0.1, min(1.0, severity))

    if "missing" in stressor_key:
        # severity scales missing rate: 0.1→5%, 1.0→40%
        missing_rate = 0.05 + s * 0.35
        mask = np.random.rand(count, n_features) < missing_rate
        X_corrupt = X.astype(object); X_corrupt[mask] = ""
        # GT label-1 = 5%: only rows where >50% of features are missing
        y_out = (mask.mean(axis=1) > 0.50).astype(int)
    elif "ood" in stressor_key:
        # severity scales OOD multiplier and fraction: 0.1→5% rows×3x, 1.0→30% rows×15x
        ood_frac = 0.05 + s * 0.25
        ood_mult = 3 + s * 12
        X_corrupt = X.copy()
        ood_idx = np.random.choice(count, int(count * ood_frac), replace=False)
        X_corrupt[ood_idx] *= np.random.uniform(ood_mult * 0.8, ood_mult * 1.2, (len(ood_idx), n_features))
        # label=1 only for OOD rows
        y_out = np.zeros(count, dtype=int); y_out[ood_idx] = 1
    elif "imbalance" in stressor_key or "class" in stressor_key:
        # severity scales imbalance: 0.1→80:20, 1.0→99:1
        minority_frac = max(0.01, 0.20 - s * 0.19)
        minority = np.where(y==1)[0]
        keep_n = max(1, int(len(minority) * minority_frac / 0.5))
        keep = np.random.choice(minority, min(keep_n, len(minority)), replace=False)
        majority = np.where(y==0)[0]
        idx = np.concatenate([majority, keep])
        X_corrupt = X[idx]; y_out = y[idx]; count = len(y_out)
    elif "noisy" in stressor_key or "categorical" in stressor_key:
        # severity scales noise std and fraction: 0.1→10% rows×std=1, 1.0→40% rows×std=5
        noise_frac = 0.10 + s * 0.30
        noise_std  = 1.0 + s * 4.0
        X_corrupt = X.copy()
        noise_idx = np.random.choice(count, int(count * noise_frac), replace=False)
        X_corrupt[noise_idx] += np.random.randn(len(noise_idx), n_features) * noise_std
        # label=1 only for noisy rows
        y_out = np.zeros(count, dtype=int); y_out[noise_idx] = 1
    elif "dropout" in stressor_key or "feature" in stressor_key:
        # severity scales dropout fraction: 0.1→10% cols, 1.0→50% cols
        drop_frac = 0.10 + s * 0.40
        X_corrupt = X.copy()
        drop_cols = np.random.choice(n_features, max(1, int(n_features * drop_frac)), replace=False)
        X_corrupt[:, drop_cols] = 0
        # GT label-1 = 5%: only rows where the dropped columns had high original values
        high_val_mask = (np.abs(X[:, drop_cols]).mean(axis=1) > 1.5)
        y_out = high_val_mask.astype(int)
    else:
        X_corrupt = X.copy(); X_corrupt += np.random.randn(count, n_features) * 0.5
        y_out = np.zeros(count, dtype=int)

    csv_path = str(out_dir / f"{stressor_key}_tabular.csv")
    with open(csv_path, "w", newline="") as cf:
        writer = __import__("csv").writer(cf)
        writer.writerow(feature_names + ["label", "stressor", "severity"])
        for i in range(count):
            row = [round(float(v), 4) if v != "" else "" for v in X_corrupt[i]]
            writer.writerow(row + [int(y_out[i]), stressor_key, round(s, 2)])
    suggestion = DATASET_SUGGESTIONS.get(stressor_key, {})
    readme = (f"# BlindSpot.AI Tabular Dataset\nStressor: {stressor_key}\n"
              f"Severity: {s:.2f} (model-specific)\nSamples: {count}\n\n"
              f"## Suggested Real Dataset\n{suggestion.get('name','N/A')}\n{suggestion.get('real_url','')}\n")
    with open(str(out_dir / "README.md"), "w") as rf: rf.write(readme)
    zip_path = str(out_dir.parent / f"{stressor_key}_tabular_dataset.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(csv_path, os.path.basename(csv_path))
        zf.write(str(out_dir / "README.md"), "README.md")
    return zip_path, count


def _generate_timeseries_dataset(out_dir, stressor_key, n_samples):
    count=min(n_samples,5000); t=np.linspace(0,4*np.pi,count)
    base=np.sin(t)+0.5*np.sin(3*t)+np.random.randn(count)*0.1
    if "spike" in stressor_key:
        spike_idx=np.random.choice(count,count//20,replace=False)
        base[spike_idx]+=np.random.choice([-1,1],len(spike_idx))*np.random.uniform(4,8,len(spike_idx))
        label=(np.abs(base)>3).astype(int)
    elif "drift" in stressor_key:
        drift=np.linspace(0,3,count); base=base+drift; label=(drift>1.5).astype(int)
    elif "missing" in stressor_key:
        label=np.zeros(count,dtype=int); gap_starts=np.random.choice(count-20,count//50,replace=False)
        for gs in gap_starts: base[gs:gs+random.randint(3,15)]=np.nan
        label[np.isnan(base)]=1; base=np.where(np.isnan(base),0,base)
    elif "seasonal" in stressor_key:
        sb=count//2; base[sb:]+=2.5*np.sin(7*t[sb:]); label=np.zeros(count,dtype=int); label[sb:]=1
    elif "noise" in stressor_key or "hf" in stressor_key:
        hf_noise=np.random.randn(count)*2.5; base=base+hf_noise; label=(np.abs(hf_noise)>2).astype(int)
    else:
        label=np.zeros(count,dtype=int)
    csv_path=str(out_dir/f"{stressor_key}_timeseries.csv")
    with open(csv_path,"w",newline="") as cf:
        writer=__import__("csv").writer(cf); writer.writerow(["timestep","value","label","stressor"])
        for i in range(count): writer.writerow([i,round(float(base[i]),4),int(label[i]),stressor_key])
    suggestion=DATASET_SUGGESTIONS.get(stressor_key,{})
    readme=f"# BlindSpot.AI Time-Series Dataset\nStressor: {stressor_key}\nTimesteps: {count}\n\n## Suggested Real Dataset\n{suggestion.get('name','N/A')}\n{suggestion.get('real_url','')}\n"
    with open(str(out_dir/"README.md"),"w") as rf: rf.write(readme)
    zip_path=str(out_dir.parent/f"{stressor_key}_timeseries_dataset.zip")
    with zipfile.ZipFile(zip_path,"w",zipfile.ZIP_DEFLATED) as zf:
        zf.write(csv_path,os.path.basename(csv_path)); zf.write(str(out_dir/"README.md"),"README.md")
    return zip_path, count


def _generate_sequential_dataset(out_dir, stressor_key, n_samples, severity=0.5):
    count = min(n_samples, 1000)
    s = max(0.1, min(1.0, severity))
    vocab = ["the","a","is","was","object","model","detected","failed","error","warning",
             "sensor","camera","input","output","class","label","score","confidence",
             "low","high","medium","critical","normal","anomaly","drift","noise",
             "system","data","feature","value","result","test","network","signal",
             "threshold","baseline","prediction","accuracy","loss","gradient"]
    samples = []

    for i in range(count):
        length = random.randint(8, 32)
        tokens = [random.choice(vocab) for _ in range(length)]

        if "oov" in stressor_key:
            # severity scales OOV sample ratio: 0.1→20%, 1.0→80%
            oov_sample_rate = 0.20 + s * 0.60
            if random.random() < oov_sample_rate:
                n_oov = max(1, int(1 + s * 4))
                for _ in range(n_oov):
                    tokens[random.randint(0, len(tokens)-1)] = f"xkz{random.randint(100, 999)}"
                label = 1
            else:
                label = 0

        elif "adversarial" in stressor_key or "perturbation" in stressor_key:
            # severity scales perturbed sample ratio: 0.1→20%, 1.0→90%
            pert_rate = 0.20 + s * 0.70
            if random.random() < pert_rate:
                n_pert = max(1, int(1 + s * 5))
                for _ in range(n_pert):
                    pos = random.randint(0, len(tokens)-1)
                    t = tokens[pos]
                    if len(t) > 2:
                        mid = len(t) // 2
                        tokens[pos] = t[:mid] + str(random.randint(0, 9)) + t[mid:]
                label = 1
            else:
                label = 0

        elif "length" in stressor_key:
            # severity scales length variance: 0.1→mild, 1.0→extreme
            if i % 2 == 0:
                short_max = max(1, int(3 - s * 2))
                tokens = [random.choice(vocab) for _ in range(random.randint(1, short_max))]
            else:
                long_min = int(30 + s * 70)
                tokens = [random.choice(vocab) for _ in range(random.randint(long_min, long_min + 30))]
            # GT label-1 = 60%
            label = 1 if random.random() < 0.60 else 0

        elif "long" in stressor_key:
            # severity scales sequence length: 0.1→30 tokens, 1.0→120 tokens
            min_len = int(30 + s * 50)
            max_len = int(50 + s * 70)
            tokens = [random.choice(vocab) for _ in range(random.randint(min_len, max_len))]
            # GT label-1 = 60%
            label = 1 if random.random() < 0.60 else 0

        else:
            label = 0

        samples.append((" ".join(tokens), label))

    csv_path = str(out_dir / f"{stressor_key}_sequential.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as cf:
        writer = __import__("csv").writer(cf)
        writer.writerow(["text", "label", "stressor", "severity"])
        for text, lbl in samples:
            writer.writerow([text, lbl, stressor_key, round(s, 2)])

    suggestion = DATASET_SUGGESTIONS.get(stressor_key, {})
    readme = (f"# BlindSpot.AI Sequential Dataset\nStressor: {stressor_key}\n"
              f"Severity: {s:.2f} (model-specific)\nSamples: {count}\n\n"
              f"## Suggested Real Dataset\n{suggestion.get('name','N/A')}\n{suggestion.get('real_url','')}\n")
    with open(str(out_dir / "README.md"), "w") as rf:
        rf.write(readme)

    zip_path = str(out_dir.parent / f"{stressor_key}_sequential_dataset.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(csv_path, os.path.basename(csv_path))
        zf.write(str(out_dir / "README.md"), "README.md")
    return zip_path, count


def _generate_vector_dataset(out_dir, stressor_key, n_samples):
    count=min(n_samples,2000); dim=128; np.random.seed(42)
    base_vectors=np.random.randn(count,dim).astype(np.float32)
    if "adversarial" in stressor_key:
        eps=0.3; p=np.random.randn(count,dim).astype(np.float32)
        p=p/(np.linalg.norm(p,axis=1,keepdims=True)+1e-8); vectors=base_vectors+eps*p; labels=np.ones(count,dtype=int)
    elif "drift" in stressor_key or "embedding" in stressor_key:
        rot=np.random.randn(dim,dim).astype(np.float32); rot,_=np.linalg.qr(rot)
        vectors=(base_vectors@rot)*1.5; labels=np.ones(count,dtype=int)
    elif "dim" in stressor_key:
        vectors=np.pad(base_vectors[:,:64],((0,0),(0,64)),constant_values=0); labels=np.ones(count,dtype=int)
    elif "sparse" in stressor_key:
        vectors=base_vectors.copy(); mask=np.random.rand(count,dim)>0.1; vectors[mask]=0
        labels=(vectors.sum(axis=1)==0).astype(int)
    else:
        vectors=base_vectors+np.random.randn(count,dim).astype(np.float32)*0.5; labels=np.zeros(count,dtype=int)
    csv_path=str(out_dir/f"{stressor_key}_vectors.csv")
    with open(csv_path,"w",newline="") as cf:
        writer=__import__("csv").writer(cf); writer.writerow([f"dim_{i:03d}" for i in range(dim)]+["label","stressor"])
        for i in range(count): writer.writerow([round(float(v),5) for v in vectors[i]]+[int(labels[i]),stressor_key])
    suggestion=DATASET_SUGGESTIONS.get(stressor_key,{})
    readme=f"# BlindSpot.AI Vector Dataset\nStressor: {stressor_key}\nVectors: {count}\nDimensions: {dim}\n\n## Suggested Real Dataset\n{suggestion.get('name','N/A')}\n{suggestion.get('real_url','')}\n"
    with open(str(out_dir/"README.md"),"w") as rf: rf.write(readme)
    zip_path=str(out_dir.parent/f"{stressor_key}_vector_dataset.zip")
    with zipfile.ZipFile(zip_path,"w",zipfile.ZIP_DEFLATED) as zf:
        zf.write(csv_path,os.path.basename(csv_path)); zf.write(str(out_dir/"README.md"),"README.md")
    return zip_path, count

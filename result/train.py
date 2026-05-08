from ultralytics import YOLO

# 1. Download a tiny, pre-trained base model automatically
model = YOLO('yolov8n.pt') 

# 2. Train the model using the synthetic data you just generated!
if __name__ == '__main__':
    results = model.train(
        data='dataset.yaml',   # Tell the model where your dataset rules are
        epochs=10,             # Go through the dataset 10 times
        imgsz=640,             # Keep the image size to 640x640 pixels
        workers=1              # Windows works best with 1 worker
    )

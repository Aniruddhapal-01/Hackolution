FROM python:3.11-slim

WORKDIR /app

# Install only essential system deps — libgl1-mesa-glx renamed to libgl1 in newer Debian
RUN apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
        libpq-dev \
        gcc \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Core dependencies (always needed)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
        fastapi==0.111.0 \
        uvicorn[standard]==0.29.0 \
        sqlalchemy==2.0.30 \
        psycopg2-binary==2.9.9 \
        celery==5.4.0 \
        redis==5.0.4 \
        boto3==1.34.110 \
        python-multipart==0.0.9 \
        pydantic==2.7.1 \
        pydantic-settings==2.2.1 \
        python-dotenv==1.0.1 \
        httpx==0.27.0 \
        Pillow==10.3.0 \
        numpy==1.26.4 \
        scipy==1.13.0 \
        scikit-learn==1.4.2 \
        joblib==1.4.2 \
        google-generativeai==0.5.2 \
        reportlab==4.2.2 \
        python-docx==1.1.2

# opencv — optional, skip if it fails (not needed in MOCK_ML=true mode)
RUN pip install --no-cache-dir opencv-python-headless==4.9.0.80 || \
    echo "opencv skipped — not required in mock mode"

# torch/torchvision — CPU only, skip if it fails (not needed in MOCK_ML=true mode)
RUN pip install --no-cache-dir \
    torch==2.3.0 torchvision==0.18.0 \
    --index-url https://download.pytorch.org/whl/cpu || \
    echo "torch skipped — not required in mock mode"

# diffusers stack — skip if it fails (not needed in MOCK_ML=true mode)
RUN pip install --no-cache-dir \
    diffusers==0.27.2 transformers==4.41.0 \
    accelerate==0.30.0 peft==0.11.0 safetensors==0.4.3 || \
    echo "diffusers skipped — not required in mock mode"

COPY . .

RUN mkdir -p /app/weights /app/generated /tmp/seeds /app/data

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

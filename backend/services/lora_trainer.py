"""
LoRA Trainer Service
Trains a LoRA adapter on top of Stable Diffusion XL using 5-10 seed images.
Saves adapter weights to disk for use by the Generative Engine.
"""
import os
import json
import time
import logging
from pathlib import Path
from typing import List, Optional

import torch
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

WEIGHTS_DIR = os.getenv("WEIGHTS_DIR", "/app/weights")
USE_MOCK = os.getenv("MOCK_ML", "true").lower() == "true"


def train_lora(
    project_id: str,
    seed_image_paths: List[str],
    object_name: str = "custom_object",
    num_steps: int = 500,
    lora_rank: int = 16,
    lora_alpha: int = 32,
    progress_callback=None,
) -> str:
    """
    Fine-tune Stable Diffusion XL with LoRA on seed images.
    Returns path to saved LoRA weights.
    """
    output_dir = Path(WEIGHTS_DIR) / project_id
    output_dir.mkdir(parents=True, exist_ok=True)
    weights_path = str(output_dir / "lora_weights.safetensors")

    if USE_MOCK:
        return _mock_train_lora(project_id, seed_image_paths, weights_path, progress_callback)

    try:
        from diffusers import StableDiffusionXLPipeline
        from peft import LoraConfig, get_peft_model
        from torch.utils.data import Dataset, DataLoader
        from torchvision import transforms

        logger.info(f"[LoRA] Starting training for project {project_id} with {len(seed_image_paths)} images")

        pipe = StableDiffusionXLPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0",
            torch_dtype=torch.float16,
            use_safetensors=True,
        )
        pipe = pipe.to("cuda" if torch.cuda.is_available() else "cpu")

        lora_config = LoraConfig(
            r=lora_rank,
            lora_alpha=lora_alpha,
            target_modules=["to_q", "to_v", "to_k", "to_out.0"],
            lora_dropout=0.05,
            bias="none",
        )

        unet = get_peft_model(pipe.unet, lora_config)
        unet.print_trainable_parameters()

        transform = transforms.Compose([
            transforms.Resize((1024, 1024)),
            transforms.ToTensor(),
            transforms.Normalize([0.5], [0.5]),
        ])

        images = []
        for path in seed_image_paths:
            try:
                img = Image.open(path).convert("RGB")
                images.append(transform(img))
            except Exception as e:
                logger.warning(f"Failed to load image {path}: {e}")

        optimizer = torch.optim.AdamW(unet.parameters(), lr=1e-4)

        unet.train()
        for step in range(num_steps):
            for img_tensor in images:
                img_batch = img_tensor.unsqueeze(0).to(pipe.device, dtype=torch.float16)
                noise = torch.randn_like(img_batch)
                timesteps = torch.randint(0, 1000, (1,), device=pipe.device)
                noisy = pipe.scheduler.add_noise(img_batch, noise, timesteps)

                with torch.autocast("cuda"):
                    latents = pipe.vae.encode(img_batch).latent_dist.sample() * 0.18215
                    noisy_latents = pipe.scheduler.add_noise(latents, noise[:, :4, :, :], timesteps)
                    encoder_hidden = pipe.text_encoder(
                        pipe.tokenizer(
                            [f"a photo of {object_name}"],
                            return_tensors="pt", padding=True
                        ).input_ids.to(pipe.device)
                    )[0]
                    noise_pred = unet(noisy_latents, timesteps, encoder_hidden).sample

                loss = torch.nn.functional.mse_loss(noise_pred, noise[:, :4, :, :])
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

            if progress_callback and step % 50 == 0:
                pct = int((step / num_steps) * 100)
                progress_callback(pct)
                logger.info(f"[LoRA] Step {step}/{num_steps}, loss: {loss.item():.4f}")

        unet.save_pretrained(str(output_dir))
        logger.info(f"[LoRA] Training complete. Weights saved to {output_dir}")
        return weights_path

    except Exception as e:
        logger.error(f"[LoRA] Training failed: {e}")
        raise


def _mock_train_lora(project_id, seed_image_paths, weights_path, progress_callback):
    """Simulated LoRA training for environments without GPU."""
    logger.info(f"[LoRA MOCK] Simulating training for project {project_id}")
    steps = 10
    for i in range(steps):
        time.sleep(1.5)
        if progress_callback:
            progress_callback(int((i + 1) / steps * 100))

    meta = {
        "project_id": project_id,
        "seed_count": len(seed_image_paths),
        "lora_rank": 16,
        "lora_alpha": 32,
        "mock": True,
    }
    with open(weights_path.replace(".safetensors", "_meta.json"), "w") as f:
        json.dump(meta, f)

    Path(weights_path).write_text("MOCK_LORA_WEIGHTS")
    logger.info(f"[LoRA MOCK] Mock weights saved to {weights_path}")
    return weights_path

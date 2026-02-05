# detector.py — FIXED & WORKING

import torch
import numpy as np
from PIL import Image
from torchvision import transforms
from transformers import AutoImageProcessor, AutoModelForImageClassification
import pytesseract
import colorsys

SUPPORTED = {"tomato", "brinjal", "onion", "orange"}

MODEL_NAME = "AventIQ-AI/Food-Classification-AI-Model"

processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
model = AutoModelForImageClassification.from_pretrained(MODEL_NAME)
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=processor.image_mean,
        std=processor.image_std
    )
])

# -------------------------------
# IMAGE HELPERS
# -------------------------------
def avg_color(image):
    img = image.resize((80, 80))
    arr = np.array(img)
    return arr.mean(axis=(0, 1))

def brightness(rgb):
    return sum(rgb) / 3

def hsv(rgb):
    r, g, b = [x / 255 for x in rgb]
    return colorsys.rgb_to_hsv(r, g, b)

# -------------------------------
# RULE-BASED DETECTION
# -------------------------------
def rule_detect(image):
    rgb = avg_color(image)
    b = brightness(rgb)
    h, s, _ = hsv(rgb)

    # 🍅 TOMATO
    if (h < 0.12 or h > 0.88) and s > 0.25:
        return {"name": "tomato", "confidence": 85.0}

    # 🍆 BRINJAL
    if 0.65 <= h <= 0.9 and b < 170:
        return {"name": "brinjal", "confidence": 88.0}

    # 🧅 ONION
    if s < 0.35 and 90 <= b <= 230:
        return {"name": "onion", "confidence": 80.0}

    return None

# -------------------------------
# OCR FALLBACK
# -------------------------------
def ocr_detect(image):
    try:
        text = pytesseract.image_to_string(image).lower()
        for ing in SUPPORTED:
            if ing in text:
                return {"name": ing, "confidence": 70.0}
    except Exception:
        pass
    return None

# -------------------------------
# ML FALLBACK
# -------------------------------
def ml_detect(image):
    tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        out = model(pixel_values=tensor)
        probs = torch.nn.functional.softmax(out.logits, dim=-1)
        top_p, top_i = torch.topk(probs, k=5)

    LABEL_MAP = {
        "eggplant": "brinjal",
        "aubergine": "brinjal",
        "onion": "onion",
        "tomato": "tomato",
        "orange": "orange",
    }

    for i in range(5):
        label = model.config.id2label[top_i[0][i].item()].lower()
        conf = float(top_p[0][i] * 100)

        for key, mapped in LABEL_MAP.items():
            if key in label and conf >= 60:
                return {"name": mapped, "confidence": round(conf, 1)}

    return None

# -------------------------------
# MAIN ENTRY POINT
# -------------------------------
def detect_ingredients(image_file):
    image_file.seek(0)
    image = Image.open(image_file).convert("RGB")

    # 1️⃣ Rule-based
    rule = rule_detect(image)
    if rule:
        return [rule]

    # 2️⃣ OCR
    ocr = ocr_detect(image)
    if ocr:
        return [ocr]

    # 3️⃣ ML fallback
    ml = ml_detect(image)
    if ml:
        return [ml]

    return []

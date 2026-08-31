"""PyTorch ResNet18-based deepfake detection for images and video frames."""

import os
from typing import BinaryIO

try:
    import cv2
    import numpy as np
    import torch
    import torchvision.transforms as transforms
    from torchvision import models
except ImportError:  # pragma: no cover
    cv2 = None
    np = None
    torch = None
    transforms = None
    models = None

MODEL_FILE = "resnet18_deepfake_best.pth"
MODEL_PATH = os.path.join(os.path.dirname(__file__), MODEL_FILE)

# ImageNet normalization constants used in the notebook
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
IMAGE_SIZE = 224


def build_model(device="cpu"):
    """Create the ResNet18 model architecture from the notebook."""
    if models is None:
        raise RuntimeError("PyTorch is not installed. Install requirements first.")

    model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    model.fc = torch.nn.Linear(model.fc.in_features, 2)
    model = model.to(device)
    return model


def load_model(model_path: str = MODEL_PATH, device: str = "cpu"):
    """Load the saved ResNet18 model weights if the file exists."""
    if torch is None:
        raise RuntimeError("PyTorch is not installed. Install requirements first.")

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model file not found at {model_path}. "
            "Train the notebook model first and save it as resnet18_deepfake_best.pth."
        )

    model = build_model(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    return model


def preprocess_image(frame, image_size: int = IMAGE_SIZE):
    """Resize, normalize, and convert frame to tensor for ResNet18 input."""
    if cv2 is None or np is None or transforms is None:
        raise RuntimeError("OpenCV, NumPy, and torchvision are required.")

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    frame_resized = cv2.resize(frame_rgb, (image_size, image_size))

    transform = transforms.Compose(
        [
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )

    frame_tensor = transform(frame_resized)
    frame_batch = frame_tensor.unsqueeze(0)
    return frame_batch


def fallback_prediction(file_path: str, media_type: str):
    """Return a demo result if the trained model file is not present."""
    filename = os.path.basename(file_path).lower()
    synthetic_hint = (
        0.75
        if any(
            keyword in filename
            for keyword in ["fake", "deepfake", "synthetic", "manipulated"]
        )
        else 0.40
    )
    score = synthetic_hint if media_type == "image" else max(0.25, min(0.82, synthetic_hint + 0.10))
    label = "fake" if score >= 0.5 else "real"

    return {
        "file_path": file_path,
        "media_type": media_type,
        "model_type": "resnet18",
        "mode": "demo_fallback",
        "result": {
            "label": label,
            "probability": float(score),
            "confidence": float(abs(score - 0.5) * 2),
            "class_name": label,
        },
    }


def predict_single_frame(frame, device: str = "cpu"):
    """Predict whether a single frame is real or fake using ResNet18."""
    try:
        model = load_model(device=device)
    except FileNotFoundError:
        raise

    if torch is None:
        raise RuntimeError("PyTorch is not installed.")

    frame_batch = preprocess_image(frame)
    frame_batch = frame_batch.to(device)

    with torch.no_grad():
        outputs = model(frame_batch)
        probabilities = torch.softmax(outputs, dim=1)
        fake_prob = float(probabilities[0, 1].cpu().numpy())

    label = "real" if fake_prob < 0.5 else "fake"
    confidence = float(abs(fake_prob - 0.5) * 2)

    return {
        "label": label,
        "probability": fake_prob,
        "confidence": confidence,
        "class_name": label,
    }


def predict_image_from_path(file_path: str, device: str = "cpu"):
    """Run inference on a single image file using ResNet18."""
    if cv2 is None:
        return fallback_prediction(file_path, "image")

    frame = cv2.imread(file_path)
    if frame is None:
        raise ValueError(f"Could not read image file: {file_path}")

    try:
        prediction = predict_single_frame(frame, device)
        return {
            "file_path": file_path,
            "media_type": "image",
            "model_type": "resnet18",
            "mode": "pytorch_model",
            "result": prediction,
        }
    except FileNotFoundError:
        return fallback_prediction(file_path, "image")


def predict_video_from_path(file_path: str, max_frames: int = 10, device: str = "cpu"):
    """Sample frames from a video and average the predictions using ResNet18."""
    if cv2 is None:
        return fallback_prediction(file_path, "video")

    capture = cv2.VideoCapture(file_path)
    if not capture.isOpened():
        raise ValueError(f"Could not open video file: {file_path}")

    frames = []
    while len(frames) < max_frames:
        success, frame = capture.read()
        if not success:
            break
        frames.append(frame)

    capture.release()

    if not frames:
        raise ValueError(f"No frames were extracted from video: {file_path}")

    try:
        model = load_model(device=device)
    except FileNotFoundError:
        return fallback_prediction(file_path, "video")

    if torch is None or np is None:
        raise RuntimeError("PyTorch and NumPy are required.")

    probability_values = []

    with torch.no_grad():
        for frame in frames:
            batch = preprocess_image(frame)
            batch = batch.to(device)
            outputs = model(batch)
            probabilities = torch.softmax(outputs, dim=1)
            fake_prob = float(probabilities[0, 1].cpu().numpy())
            probability_values.append(fake_prob)

    avg_probability = float(np.mean(probability_values))
    label = "real" if avg_probability < 0.5 else "fake"

    return {
        "file_path": file_path,
        "media_type": "video",
        "model_type": "resnet18",
        "mode": "pytorch_model",
        "frames_analyzed": len(frames),
        "average_probability": avg_probability,
        "label": label,
        "confidence": float(abs(avg_probability - 0.5) * 2),
    }


def detect_deepfake_resnet(file_path: str, uploaded_file: BinaryIO | None = None, device: str = "cpu"):
    """Entry point for ResNet18-based image/video deepfake detection."""
    if uploaded_file is not None:
        upload_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        temp_path = os.path.join(upload_dir, os.path.basename(file_path) or "upload_tmp.bin")

        with open(temp_path, "wb") as destination:
            destination.write(uploaded_file.read())

        file_path = temp_path

    file_ext = os.path.splitext(file_path)[1].lower()

    if file_ext in {".jpg", ".jpeg", ".png"}:
        return predict_image_from_path(file_path, device)
    if file_ext in {".mp4", ".avi", ".mov", ".webm"}:
        return predict_video_from_path(file_path, device=device)

    raise ValueError(f"Unsupported media type for file: {file_path}")

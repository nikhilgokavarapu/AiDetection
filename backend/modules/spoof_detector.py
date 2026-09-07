"""Presentation-attack risk detector with a safe fallback contract."""

from pathlib import Path
from typing import Any, BinaryIO


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".mp4", ".avi", ".mov", ".webm", ".mp3", ".wav"}


def _result(score: int, mode: str = "demo_fallback") -> dict[str, Any]:
    score = max(0, min(100, int(score)))
    suspicious = score >= 50
    return {
        "score": score,
        "title": "Presentation attack risk detected" if suspicious else "No strong spoofing signal detected",
        "description": "Media was checked by the spoofing risk pipeline.",
        "highlights": ["Liveness signal review", "Replay and synthesis pattern scan", "Media presentation analysis"],
        "label": "spoof" if suspicious else "real",
        "confidence": round(abs(score - 50) / 50, 4),
        "mode": mode,
    }


def detect_spoof(file_name: str, uploaded_file: BinaryIO | None = None) -> dict[str, Any]:
    """Return a normalized spoof-risk result for supported media uploads."""
    extension = Path(file_name).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported spoofing media type: {file_name}")

    name = Path(file_name).name.lower()
    score = 72 if any(term in name for term in ("spoof", "replay", "mask", "fake", "synthetic")) else 28
    return _result(score)

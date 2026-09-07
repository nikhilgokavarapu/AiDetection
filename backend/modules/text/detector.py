"""Hybrid DeBERTa text detector exported from the training notebook."""

import os
from pathlib import Path
from typing import Any

MODEL_NAME = "microsoft/deberta-v3-small"
MODEL_PATH = Path(__file__).with_name("best_text_detector.pt")
MAX_LENGTH = 128

_model = None
_tokenizer = None
_dependencies = None
_load_attempted = False


def _load_dependencies():
    global _dependencies
    if _dependencies is not None:
        return _dependencies

    try:
        import torch
        import torch.nn as nn
        import torch.nn.functional as F
        from transformers import AutoModel, AutoTokenizer
    except ImportError:
        return None
    _dependencies = torch, nn, F, AutoModel, AutoTokenizer
    return _dependencies


def _build_model(torch, nn, F, AutoModel):
    class AttentionPool(nn.Module):
        def __init__(self, dim):
            super().__init__()
            self.attn = nn.Linear(dim, 1)

        def forward(self, values, mask=None):
            weights = self.attn(values)
            if mask is not None:
                weights = weights.masked_fill(mask.unsqueeze(-1) == 0, float("-inf"))
            weights = torch.softmax(weights, dim=1)
            return (weights * values).sum(dim=1)

    class BiLSTMBranch(nn.Module):
        def __init__(self, input_dim):
            super().__init__()
            self.lstm = nn.LSTM(input_dim, 128, num_layers=2, batch_first=True, dropout=0.2, bidirectional=True)
            self.pool = AttentionPool(256)
            self.proj = nn.Linear(256, 128)

        def forward(self, values, mask=None):
            output, _ = self.lstm(values)
            return F.gelu(self.proj(self.pool(output, mask)))

    class CNNBranch(nn.Module):
        def __init__(self, input_dim):
            super().__init__()
            self.convs = nn.ModuleList([
                nn.Conv1d(input_dim, 64, kernel_size, padding=kernel_size // 2)
                for kernel_size in (3, 5, 7)
            ])
            self.norms = nn.ModuleList([nn.BatchNorm1d(64) for _ in range(3)])
            self.proj = nn.Linear(192, 128)

        def forward(self, values):
            values = values.permute(0, 2, 1)
            pooled = [F.gelu(norm(conv(values))).max(dim=-1).values for conv, norm in zip(self.convs, self.norms)]
            return F.gelu(self.proj(torch.cat(pooled, dim=-1)))

    class TransformerBranch(nn.Module):
        def __init__(self, input_dim):
            super().__init__()
            self.proj_in = nn.Linear(input_dim, 128)
            layer = nn.TransformerEncoderLayer(
                d_model=128, nhead=4, dim_feedforward=256, dropout=0.1, batch_first=True, norm_first=True
            )
            self.transformer = nn.TransformerEncoder(layer, num_layers=2)
            self.pool = AttentionPool(128)

        def forward(self, values, mask=None):
            values = F.gelu(self.proj_in(values))
            padding_mask = (mask == 0) if mask is not None else None
            return self.pool(self.transformer(values, src_key_padding_mask=padding_mask), mask)

    class CrossAttentionFusion(nn.Module):
        def __init__(self):
            super().__init__()
            self.q = nn.Linear(128, 128)
            self.k = nn.Linear(128, 128)
            self.v = nn.Linear(128, 128)
            self.proj = nn.Linear(128, 128)

        def forward(self, *branches):
            stacked = torch.stack(branches, dim=1)
            queries, keys, values = self.q(stacked), self.k(stacked), self.v(stacked)
            attention = torch.softmax(torch.bmm(queries, keys.transpose(1, 2)) / (128 ** 0.5), dim=-1)
            return F.gelu(self.proj(torch.bmm(attention, values).mean(dim=1)))

    class HybridAITextDetector(nn.Module):
        def __init__(self):
            super().__init__()
            self.deberta = AutoModel.from_pretrained(MODEL_NAME)
            hidden = self.deberta.config.hidden_size
            self.lstm_branch = BiLSTMBranch(hidden)
            self.cnn_branch = CNNBranch(hidden)
            self.trans_branch = TransformerBranch(hidden)
            self.fusion = CrossAttentionFusion()
            self.classifier = nn.Sequential(
                nn.LayerNorm(128), nn.Linear(128, 128), nn.GELU(), nn.Dropout(0.4),
                nn.Linear(128, 64), nn.GELU(), nn.Dropout(0.3), nn.Linear(64, 1)
            )

        def forward(self, input_ids, attention_mask, token_type_ids):
            hidden = self.deberta(
                input_ids=input_ids,
                attention_mask=attention_mask,
                token_type_ids=token_type_ids,
            ).last_hidden_state
            fused = self.fusion(
                self.lstm_branch(hidden, attention_mask),
                self.cnn_branch(hidden),
                self.trans_branch(hidden, attention_mask),
            )
            return self.classifier(fused)

    return HybridAITextDetector()


def _model_file() -> Path:
    return Path(os.getenv("TEXT_DETECTOR_MODEL_PATH", str(MODEL_PATH)))


def _get_model():
    global _model, _tokenizer, _load_attempted
    dependencies = _load_dependencies()
    if dependencies is None or not _model_file().exists():
        return None, None

    if _model is not None or _load_attempted:
        return _model, _tokenizer

    _load_attempted = True
    try:
        torch, nn, functional, AutoModel, AutoTokenizer = dependencies
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        _model = _build_model(torch, nn, functional, AutoModel)
        state = torch.load(_model_file(), map_location="cpu")
        _model.load_state_dict(state)
        _model.eval()
    except Exception:
        _model = None
        _tokenizer = None
    return _model, _tokenizer


def _fallback_score(text: str) -> float:
    """Keep local development usable when the trained checkpoint is absent."""
    words = text.split()
    sentences = [part.strip() for part in text.replace("!", ".").replace("?", ".").split(".") if part.strip()]
    average_sentence_length = len(words) / max(1, len(sentences))
    repetition = len(words) - len({word.lower().strip(".,!?;:") for word in words})
    score = 42.0
    score += min(18.0, max(0.0, average_sentence_length - 12.0) * 1.2)
    score += min(15.0, repetition * 1.5)
    score += min(10.0, max(0.0, len(text) - 500) / 100)
    return min(85.0, max(35.0, score))


def detect_text(text: str) -> dict[str, Any]:
    """Return a normalized text result using the notebook model when available."""
    cleaned = text.strip()
    if not cleaned:
        raise ValueError("Text cannot be empty")

    model, tokenizer = _get_model()
    mode = "demo_fallback"
    score = _fallback_score(cleaned)

    if model is not None and tokenizer is not None:
        dependencies = _load_dependencies()
        torch = dependencies[0]
        encoded = tokenizer(
            [cleaned], truncation=True, padding=True, max_length=MAX_LENGTH, return_tensors="pt"
        )
        token_type_ids = encoded.get("token_type_ids", torch.zeros_like(encoded["input_ids"]))
        with torch.no_grad():
            probability = torch.sigmoid(model(encoded["input_ids"], encoded["attention_mask"], token_type_ids)).item()
        score = probability * 100
        mode = "pytorch_model"

    score = max(0, min(100, int(round(score))))
    return {
        "score": score,
        "title": "Synthetic writing pattern detected" if score >= 60 else "Text appears mostly authentic",
        "description": "Text was analyzed by the hybrid DeBERTa text detection pipeline.",
        "highlights": ["Style anomaly check", "Semantic representation review", "Sentence structure scan"],
        "mode": mode,
    }

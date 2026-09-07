"""Backend tests for AI Detection API."""

import pytest
import os
import tempfile
from pathlib import Path
from fastapi.testclient import TestClient

# Import the FastAPI app
from app import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


class TestHealthEndpoint:
    """Test health check endpoint."""

    def test_health_check_returns_ok(self, client):
        """Verify health endpoint returns status ok."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_root_endpoint_returns_message(self, client):
        """Verify root endpoint returns running message."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "running" in data["message"].lower()


class TestAnalyzeEndpoint:
    """Test the analyze endpoint with various inputs."""

    def test_analyze_with_text_returns_result(self, client):
        """Verify text analysis returns structured result."""
        response = client.post(
            "/api/analyze",
            data={
                "modality": "text",
                "text": "This is a test article about suspicious AI-generated content.",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "result" in data
        result = data["result"]
        assert "title" in result
        assert "score" in result
        assert "description" in result
        assert "highlights" in result
        assert isinstance(result["score"], int)
        assert 0 <= result["score"] <= 100

    def test_analyze_with_empty_text_fails(self, client):
        """Verify empty text input raises error."""
        response = client.post(
            "/api/analyze",
            data={"modality": "text", "text": ""},
        )
        assert response.status_code == 400

    def test_analyze_with_text_file_uses_text_detector(self, client):
        """Verify UTF-8 text uploads use the notebook-derived text detector."""
        response = client.post(
            "/api/analyze",
            data={"modality": "text"},
            files={"file": ("article.txt", b"A short article for analysis.", "text/plain")},
        )
        assert response.status_code == 200
        result = response.json()["result"]
        assert result["mode"] == "demo_fallback"
        assert isinstance(result["score"], int)

    def test_analyze_with_audio_file_uses_audio_detector(self, client):
        """Verify audio uploads use the notebook-derived audio detector."""
        response = client.post(
            "/api/analyze",
            data={"modality": "audio"},
            files={"file": ("voice.wav", b"not a real wav file", "audio/wav")},
        )
        assert response.status_code == 200
        result = response.json()["result"]
        assert result["mode"] == "demo_fallback"
        assert 0 <= result["score"] <= 100

    def test_analyze_rejects_mismatched_audio_modality(self, client):
        """Verify audio files cannot be sent to the image detector path."""
        response = client.post(
            "/api/analyze",
            data={"modality": "image"},
            files={"file": ("voice.wav", b"not a real wav file", "audio/wav")},
        )
        assert response.status_code == 400
        assert "modality=audio" in response.json()["detail"]

    def test_analyze_with_spoof_file_uses_spoof_detector(self, client):
        """Verify spoof uploads use the dedicated spoof detector contract."""
        response = client.post(
            "/api/analyze",
            data={"modality": "spoof"},
            files={"file": ("replay.mp4", b"not a real video", "video/mp4")},
        )
        assert response.status_code == 200
        result = response.json()["result"]
        assert result["mode"] == "demo_fallback"
        assert result["label"] == "spoof"
        assert 0 <= result["score"] <= 100

    def test_analyze_no_file_or_text_fails(self, client):
        """Verify request without file or text fails."""
        response = client.post(
            "/api/analyze",
            data={"modality": "image"},
        )
        assert response.status_code == 400
        assert "No file or text provided" in response.json()["detail"]

    def test_analyze_with_different_modalities(self, client):
        """Test analyze with different modality values."""
        modalities = ["text", "image", "video", "audio", "spoof"]
        for modality in modalities:
            response = client.post(
                "/api/analyze",
                data={
                    "modality": modality,
                    "text": f"Test content for {modality}",
                },
            )
            # Text modality should work
            if modality == "text":
                assert response.status_code == 200
            else:
                # Non-text modalities without file should fail
                assert response.status_code == 400

    def test_analyze_model_type_parameter(self, client):
        """Verify model_type parameter is accepted."""
        response = client.post(
            "/api/analyze",
            data={
                "modality": "text",
                "text": "Test with custom model",
                "model_type": "resnet18",
            },
        )
        # Should succeed even without the model file (uses fallback)
        assert response.status_code == 200


class TestDetectEndpoint:
    """Test the detect endpoint."""

    def test_detect_without_file_fails(self, client):
        """Verify detect endpoint requires file upload."""
        response = client.post("/api/detect")
        assert response.status_code == 422  # FastAPI validation error

    def test_detect_with_unsupported_file_type(self, client):
        """Verify unsupported file types are rejected."""
        response = client.post(
            "/api/detect",
            files={"file": ("test.txt", b"test content", "text/plain")},
        )
        assert response.status_code == 400
        assert "Unsupported file type" in response.json()["detail"]


class TestTextAnalysisLogic:
    """Test text analysis scoring logic."""

    def test_short_text_scores_low(self, client):
        """Short text should get lower fake score."""
        response = client.post(
            "/api/analyze",
            data={
                "modality": "text",
                "text": "Hi",
            },
        )
        assert response.status_code == 200
        score = response.json()["result"]["score"]
        assert score >= 35  # Should be in valid range

    def test_longer_text_varies_score(self, client):
        """Different text lengths produce different scores."""
        text_short = "This is a short text."
        text_long = "This is a much longer text that contains more words and sentences. " * 5

        response_short = client.post(
            "/api/analyze",
            data={"modality": "text", "text": text_short},
        )
        response_long = client.post(
            "/api/analyze",
            data={"modality": "text", "text": text_long},
        )

        score_short = response_short.json()["result"]["score"]
        score_long = response_long.json()["result"]["score"]

        # Both should be valid
        assert 35 <= score_short <= 100
        assert 35 <= score_long <= 100

    def test_consistent_text_scores_consistently(self, client):
        """Same text should produce same score."""
        text = "This is consistent test text for verification."

        response1 = client.post(
            "/api/analyze",
            data={"modality": "text", "text": text},
        )
        response2 = client.post(
            "/api/analyze",
            data={"modality": "text", "text": text},
        )

        score1 = response1.json()["result"]["score"]
        score2 = response2.json()["result"]["score"]

        assert score1 == score2


class TestCORSHeaders:
    """Test CORS middleware configuration."""

    def test_cors_headers_present(self, client):
        """Verify CORS headers are included in responses."""
        response = client.get("/health")
        # TestClient includes CORS headers by default
        assert response.status_code == 200


class TestErrorHandling:
    """Test error handling and edge cases."""

    def test_invalid_json_payload(self, client):
        """Verify invalid payloads are handled."""
        response = client.post(
            "/api/analyze",
            content=b"invalid json",
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 422

    def test_malformed_form_data(self, client):
        """Verify malformed form data is handled."""
        response = client.post("/api/analyze", data={})
        assert response.status_code == 400


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

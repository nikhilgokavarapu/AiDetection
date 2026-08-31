"""Tests for detector modules."""

import pytest
import os
import tempfile
import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None

from modules.image_video.detector import (
    fallback_prediction,
    preprocess_image,
    detect_deepfake,
)


@pytest.fixture
def sample_image():
    """Create a sample image for testing."""
    if cv2 is None:
        pytest.skip("OpenCV not available")
    
    # Create a dummy RGB image (100x100)
    img = np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)
    return img


@pytest.fixture
def temp_image_file(sample_image):
    """Create a temporary image file."""
    if cv2 is None:
        pytest.skip("OpenCV not available")
    
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        temp_path = f.name
    
    cv2.imwrite(temp_path, sample_image)
    yield temp_path
    
    # Cleanup
    if os.path.exists(temp_path):
        os.remove(temp_path)


class TestFallbackPrediction:
    """Test fallback prediction when model is not available."""

    def test_fallback_image_prediction(self):
        """Verify fallback returns valid prediction for images."""
        result = fallback_prediction("test_image.jpg", "image")
        
        assert "file_path" in result
        assert result["file_path"] == "test_image.jpg"
        assert result["media_type"] == "image"
        assert result["mode"] == "demo_fallback"
        assert "result" in result
        
        prediction = result["result"]
        assert "label" in prediction
        assert prediction["label"] in ["real", "fake"]
        assert "probability" in prediction
        assert 0 <= prediction["probability"] <= 1
        assert "confidence" in prediction
        assert 0 <= prediction["confidence"] <= 1

    def test_fallback_video_prediction(self):
        """Verify fallback returns valid prediction for videos."""
        result = fallback_prediction("test_video.mp4", "video")
        
        assert result["media_type"] == "video"
        assert "result" in result
        assert result["result"]["label"] in ["real", "fake"]

    def test_fallback_filename_hints_fake(self):
        """Verify fallback uses filename hints for classification."""
        # Filename with 'fake' should score higher
        result_fake = fallback_prediction("fake_video.mp4", "video")
        result_real = fallback_prediction("real_video.mp4", "video")
        
        prob_fake = result_fake["result"]["probability"]
        prob_real = result_real["result"]["probability"]
        
        # Fake filename should have higher probability
        assert prob_fake > prob_real


class TestImagePreprocessing:
    """Test image preprocessing for model input."""

    def test_preprocess_image_returns_array(self, sample_image):
        """Verify preprocessing returns numpy array."""
        result = preprocess_image(sample_image)
        
        assert isinstance(result, np.ndarray)
        # Should be batch of 1, 3 channels, 299x299
        assert result.shape == (1, 3, 299, 299)

    def test_preprocess_image_normalized(self, sample_image):
        """Verify preprocessing normalizes pixel values."""
        result = preprocess_image(sample_image)
        
        # Values should be normalized to roughly [-1, 1] range
        assert result.min() >= -2
        assert result.max() <= 2


class TestDetectDeepfake:
    """Test the main detection entry point."""

    def test_detect_unsupported_extension_fails(self, temp_image_file):
        """Verify unsupported file types raise error."""
        with pytest.raises(ValueError, match="Unsupported media type"):
            detect_deepfake("test.txt")

    def test_detect_with_valid_image_path(self, temp_image_file):
        """Verify detection works with valid image path."""
        result = detect_deepfake(temp_image_file)
        
        assert "file_path" in result
        assert "media_type" in result
        assert result["media_type"] in ["image", "video"]
        assert "result" in result

    def test_detect_nonexistent_file_fails(self):
        """Verify detection fails for non-existent files."""
        with pytest.raises(Exception):
            detect_deepfake("/nonexistent/path/image.jpg")

    def test_detect_with_model_type_parameter(self, temp_image_file):
        """Verify model_type parameter is accepted."""
        # Should not raise even if model file doesn't exist
        result = detect_deepfake(temp_image_file, model_type="resnet18")
        
        assert "result" in result


class TestDetectorIntegration:
    """Integration tests for detector modules."""

    def test_xception_fallback_mode(self):
        """Verify Xception detector falls back gracefully."""
        result = detect_deepfake("test_image.jpg", model_type="xception")
        
        assert "result" in result
        assert result["mode"] == "demo_fallback"

    def test_resnet18_fallback_mode(self):
        """Verify ResNet18 detector falls back gracefully."""
        result = detect_deepfake("test_image.jpg", model_type="resnet18")
        
        assert "result" in result
        assert result["mode"] == "demo_fallback"

    def test_model_type_validation(self, temp_image_file):
        """Verify invalid model_type defaults to xception."""
        result = detect_deepfake(temp_image_file, model_type="invalid_model")
        
        # Should not raise, should default to xception
        assert "result" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

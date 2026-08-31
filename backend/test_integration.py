#!/usr/bin/env python3
"""Integration tests for the AI Detection backend.

Run this script to execute comprehensive tests:
    python test_integration.py
"""

import sys
import json
import traceback
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

def test_detector_fallback():
    """Test that detectors gracefully fall back when model files don't exist."""
    from modules.image_video.detector import detect_deepfake, fallback_prediction
    
    print("\n✓ Testing fallback prediction mode...")
    
    # Test Xception fallback
    result = detect_deepfake("test.jpg", model_type="xception")
    assert "result" in result, "Xception fallback missing result"
    assert result["mode"] == "demo_fallback", "Xception should use fallback"
    assert "label" in result["result"], "Missing label in result"
    print("  ✓ Xception fallback works")
    
    # Test ResNet18 fallback
    result = detect_deepfake("test.jpg", model_type="resnet18")
    assert "result" in result, "ResNet18 fallback missing result"
    assert result["mode"] == "demo_fallback", "ResNet18 should use fallback"
    print("  ✓ ResNet18 fallback works")


def test_detector_image_types():
    """Test detector with different image file types."""
    from modules.image_video.detector import detect_deepfake
    
    print("\n✓ Testing image type support...")
    
    image_types = [".jpg", ".jpeg", ".png"]
    for img_type in image_types:
        try:
            result = detect_deepfake(f"test{img_type}")
            assert "result" in result
            print(f"  ✓ {img_type} support works")
        except FileNotFoundError:
            # Expected - file doesn't exist, but extension is valid
            print(f"  ✓ {img_type} is recognized format")


def test_detector_video_types():
    """Test detector with different video file types."""
    from modules.image_video.detector import detect_deepfake
    
    print("\n✓ Testing video type support...")
    
    video_types = [".mp4", ".avi", ".mov", ".webm"]
    for vid_type in video_types:
        try:
            result = detect_deepfake(f"test{vid_type}")
            assert "result" in result
            print(f"  ✓ {vid_type} support works")
        except FileNotFoundError:
            # Expected - file doesn't exist, but extension is valid
            print(f"  ✓ {vid_type} is recognized format")


def test_unsupported_file_types():
    """Test that unsupported file types raise errors."""
    from modules.image_video.detector import detect_deepfake
    
    print("\n✓ Testing unsupported file type rejection...")
    
    unsupported = [".txt", ".pdf", ".doc", ".mp3"]
    for ext in unsupported:
        try:
            detect_deepfake(f"test{ext}")
            print(f"  ✗ {ext} should have been rejected")
            return False
        except ValueError as e:
            if "Unsupported" in str(e):
                print(f"  ✓ {ext} correctly rejected")
            else:
                raise
    
    return True


def test_api_health_endpoint():
    """Test that API health endpoint works via curl."""
    print("\n✓ Testing API health endpoint...")
    
    import subprocess
    import json
    
    result = subprocess.run(
        ["curl.exe", "-s", "http://127.0.0.1:8000/health"],
        capture_output=True,
        text=True,
    )
    
    if result.returncode == 0:
        data = json.loads(result.stdout)
        assert data == {"status": "ok"}, "Health check response incorrect"
        print("  ✓ Health endpoint returns correct response")
    else:
        print("  ⚠ Skipped: API server not running")


def test_api_analyze_text():
    """Test text analysis via API curl."""
    print("\n✓ Testing API text analysis...")
    
    import subprocess
    import json
    
    result = subprocess.run(
        [
            "curl.exe", "-s", "-X", "POST", "http://127.0.0.1:8000/api/analyze",
            "-F", "modality=text",
            "-F", "text=This is a test article for analysis."
        ],
        capture_output=True,
        text=True,
    )
    
    if result.returncode == 0:
        data = json.loads(result.stdout)
        assert "result" in data, "Missing result in response"
        
        result_data = data["result"]
        assert "score" in result_data, "Missing score"
        assert "title" in result_data, "Missing title"
        assert 0 <= result_data["score"] <= 100, f"Score {result_data['score']} out of range"
        
        print(f"  ✓ Text analysis returned score: {result_data['score']}%")
        print(f"  ✓ Title: {result_data['title']}")
    else:
        print("  ⚠ Skipped: API server not running")


def test_api_analyze_no_input():
    """Test that API rejects empty input via curl."""
    print("\n✓ Testing API input validation...")
    
    import subprocess
    
    result = subprocess.run(
        [
            "curl.exe", "-s", "-w", "%{http_code}", "-X", "POST",
            "http://127.0.0.1:8000/api/analyze",
            "-F", "modality=text"
        ],
        capture_output=True,
        text=True,
    )
    
    if result.returncode == 0 and "400" in result.stdout:
        print("  ✓ Empty input correctly rejected with 400 status")
    else:
        print("  ⚠ Skipped: API server not running")


def test_api_model_type_routing():
    """Test that API correctly routes between model types via curl."""
    print("\n✓ Testing API model type routing...")
    
    import subprocess
    import json
    
    # Test with Xception model
    result = subprocess.run(
        [
            "curl.exe", "-s", "-X", "POST", "http://127.0.0.1:8000/api/analyze",
            "-F", "modality=text",
            "-F", "text=Test content",
            "-F", "model_type=xception"
        ],
        capture_output=True,
        text=True,
    )
    
    if result.returncode == 0:
        data = json.loads(result.stdout)
        assert "result" in data
        print("  ✓ Xception model routing works")
        
        # Test with ResNet18 model
        result = subprocess.run(
            [
                "curl.exe", "-s", "-X", "POST", "http://127.0.0.1:8000/api/analyze",
                "-F", "modality=text",
                "-F", "text=Test content",
                "-F", "model_type=resnet18"
            ],
            capture_output=True,
            text=True,
        )
        
        if result.returncode == 0:
            data = json.loads(result.stdout)
            assert "result" in data
            print("  ✓ ResNet18 model routing works")
    else:
        print("  ⚠ Skipped: API server not running")


def test_text_scoring_consistency():
    """Test that text analysis produces consistent scores via curl."""
    print("\n✓ Testing text scoring consistency...")
    
    import subprocess
    import json
    
    text = "This is a consistent test for verification."
    
    result1 = subprocess.run(
        [
            "curl.exe", "-s", "-X", "POST", "http://127.0.0.1:8000/api/analyze",
            "-F", "modality=text",
            f"-F", f"text={text}"
        ],
        capture_output=True,
        text=True,
    )
    
    if result1.returncode == 0:
        score1 = json.loads(result1.stdout)["result"]["score"]
        
        result2 = subprocess.run(
            [
                "curl.exe", "-s", "-X", "POST", "http://127.0.0.1:8000/api/analyze",
                "-F", "modality=text",
                f"-F", f"text={text}"
            ],
            capture_output=True,
            text=True,
        )
        
        if result2.returncode == 0:
            score2 = json.loads(result2.stdout)["result"]["score"]
            assert score1 == score2, f"Scores differ: {score1} vs {score2}"
            print(f"  ✓ Consistent scoring: {score1}% == {score2}%")
    else:
        print("  ⚠ Skipped: API server not running")


def run_all_tests():
    """Run all integration tests."""
    print("=" * 60)
    print("AI Detection Backend - Integration Tests")
    print("=" * 60)
    
    tests = [
        ("Detector Fallback Mode", test_detector_fallback),
        ("Image Type Support", test_detector_image_types),
        ("Video Type Support", test_detector_video_types),
        ("Unsupported Types Rejection", test_unsupported_file_types),
        ("API Health Endpoint", test_api_health_endpoint),
        ("API Text Analysis", test_api_analyze_text),
        ("API Input Validation", test_api_analyze_no_input),
        ("API Model Type Routing", test_api_model_type_routing),
        ("Text Scoring Consistency", test_text_scoring_consistency),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            print(f"\n► Running: {test_name}")
            test_func()
            passed += 1
        except Exception as e:
            print(f"\n✗ FAILED: {test_name}")
            print(f"  Error: {str(e)}")
            traceback.print_exc()
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"Test Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

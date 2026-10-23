from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import tempfile
from pathlib import Path

from modules.image_video.detector import detect_deepfake
from modules.document.detector import detect_document_forgery
from modules.text.detector import detect_text
from modules.audio.detector import detect_audio
from modules.spoof_detector import detect_spoof

app = FastAPI(title="AI Detection API", version="1.0.0")

default_cors_origins = "http://localhost:5173,http://127.0.0.1:5173"
allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", default_cors_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AI Detection backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/detect")
async def detect_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    allowed_extensions = {".jpg", ".jpeg", ".png", ".mp4", ".avi", ".mov", ".webm"}
    file_ext = "." + file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""

    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    try:
        result = detect_deepfake(file.filename, uploaded_file=file.file)
        return JSONResponse(content=result)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(exc)}") from exc


@app.post("/api/analyze")
async def analyze_content(
    request: Request,
    modality: str = Form("image"),
    file: UploadFile | None = File(default=None),
    text: str | None = Form(default=None),
    model_type: str = Form(default="xception"),
):
    if request.headers.get("content-type", "").split(";", 1)[0] == "application/json":
        raise HTTPException(status_code=422, detail="Expected multipart form data")

    file_name = file.filename if file else ""

    if file is not None:
        allowed = {".jpg", ".jpeg", ".png", ".mp4", ".avi", ".mov", ".webm", ".txt", ".mp3", ".wav"}
        ext = "." + file_name.lower().rsplit(".", 1)[-1] if "." in file_name else ""
        if ext not in allowed:
            raise HTTPException(status_code=400, detail="Unsupported file type for analysis")

        if modality == "text" and ext == ".txt":
            try:
                uploaded_text = (await file.read()).decode("utf-8")
                return {"result": detect_text(uploaded_text)}
            except UnicodeDecodeError as exc:
                raise HTTPException(status_code=400, detail="Text file must be UTF-8 encoded") from exc
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from exc

        if modality == "audio" and ext in {".mp3", ".wav"}:
            return {"result": detect_audio(file_name, uploaded_file=file.file)}

        if modality == "spoof":
            return {"result": detect_spoof(file_name, uploaded_file=file.file)}

        if ext == ".txt":
            raise HTTPException(status_code=400, detail="Text files require modality=text")
        if ext in {".mp3", ".wav"}:
            raise HTTPException(status_code=400, detail="Audio files require modality=audio")

        result = detect_deepfake(file_name, uploaded_file=file.file, model_type=model_type)
        prediction = result.get("result")
        prediction = prediction if isinstance(prediction, dict) else {}
        probability = result.get("average_probability")
        if probability is None:
            probability = prediction.get("probability", 0.5)
        label = result.get("label") or prediction.get("label")
        return {
            "result": {
                "title": "Deepfake risk detected" if label == "fake" else "Content appears authentic",
                "score": int(round(float(probability) * 100)),
                "description": "The uploaded media was analyzed using the project detector pipeline.",
                "highlights": ["Model pipeline active", "Frame-level signal review", "Media authenticity assessment"],
                "mode": result.get("mode", "unknown"),
                "confidence": result.get("confidence", prediction.get("confidence")),
            }
        }

    if modality == "text" and text and text.strip():
        return {"result": detect_text(text)}

    raise HTTPException(status_code=400, detail="No file or text provided for analysis")


@app.post("/api/detect-document")
async def detect_document(
    file: UploadFile = File(...),
    model_type: str = Form(default="hybrid"),
):
    """Detect forged/tampered documents using hybrid visual-text analysis."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    allowed_extensions = {".jpg", ".jpeg", ".png", ".pdf", ".tiff", ".tif"}
    file_ext = "." + file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""

    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported document format")

    tmp_path = None
    try:
        # Save uploaded file to temp location
        with tempfile.NamedTemporaryFile(suffix=file_ext, delete=False) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Run detection
        result = detect_document_forgery(tmp_path, model_type=model_type)
        return {"result": result.get("result", {}), "mode": result.get("mode", "model")}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Document analysis failed: {str(exc)}") from exc
    finally:
        if tmp_path:
            Path(tmp_path).unlink(missing_ok=True)


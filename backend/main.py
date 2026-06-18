from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import uvicorn
from processor import signature_processor
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Biometric Glide Signature Audit Engine")

# Enable CORS for the React frontend (running on :8089)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In a bank environment, we would restrict this to local IP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VerificationRequest(BaseModel):
    cheque_image: str   # Base64
    mandate_image: str  # Base64
    roi: Optional[dict] = None # {x, y, w, h} in percentages

class VerificationResponse(BaseModel):
    score: float
    is_match: bool
    status: str
    message: Optional[str] = None

@app.get("/health")
async def health():
    return {"status": "operational", "engine": "OpenCV-Structural"}

@app.post("/verify", response_model=VerificationResponse)
async def verify_signatures(request: VerificationRequest):
    """
    Analyzes two signatures and returns similarity metrics.
    """
    if not request.cheque_image or not request.mandate_image:
        raise HTTPException(status_code=400, detail="Missing image data")
        
    result = signature_processor.calculate_similarity(
        request.cheque_image, 
        request.mandate_image,
        request.roi
    )
    
    return result

if __name__ == "__main__":
    # Migrated to 8130 for bank environment consistency
    uvicorn.run(app, host="127.0.0.1", port=8130)

import os
import base64
import requests
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
from fastapi.staticfiles import StaticFiles


model = tf.keras.models.load_model("model/atarvani_command_model.h5")
encoder = joblib.load("model/label_encoder.pkl")
latest_output = {"sentence": "", "prediction": None, "confidence": 0, "wave": []}
last_spoken_sentence = ""
AUDIO_DIR = "static/audio"
if not os.path.exists(AUDIO_DIR):
    os.makedirs(AUDIO_DIR)        
    print(f"📁 Created folder: {AUDIO_DIR}")

AUDIO_FILE = f"{AUDIO_DIR}/tts_output.mp3"
MURF_API_KEY = os.getenv("MURF_API_KEY")
MURF_URL = "https://api.murf.ai/v1/speech/generate"
MURF_VOICE = "en-US-natalie"
MURF_STYLE = "Conversational"
def speak_with_murf(text: str):
    if not MURF_API_KEY:
        print("❌ Murf API key missing!")
        return None

    print(f"\n🔊 Speaking new sentence: {text}")

    payload = {
        "voice_id": MURF_VOICE,
        "style": MURF_STYLE,
        "text": text,
        "format": "mp3",
        "sample_rate": 44100,
        "encoding": "base64"
    }

    headers = {
        "api-key": MURF_API_KEY,
        "Content-Type": "application/json",
    }

    response = requests.post(MURF_URL, json=payload, headers=headers)

    print("MURF STATUS:", response.status_code)
    print("RAW:", response.text[:200])

    if response.status_code != 200:
        print("❌ ERROR:", response.text)
        return None

    resp = response.json()
    if "audioFile" in resp:
        print("🔗 Using audioFile URL...")
        audio_raw = requests.get(resp["audioFile"]).content
        with open(AUDIO_FILE, "wb") as f:
            f.write(audio_raw)
        return AUDIO_FILE
    if "audio" in resp:
        print("🎵 Using base64 audio...")
        mp3_bytes = base64.b64decode(resp["audio"])
        with open(AUDIO_FILE, "wb") as f:
            f.write(mp3_bytes)
        return AUDIO_FILE

    return None
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="static"), name="static")
class PredictRequest(BaseModel):
    features: list
    wave: list
@app.post("/predict")
async def predict(data: PredictRequest):
    global latest_output, last_spoken_sentence

    features = np.array(data.features).reshape(1, -1)
    preds = model.predict(features)
    confidence = float(np.max(preds))
    idx = int(np.argmax(preds))

    sentence = encoder.inverse_transform([idx])[0]

    latest_output = {
        "sentence": sentence,
        "prediction": idx,
        "confidence": confidence,
        "wave": data.wave
    }
    if sentence != last_spoken_sentence:
        speak_with_murf(sentence)
        last_spoken_sentence = sentence

    return latest_output
@app.get("/latest")
async def get_latest():
    return latest_output
@app.get("/audio")
async def audio():
    if not os.path.exists(AUDIO_FILE):
        raise HTTPException(404, "Audio not generated yet")

    return {
        "url": "http://localhost:8000/static/audio/tts_output.mp3"
    }

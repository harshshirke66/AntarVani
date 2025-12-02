import time
import requests
import numpy as np
from scipy import signal as sg

SERVER_URL = "http://127.0.0.1:8000/predict"

EEG_MODES = {
    "WATER": 10,
    "HELP": 12,
    "PAIN": 8,
    "STOP": 15,
    "FAMILY": 5,
    "EMERGENCY": 18,
    "YES": 22,
    "NO": 4,
    "HUNGER": 7,
    "THIRST": 9
}

EEG_UPDATE_INTERVAL = 5         
PREDICTION_CHANGE_INTERVAL = 10   

def generate_eeg(freq):
    t = np.linspace(0, 2, 256)
    base = np.sin(2 * np.pi * freq * t)
    noise = np.random.normal(0, 0.3, 256)
    return (base * np.random.uniform(0.7, 1.3) + noise).reshape(256, 1)

def extract_features(sig):
    x = sig[:, 0]
    blink = float(np.max(np.abs(np.diff(x))))
    freqs, psd = sg.welch(x, fs=128, nperseg=128)
    alpha = np.mean(psd[(freqs >= 8) & (freqs <= 12)]) if np.any((freqs >= 8) & (freqs <= 12)) else 0
    beta  = np.mean(psd[(freqs >= 12) & (freqs <= 30)]) if np.any((freqs >= 12) & (freqs <= 30)) else 0
    theta = np.mean(psd[(freqs >= 4) & (freqs <= 7)]) if np.any((freqs >= 4) & (freqs <= 7)) else 0
    attention = beta / (alpha + 1e-9)
    meditation = alpha / (theta + 1e-9)
    return [attention, meditation, blink]

def main():
    print("Simulation (45s mode) started.")
    keys = list(EEG_MODES.keys())
    pointer = 0
    last_change = time.time()

    while True:
        if time.time() - last_change >= PREDICTION_CHANGE_INTERVAL:
            pointer += 1
            last_change = time.time()

        mode = keys[pointer % len(keys)]
        freq = EEG_MODES[mode]
        print(f"Current Mode: {mode}")

        eeg = generate_eeg(freq)
        features = extract_features(eeg)

        payload = {"features": features, "wave": eeg[:, 0].tolist()}

        try:
            res = requests.post(SERVER_URL, json=payload, timeout=3.0)
            print("POST →", res.status_code)
        except Exception as e:
            print("POST error:", e)

        time.sleep(EEG_UPDATE_INTERVAL)

if __name__ == "__main__":
    main()

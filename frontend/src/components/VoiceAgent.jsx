import React, { useState } from "react";
import axios from "axios";

export default function VoiceAgent() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");

  let mediaRecorder;
  let audioChunks = [];

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.start();
    setRecording(true);

    mediaRecorder.ondataavailable = (e) => {
      audioChunks.push(e.data);
    };

    // Stop after 5 seconds
    setTimeout(() => stopRecording(mediaRecorder), 5000);
  }

  async function stopRecording(rec) {
    rec.stop();
    setRecording(false);

    rec.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      audioChunks = [];

      const formData = new FormData();
      formData.append("file", audioBlob, "voice.wav");

      const res = await axios.post("http://localhost:8000/voice-query", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // backend returns base64 mp3
      const audioBase64 = res.data.audio;
      const audioSrc = "data:audio/mp3;base64," + audioBase64;

      setAudioURL(audioSrc);
    };
  }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={startRecording} disabled={recording}>
        {recording ? "Listening…" : "🎤 Speak Now"}
      </button>

      {audioURL && (
        <div>
          <p>AI Response:</p>
          <audio src={audioURL} controls autoPlay />
        </div>
      )}
    </div>
  );
}

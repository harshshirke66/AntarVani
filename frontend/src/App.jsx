import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { AiOutlineThunderbolt } from "react-icons/ai";
import { Activity, Brain, Clock } from "lucide-react";
import PremiumWaveform from "./components/PremiumWaveform";
import "./premium.css";

export default function App() {
  const [data, setData] = useState({
    sentence: "",
    prediction: "",
    confidence: 0,
    wave: []
  });

  const [history, setHistory] = useState([]);
  const lastSentenceRef = useRef("");
  const audioRef = useRef(new Audio());
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get("http://localhost:8000/latest");
        const newData = res.data;

        setData(newData);

        if (newData.sentence) {
          setHistory((h) => [
            { text: newData.sentence, time: new Date().toLocaleTimeString() },
            ...h
          ].slice(0, 20));
        }

        if (
          newData.sentence &&
          newData.sentence !== lastSentenceRef.current
        ) {
          lastSentenceRef.current = newData.sentence;
          playAudioFromServer();
        }

      } catch (err) {
        console.error("Fetch error:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  async function playAudioFromServer() {
    try {
      const res = await axios.get("http://localhost:8000/audio");

      if (res.data.url) {
        console.log("🎧 Playing audio:", res.data.url);

        audioRef.current.src = res.data.url + "?t=" + Date.now();

        await audioRef.current.play();
      }
    } catch (err) {
      console.error("Audio play error:", err);
    }
  }

  return (
    <div className="premium-container">
      <div className="background-grid"></div>
      <div className="background-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <motion.div
        className="premium-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <AiOutlineThunderbolt className="title-icon" />
          <h1 className="premium-title">
            AntarVani
            <span className="subtitle">Neural Speech Decoder</span>
          </h1>
          <Brain className="brain-icon" />
        </div>
        <div className="status-badge">
          <div className="status-dot"></div>
          <span>Live Processing</span>
        </div>
      </motion.div>

      <div className="premium-grid">
        {/* Waveform Panel */}
        <motion.div 
          className="panel waveform-panel"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="panel-header">
            <Activity size={20} />
            <h3>EEG Waveform</h3>
          </div>
          <PremiumWaveform data={data.wave} />
          <div className="wave-info">
            <span className="wave-stat">
              <div className="stat-dot"></div>
              Sampling Rate: 256 Hz
            </span>
            <span className="wave-stat">
              <div className="stat-dot"></div>
              Channels: Active
            </span>
          </div>
        </motion.div>

        {/* Output Panel */}
        <motion.div 
          className="panel output-panel"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="panel-header">
            <Brain size={20} />
            <h3>Decoded Output</h3>
          </div>
          
          <motion.h2 
            className="output-text"
            key={data.sentence}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {data.sentence || "Waiting for EEG..."}
          </motion.h2>

          <div className="confidence-wrapper">
            <div className="confidence-header">
              <span>Neural Confidence</span>
              <span className="confidence-value">
                {(data.confidence * 100).toFixed(2)}%
              </span>
            </div>
            <div className="confidence-bar-bg">
              <motion.div
                className="confidence-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${(data.confidence || 0) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Accuracy</span>
              <span className="metric-value">{((data.confidence || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Latency</span>
              <span className="metric-value">~1s</span>
            </div>
          </div>
        </motion.div>

        {/* History Panel */}
        <motion.div 
          className="panel history-panel"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="panel-header">
            <Clock size={20} />
            <h3>Command History</h3>
            <span className="history-count">{history.length}</span>
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <div className="empty-history">
                <Clock size={32} opacity={0.3} />
                <p>No commands yet</p>
              </div>
            ) : (
              <ul>
                {history.map((h, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="history-time">{h.time}</div>
                    <div className="history-text">{h.text}</div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
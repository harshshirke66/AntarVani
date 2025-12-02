import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { AiOutlineThunderbolt } from "react-icons/ai";
import { Activity, Brain, Clock } from "lucide-react";

// PremiumWaveform Component
function PremiumWaveform({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="wave-placeholder">
        <Activity className="placeholder-icon" />
        <p>Awaiting EEG signals...</p>
        <div className="pulse-ring"></div>
      </div>
    );
  }

  const points = data.slice(0, 200);
  const width = 760;
  const height = 180;

  const pathD = points
    .map((v, i) => {
      const x = (i / points.length) * width;
      const y = height / 2 - v * 10;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg className="premium-wave" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00eaff" />
          <stop offset="50%" stopColor="#6dfcff" />
          <stop offset="100%" stopColor="#cb59ff" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <motion.path 
        d={pathD} 
        stroke="url(#waveGradient)" 
        strokeWidth="3" 
        fill="none" 
        strokeLinecap="round"
        filter="url(#glow)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
    </svg>
  );
}

// Main App Component
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Inter:wght@300;400;500;600&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          background: #020817;
          margin: 0;
          font-family: 'Inter', sans-serif;
          color: #e7eaff;
          overflow-x: hidden;
        }

        .premium-container {
          padding: 32px 48px;
          max-width: 1600px;
          margin: 0 auto;
          position: relative;
          min-height: 100vh;
        }

        .background-grid {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 234, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 234, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          z-index: 0;
          pointer-events: none;
        }

        .background-orbs {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: float 20s infinite ease-in-out;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #00eaff, transparent);
          top: -250px;
          left: -250px;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #cb59ff, transparent);
          top: 50%;
          right: -200px;
          animation-delay: 7s;
        }

        .orb-3 {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, #0077ff, transparent);
          bottom: -200px;
          left: 50%;
          animation-delay: 14s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -50px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
        }

        .premium-header {
          text-align: center;
          margin-bottom: 40px;
          position: relative;
          z-index: 1;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-bottom: 16px;
        }

        .premium-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 48px;
          font-weight: 900;
          background: linear-gradient(135deg, #00eaff, #6dfcff, #cb59ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 3px;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-shadow: 0 0 40px rgba(0, 234, 255, 0.5);
        }

        .subtitle {
          font-size: 16px;
          font-weight: 400;
          letter-spacing: 4px;
          opacity: 0.7;
          font-family: 'Inter', sans-serif;
        }

        .title-icon, .brain-icon {
          font-size: 42px;
          color: #00eaff;
          filter: drop-shadow(0 0 20px #00eaff);
          animation: pulse 2s infinite;
        }

        .brain-icon {
          color: #cb59ff;
          filter: drop-shadow(0 0 20px #cb59ff);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: rgba(0, 234, 255, 0.1);
          border: 1px solid rgba(0, 234, 255, 0.3);
          border-radius: 24px;
          font-size: 13px;
          font-weight: 500;
          backdrop-filter: blur(10px);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #00ff88;
          border-radius: 50%;
          animation: blink 1.5s infinite;
          box-shadow: 0 0 10px #00ff88;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .premium-grid {
          display: grid;
          grid-template-columns: 1.8fr 1.2fr;
          grid-template-rows: 380px 320px;
          gap: 24px;
          position: relative;
          z-index: 1;
        }

        .panel {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(0, 234, 255, 0.15);
          border-radius: 20px;
          padding: 24px;
          backdrop-filter: blur(20px);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 234, 255, 0.5), transparent);
        }

        .panel:hover {
          border-color: rgba(0, 234, 255, 0.3);
          box-shadow: 
            0 12px 40px rgba(0, 234, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          color: #00eaff;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .panel-header h3 {
          margin: 0;
          font-weight: 600;
          flex: 1;
        }

        .waveform-panel {
          grid-row: span 2;
          display: flex;
          flex-direction: column;
        }

        .premium-wave {
          width: 100%;
          flex: 1;
          margin: 10px 0;
        }

        .wave-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #64748b;
          position: relative;
        }

        .placeholder-icon {
          font-size: 48px;
          opacity: 0.3;
          margin-bottom: 12px;
        }

        .pulse-ring {
          position: absolute;
          width: 100px;
          height: 100px;
          border: 2px solid #00eaff;
          border-radius: 50%;
          opacity: 0;
          animation: pulse-ring 2s infinite;
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0; }
          50% { opacity: 0.3; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .wave-info {
          display: flex;
          gap: 24px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .wave-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #94a3b8;
        }

        .stat-dot {
          width: 6px;
          height: 6px;
          background: #00eaff;
          border-radius: 50%;
          box-shadow: 0 0 8px #00eaff;
        }

        .output-panel {
          display: flex;
          flex-direction: column;
        }

        .output-text {
          font-size: 28px;
          color: #fff;
          margin: 0 0 24px 0;
          font-weight: 600;
          line-height: 1.4;
          min-height: 80px;
          display: flex;
          align-items: center;
          padding: 16px;
          background: rgba(0, 234, 255, 0.05);
          border-radius: 12px;
          border-left: 3px solid #00eaff;
        }

        .confidence-wrapper {
          margin-bottom: 20px;
        }

        .confidence-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 13px;
          font-weight: 500;
        }

        .confidence-value {
          color: #00eaff;
          font-weight: 700;
          font-size: 15px;
        }

        .confidence-bar-bg {
          width: 100%;
          height: 12px;
          background: rgba(0, 234, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }

        .confidence-bar-fill {
          height: 12px;
          background: linear-gradient(90deg, #0077ff, #00eaff, #6dfcff);
          box-shadow: 0 0 20px rgba(0, 234, 255, 0.6);
          border-radius: 10px;
          position: relative;
        }

        .confidence-bar-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: auto;
        }

        .metric-card {
          background: rgba(0, 234, 255, 0.05);
          padding: 14px;
          border-radius: 10px;
          border: 1px solid rgba(0, 234, 255, 0.15);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-label {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #00eaff;
        }

        .history-panel {
          display: flex;
          flex-direction: column;
        }

        .history-count {
          background: rgba(0, 234, 255, 0.2);
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .history-list {
          flex: 1;
          overflow-y: auto;
          margin-top: 8px;
        }

        .history-list::-webkit-scrollbar {
          width: 6px;
        }

        .history-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 3px;
        }

        .history-list::-webkit-scrollbar-thumb {
          background: rgba(0, 234, 255, 0.3);
          border-radius: 3px;
        }

        .empty-history {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #64748b;
          gap: 12px;
        }

        .history-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .history-list li {
          padding: 14px;
          margin-bottom: 8px;
          background: rgba(0, 234, 255, 0.03);
          border-radius: 10px;
          border-left: 2px solid #00eaff;
          transition: all 0.2s;
        }

        .history-list li:hover {
          background: rgba(0, 234, 255, 0.08);
          transform: translateX(4px);
        }

        .history-time {
          color: #00eaff;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .history-text {
          color: #e2e8f0;
          font-size: 14px;
          line-height: 1.4;
        }

        @media (max-width: 1200px) {
          .premium-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
          }

          .waveform-panel {
            grid-row: span 1;
            min-height: 300px;
          }
        }
      `}</style>
    </div>
  );
}
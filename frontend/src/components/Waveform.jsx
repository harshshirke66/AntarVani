import React from "react";

function Waveform({ data }) {
  const points = data.map((v, i) => `${i},${100 - v}`).join(" ");

  return (
    <svg width="500" height="120" style={{ background: "#111" }}>
      <polyline
        points={points}
        fill="none"
        stroke="#00ffcc"
        strokeWidth="2"
      />
    </svg>
  );
}

export default Waveform;

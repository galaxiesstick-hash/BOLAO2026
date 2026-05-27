"use client";

import { useState, useEffect } from "react";

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function getCountdown(kickoff: string) {
  const diff = Math.max(0, new Date(kickoff).getTime() - Date.now());
  const totalSecs = Math.floor(diff / 1000);
  const days  = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins  = Math.floor((totalSecs % 3600) / 60);
  const secs  = totalSecs % 60;
  return { days, hours, mins, secs };
}

export default function CountdownTimer({ kickoff }: { kickoff: string }) {
  const [cd, setCd] = useState(() => getCountdown(kickoff));

  useEffect(() => {
    const id = setInterval(() => setCd(getCountdown(kickoff)), 1000);
    return () => clearInterval(id);
  }, [kickoff]);

  const blocks = [
    { v: pad(cd.days),  l: "DIAS"  },
    { v: pad(cd.hours), l: "HORAS" },
    { v: pad(cd.mins),  l: "MIN"   },
    { v: pad(cd.secs),  l: "SEG"   },
  ];

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 16, justifyContent: "center" }}>
      {blocks.map((b) => (
        <div
          key={b.l}
          style={{
            flex: 1, background: "rgba(10,22,40,0.6)", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.07)", padding: "8px 4px", textAlign: "center",
          }}
        >
          <div
            className="font-display"
            style={{ fontSize: 22, color: "#f3f6fb", lineHeight: 1, letterSpacing: 1 }}
          >
            {b.v}
          </div>
          <div
            className="font-mono font-bold"
            style={{ fontSize: 8.5, color: "rgba(231,238,250,0.38)", marginTop: 3, letterSpacing: 0.8 }}
          >
            {b.l}
          </div>
        </div>
      ))}
    </div>
  );
}

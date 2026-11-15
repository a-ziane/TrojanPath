import { useEffect, useRef, useState } from "react";
export function Celebration({ xp }: { xp: number }) {
  const previous = useRef(xp);
  const [gain, setGain] = useState(0);
  useEffect(() => {
    const delta = xp - previous.current;
    previous.current = xp;
    if (delta <= 0) return;
    setGain(delta);
    const timer = setTimeout(() => setGain(0), 1600);
    return () => clearTimeout(timer);
  }, [xp]);
  return gain > 0 ? (
    <div className="ref-celebration" role="status">
      <strong>+{gain} XP</strong>
      {Array.from({ length: 18 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${5 + i * 5}%`,
            background: ["#990000", "#ffcc00", "#2e7d4f", "#d98f57"][i % 4],
            animationDelay: `${(i % 5) * 60}ms`,
            transform: `rotate(${i * 29}deg)`,
          }}
        />
      ))}
    </div>
  ) : null;
}

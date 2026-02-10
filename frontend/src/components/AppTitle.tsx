import { useState, useEffect } from "react";

interface AppTitleProps {
  className?: string;
}

// Character positions for "LEVELING SYSTEM" (approximate x positions)
const chars = [
  { char: "L", x: 47 },
  { char: "E", x: 97 },
  { char: "V", x: 147 },
  { char: "E", x: 197 },
  { char: "L", x: 247 },
  { char: "I", x: 297 },
  { char: "N", x: 337 },
  { char: "G", x: 390 },
  { char: "S", x: 470 },
  { char: "Y", x: 520 },
  { char: "S", x: 570 },
  { char: "T", x: 620 },
  { char: "E", x: 670 },
  { char: "M", x: 725 },
];

export default function AppTitle({ className = "" }: AppTitleProps) {
  const [glitchingChar, setGlitchingChar] = useState<number | null>(null);

  useEffect(() => {
    const triggerGlitch = () => {
      // Pick a random character
      const randomIndex = Math.floor(Math.random() * chars.length);
      setGlitchingChar(randomIndex);

      // Clear glitch after animation completes (300ms)
      setTimeout(() => {
        setGlitchingChar(null);
      }, 300);
    };

    // Initial glitch after 1 second
    const initialTimeout = setTimeout(triggerGlitch, 1000);

    // Then glitch every 3 seconds
    const interval = setInterval(triggerGlitch, 3000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={`relative ${className} glitch-wrapper`}>
      {/* Base layer - original style */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 820 90"
        className="w-full h-full"
      >
        <defs>
          <filter id="blueGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b1"/>
            <feGaussianBlur stdDeviation="8" result="b2"/>
            <feMerge>
              <feMergeNode in="b2"/>
              <feMergeNode in="b1"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <text
          x="410"
          y="65"
          textAnchor="middle"
          fontFamily="Oxanium, Inter, monospace"
          fontSize="72"
          fontWeight="900"
          letterSpacing="8"
          fill="#00A3FF"
          opacity="0.9"
          filter="url(#blueGlow)"
          style={{ shapeRendering: "crispEdges" }}
        >
          LEVELING SYSTEM
        </text>

        <text
          x="408"
          y="63"
          textAnchor="middle"
          fontFamily="Oxanium, Inter, monospace"
          fontSize="72"
          fontWeight="900"
          letterSpacing="8"
          fill="#7B2CBF"
          opacity="0.35"
          style={{ shapeRendering: "crispEdges" }}
        >
          LEVELING SYSTEM
        </text>

        <text
          x="410"
          y="65"
          textAnchor="middle"
          fontFamily="Oxanium, Inter, monospace"
          fontSize="72"
          fontWeight="900"
          letterSpacing="8"
          fill="#E0E0E0"
          style={{ shapeRendering: "crispEdges" }}
        >
          LEVELING SYSTEM
        </text>
      </svg>

      {/* Glitch layers - only render for the currently glitching character */}
      {glitchingChar !== null && (
        <>
          <svg viewBox="0 0 820 90" className="glitch-char glitch-cyan">
            <text
              x={chars[glitchingChar].x}
              y="65"
              fontFamily="Oxanium, Inter, monospace"
              fontSize="72"
              fontWeight="900"
              fill="#00FFFF"
            >
              {chars[glitchingChar].char}
            </text>
          </svg>
          <svg viewBox="0 0 820 90" className="glitch-char glitch-red">
            <text
              x={chars[glitchingChar].x}
              y="65"
              fontFamily="Oxanium, Inter, monospace"
              fontSize="72"
              fontWeight="900"
              fill="#FF0040"
            >
              {chars[glitchingChar].char}
            </text>
          </svg>
        </>
      )}

      <style>{`
        .glitch-wrapper {
          position: relative;
          overflow: visible;
        }

        .glitch-char {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          mix-blend-mode: screen;
        }

        .glitch-cyan {
          animation: charGlitchCyan 0.3s ease-out forwards;
        }

        .glitch-red {
          animation: charGlitchRed 0.3s ease-out forwards;
        }

        @keyframes charGlitchCyan {
          0% { opacity: 0; transform: translate(0, 0); }
          10% { opacity: 0.9; transform: translate(-10px, 0); }
          20% { opacity: 0; transform: translate(0, 0); }
          30% { opacity: 0.8; transform: translate(-15px, 2px); }
          40% { opacity: 0; transform: translate(0, 0); }
          50% { opacity: 0.7; transform: translate(-6px, -1px); }
          60% { opacity: 0; transform: translate(0, 0); }
          70% { opacity: 0.9; transform: translate(-12px, 1px); }
          80% { opacity: 0.5; transform: translate(-8px, 0); }
          90% { opacity: 0.3; transform: translate(-4px, 0); }
          100% { opacity: 0; transform: translate(0, 0); }
        }

        @keyframes charGlitchRed {
          0% { opacity: 0; transform: translate(0, 0); }
          10% { opacity: 0.9; transform: translate(10px, 0); }
          20% { opacity: 0; transform: translate(0, 0); }
          30% { opacity: 0.8; transform: translate(15px, -2px); }
          40% { opacity: 0; transform: translate(0, 0); }
          50% { opacity: 0.7; transform: translate(6px, 1px); }
          60% { opacity: 0; transform: translate(0, 0); }
          70% { opacity: 0.9; transform: translate(12px, -1px); }
          80% { opacity: 0.5; transform: translate(8px, 0); }
          90% { opacity: 0.3; transform: translate(4px, 0); }
          100% { opacity: 0; transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
}

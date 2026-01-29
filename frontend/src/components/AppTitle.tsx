interface AppTitleProps {
  className?: string;
}

export default function AppTitle({ className = "" }: AppTitleProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 820 90"
      className={className}
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
  );
}

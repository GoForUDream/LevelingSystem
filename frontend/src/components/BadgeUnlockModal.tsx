import { useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Award } from "lucide-react";
import type { BadgeInfo } from "@/constants/achievements";

interface BadgeUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: BadgeInfo | null;
}

// Pre-generated particle positions (stable across renders)
const PARTICLE_DATA = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  left: (i * 17 + 7) % 100, // Deterministic spread
  delay: (i % 10) * 0.05,
  duration: 1 + (i % 5) * 0.4,
  size: 4 + (i % 4) * 2,
}));

// Particle component for celebration effect
function Particles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLE_DATA.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-[particleRise_var(--duration)_ease-out_var(--delay)_forwards] opacity-0"
          style={{
            left: `${p.left}%`,
            bottom: "-20px",
            width: p.size,
            height: p.size,
            background: color,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
            "--delay": `${p.delay}s`,
            "--duration": `${p.duration}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// Rays of light emanating from center
function LightRays({ color }: { color: string }) {
  const rays = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      rotation: i * 30,
    })),
  []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {rays.map((ray) => (
        <div
          key={ray.id}
          className="absolute w-1 h-32 origin-bottom animate-[rayPulse_2s_ease-in-out_infinite]"
          style={{
            background: `linear-gradient(to top, ${color}, transparent)`,
            transform: `rotate(${ray.rotation}deg) translateY(-50%)`,
            animationDelay: `${ray.id * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function BadgeUnlockModal({ isOpen, onClose, badge }: BadgeUnlockModalProps) {
  if (!badge) return null;

  // Get rank-specific accent color for effects
  const getAccentColor = () => {
    if (badge.rankName.includes("S")) return "#E63946";
    if (badge.rankName.includes("A")) return "#FF6B00";
    if (badge.rankName.includes("B")) return "#7B2CBF";
    if (badge.rankName.includes("C")) return "#00A3FF";
    if (badge.rankName.includes("D")) return "#4ADE80";
    return "#808080";
  };

  const accentColor = getAccentColor();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="bg-transparent! border-none! shadow-none! max-w-md! overflow-visible"
      >
        {/* Fullscreen dark overlay with vignette */}
        <div
          className="fixed inset-0 bg-black/90 -z-10"
          style={{
            background: `radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)`
          }}
        />

        {/* Animated background glow */}
        <div
          className="absolute inset-0 -z-5 animate-[fadeIn_1s_ease-out_forwards]"
          style={{
            background: `radial-gradient(circle at center, ${accentColor}40 0%, transparent 50%)`,
            filter: "blur(40px)",
            transform: "scale(2)",
          }}
        />

        {/* Light rays */}
        <LightRays color={accentColor} />

        {/* Particles */}
        <Particles color={accentColor} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center py-8">
          {/* Header with sparkle animation */}
          <div className="flex items-center gap-2 mb-8 animate-[slideDown_0.5s_ease-out_0.1s_both]">
            <Award size={20} className="text-yellow-400 animate-pulse" />
            <span
              className="text-sm font-bold uppercase tracking-[0.3em] animate-[shimmerText_2s_linear_infinite]"
              style={{
                background: `linear-gradient(90deg, ${accentColor}, #fff, ${accentColor})`,
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Achievement Unlocked
            </span>
            <Award size={20} className="text-yellow-400 animate-pulse" />
          </div>

          {/* Badge Container with epic entrance */}
          <div className="relative mb-8 animate-[badgeEntrance_0.7s_cubic-bezier(0.68,-0.55,0.265,1.55)_0.3s_both]">
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 -m-4 rounded-full animate-[pulseRing_2s_ease-in-out_infinite]"
              style={{
                background: `radial-gradient(circle, ${accentColor}60 0%, transparent 70%)`,
                filter: "blur(20px)",
              }}
            />

            {/* Spinning border */}
            <div
              className="absolute inset-0 -m-2 rounded-lg animate-[spinSlow_10s_linear_infinite]"
              style={{
                background: `conic-gradient(from 0deg, transparent, ${accentColor}, transparent, ${accentColor}, transparent)`,
                filter: "blur(4px)",
              }}
            />

            {/* Badge frame */}
            <div
              className={`relative p-6 bg-sl-black/80 backdrop-blur-sm border-2 ${badge.rankBorder}`}
              style={{
                boxShadow: `0 0 60px ${accentColor}40, inset 0 0 30px ${accentColor}20`,
              }}
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: accentColor }} />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: accentColor }} />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: accentColor }} />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: accentColor }} />

              {badge.image ? (
                <img
                  src={badge.image}
                  alt={badge.name}
                  className="w-52 h-52 object-contain drop-shadow-2xl animate-[floatBadge_3s_ease-in-out_infinite]"
                  style={{
                    filter: `drop-shadow(0 0 20px ${accentColor})`,
                  }}
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center">
                  <Award size={96} style={{ color: accentColor }} />
                </div>
              )}
            </div>
          </div>

          {/* Rank Tag */}
          <div className="animate-[slideUp_0.5s_ease-out_0.7s_both]">
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 mb-4 border"
              style={{
                color: accentColor,
                borderColor: accentColor,
                boxShadow: `0 0 20px ${accentColor}40`,
                textShadow: `0 0 10px ${accentColor}`,
              }}
            >
              {badge.rankName}
            </span>
          </div>

          {/* Badge Name with glow */}
          <h2
            className="text-3xl font-bold tracking-wide mb-2 animate-[slideUp_0.5s_ease-out_0.8s_both]"
            style={{
              color: accentColor,
              textShadow: `0 0 30px ${accentColor}, 0 0 60px ${accentColor}50`,
            }}
          >
            {badge.name}
          </h2>

          {/* Category */}
          <span className="text-sm font-bold uppercase tracking-wider text-sl-silver-muted mb-4 animate-[slideUp_0.5s_ease-out_0.9s_both]">
            {badge.category}
          </span>

          {/* Tagline */}
          <p className="text-base italic text-sl-silver mb-10 px-8 animate-[slideUp_0.5s_ease-out_1s_both]">
            "{badge.tagline}"
          </p>

          {/* Continue Button */}
          <div className="animate-[slideUp_0.5s_ease-out_1.1s_both]">
            <button
              onClick={onClose}
              className="group relative px-12 py-4 text-base font-bold uppercase tracking-[0.15em] overflow-hidden transition-all duration-300 hover:scale-105 active:scale-100 active:bg-transparent focus:outline-none focus:ring-0 cursor-pointer"
              style={{
                color: accentColor,
                border: `2px solid ${accentColor}`,
                background: "transparent",
                boxShadow: `0 0 30px ${accentColor}40`,
              }}
            >
              {/* Animated background on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}40 50%, ${accentColor}20 100%)`,
                }}
              />

              {/* Shimmer effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 animate-[buttonShimmer_1.5s_ease-in-out_infinite]"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${accentColor}60 50%, transparent 100%)`,
                  backgroundSize: "200% 100%",
                }}
              />

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 transition-all duration-300 group-hover:w-5 group-hover:h-5" style={{ borderColor: accentColor }} />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 transition-all duration-300 group-hover:w-5 group-hover:h-5" style={{ borderColor: accentColor }} />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 transition-all duration-300 group-hover:w-5 group-hover:h-5" style={{ borderColor: accentColor }} />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 transition-all duration-300 group-hover:w-5 group-hover:h-5" style={{ borderColor: accentColor }} />

              {/* Button text */}
              <span className="relative z-10" style={{ textShadow: `0 0 10px ${accentColor}` }}>
                Continue
              </span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

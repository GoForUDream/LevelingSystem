import { useNavigate } from "react-router-dom";
import { ChevronLeft, Lock, Trophy } from "lucide-react";
import { ranks, categoryIcons } from "@/constants/achievements";

export default function AchievementsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-sl-black">
      {/* Header */}
      <header className="shrink-0 px-8 py-4 border-b border-sl-blue/20 bg-linear-to-r from-sl-black via-sl-gray/50 to-sl-black">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sl-silver-muted hover:text-sl-blue transition-all cursor-pointer"
          >
            <ChevronLeft size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Back
            </span>
          </button>

          <div className="flex items-center gap-3">
            <Trophy size={20} className="text-sl-blue" />
            <h1 className="text-lg font-bold uppercase tracking-[0.15em] text-sl-blue text-glow-blue">
              Achievements
            </h1>
          </div>

          <div className="w-20" />
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-8 space-y-12">
        {/* Summary */}
        <div className="text-center">
          <p className="text-sl-silver-muted text-sm">
            48 badges across 6 ranks — prove your worth, Hunter.
          </p>
        </div>

        {/* Rank Sections */}
        {ranks.map((section) => (
          <section key={section.rank}>
            {/* Rank Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-linear-to-r from-transparent to-sl-gray-muted" />
              <div className="text-center">
                <h2
                  className={`text-lg font-bold uppercase tracking-[0.2em] ${section.color}`}
                >
                  {section.rank}
                </h2>
                <p className="text-[10px] uppercase tracking-wider text-sl-silver-dark mt-0.5">
                  {section.subtitle}
                </p>
              </div>
              <div className="h-px flex-1 bg-linear-to-l from-transparent to-sl-gray-muted" />
            </div>

            {/* Badge Grid */}
            <div className="flex flex-wrap gap-4">
              {section.badges.map((badge) => (
                <div
                  key={badge.name}
                  className={`led-border group relative p-5 border shrink-0 w-52 text-center ${section.borderColor} bg-linear-to-b from-sl-gray-light/50 to-sl-gray/30 hover:${section.glowColor} transition-all duration-200`}
                  style={{ "--led-color": section.ledColor } as React.CSSProperties}
                >
                  {/* Lock overlay */}
                  <div className="absolute top-4 right-4 text-sl-silver-dark/30">
                    <Lock size={14} />
                  </div>

                  {/* Badge icon */}
                  {badge.image ? (
                    <img src={badge.image} alt={badge.name} className="w-24 h-24 object-contain mb-3 mx-auto" />
                  ) : (
                    <div className="text-2xl mb-3">
                      {categoryIcons[badge.category]}
                    </div>
                  )}

                  {/* Badge name */}
                  <h3
                    className={`text-base font-bold tracking-wide ${section.color}`}
                  >
                    {badge.name}
                  </h3>

                  {/* Category tag */}
                  <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider ${section.color} border ${section.borderColor} px-2 py-0.5`}>
                    {badge.category}
                  </span>

                  {/* Requirement */}
                  <p className="text-xs text-sl-silver mt-3">
                    {badge.requirement}
                  </p>

                  {/* Tagline */}
                  <p className="text-[11px] italic text-sl-silver-muted mt-1.5">
                    "{badge.tagline}"
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Lock, Trophy } from "lucide-react";
import { ranks, categoryIcons, badgeProgress } from "@/constants/achievements";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { API_URL } from "@/lib/utils";

interface UnlockedBadge {
  badge_id: string;
  unlocked_at: string;
}

interface AchievementStats {
  total_tasks_completed: number;
  total_goals_completed: number;
  early_bird_count: number;
  night_owl_count: number;
  instant_completions: number;
  perfect_days: number;
  current_streak: number;
  longest_streak: number;
  longest_inactive_days: number;
  [key: string]: number;
}

interface AchievementsData {
  stats: AchievementStats;
  unlocked: UnlockedBadge[];
}

// Pre-computed particle positions for stable rendering
const risingParticles = [
  { left: 15, duration: 8, delay: 0.5 },
  { left: 28, duration: 11, delay: 2.1 },
  { left: 42, duration: 7, delay: 4.3 },
  { left: 55, duration: 13, delay: 1.2 },
  { left: 68, duration: 9, delay: 3.7 },
  { left: 82, duration: 10, delay: 5.5 },
  { left: 22, duration: 12, delay: 0.8 },
  { left: 35, duration: 8, delay: 2.9 },
  { left: 48, duration: 14, delay: 4.1 },
  { left: 62, duration: 9, delay: 1.6 },
  { left: 75, duration: 11, delay: 3.2 },
  { left: 88, duration: 7, delay: 5.8 },
  { left: 18, duration: 10, delay: 2.4 },
  { left: 52, duration: 8, delay: 0.3 },
  { left: 78, duration: 12, delay: 4.7 },
];

const floatingParticles = [
  { left: 12, top: 18, duration: 14, delay: 1.2 },
  { left: 35, top: 42, duration: 18, delay: 3.5 },
  { left: 58, top: 25, duration: 12, delay: 0.8 },
  { left: 78, top: 65, duration: 16, delay: 2.1 },
  { left: 22, top: 78, duration: 19, delay: 4.2 },
  { left: 45, top: 12, duration: 13, delay: 1.8 },
  { left: 68, top: 88, duration: 15, delay: 3.1 },
  { left: 88, top: 35, duration: 17, delay: 0.5 },
  { left: 8, top: 55, duration: 14, delay: 2.8 },
  { left: 52, top: 72, duration: 11, delay: 4.5 },
  { left: 32, top: 8, duration: 16, delay: 1.5 },
  { left: 72, top: 48, duration: 13, delay: 3.8 },
];

export default function AchievementsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t } = useTranslation();
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [stats, setStats] = useState<AchievementStats | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/achievements`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: AchievementsData) => {
        const ids = new Set(data.unlocked.map((b) => b.badge_id));
        setUnlockedIds(ids);
        setUnlockedCount(ids.size);
        setStats(data.stats);
      })
      .catch(() => {});
  }, [token]);

  return (
    <div className="min-h-screen bg-sl-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Hexagon grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(30deg, rgba(123, 44, 191, 0.5) 12%, transparent 12.5%, transparent 87%, rgba(123, 44, 191, 0.5) 87.5%, rgba(123, 44, 191, 0.5)),
              linear-gradient(150deg, rgba(123, 44, 191, 0.5) 12%, transparent 12.5%, transparent 87%, rgba(123, 44, 191, 0.5) 87.5%, rgba(123, 44, 191, 0.5)),
              linear-gradient(30deg, rgba(123, 44, 191, 0.5) 12%, transparent 12.5%, transparent 87%, rgba(123, 44, 191, 0.5) 87.5%, rgba(123, 44, 191, 0.5)),
              linear-gradient(150deg, rgba(123, 44, 191, 0.5) 12%, transparent 12.5%, transparent 87%, rgba(123, 44, 191, 0.5) 87.5%, rgba(123, 44, 191, 0.5)),
              linear-gradient(60deg, rgba(0, 163, 255, 0.3) 25%, transparent 25.5%, transparent 75%, rgba(0, 163, 255, 0.3) 75%, rgba(0, 163, 255, 0.3)),
              linear-gradient(60deg, rgba(0, 163, 255, 0.3) 25%, transparent 25.5%, transparent 75%, rgba(0, 163, 255, 0.3) 75%, rgba(0, 163, 255, 0.3))
            `,
            backgroundSize: '80px 140px',
            backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px',
          }}
        />

        {/* Ambient orbs - purple themed */}
        <div className="absolute top-1/4 left-1/6 w-125 h-125 bg-sl-purple/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-sl-blue/8 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-2/3 left-1/3 w-72 h-72 bg-sl-purple/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/6 right-1/6 w-64 h-64 bg-yellow-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Rising particles - like achievement sparks */}
        {risingParticles.map((p, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${p.left}%`,
              bottom: '-10px',
              background: i % 3 === 0 ? '#7B2CBF' : i % 3 === 1 ? '#00A3FF' : '#FFD700',
              animation: `riseAndFade ${p.duration}s ease-out infinite`,
              animationDelay: `${p.delay}s`,
              opacity: 0,
            }}
          />
        ))}

        {/* Floating orb particles */}
        {floatingParticles.map((p, i) => (
          <div
            key={`float-${i}`}
            className="absolute w-1.5 h-1.5 bg-sl-purple/30 rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animation: `floatParticle ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

        {/* Radial glow from center */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, rgba(123, 44, 191, 0.08) 0%, transparent 50%)',
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(13, 13, 13, 0.5) 70%, rgba(13, 13, 13, 0.9) 100%)',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 shrink-0 px-8 py-4 border-b border-sl-purple/20 bg-linear-to-r from-sl-black via-sl-gray/50 to-sl-black backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-sl-silver-muted hover:text-sl-purple transition-all cursor-pointer"
          >
            <ChevronLeft size={16} className="relative -top-px" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('common.back')}
            </span>
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-sl-purple" />
              <h1 className="text-lg font-bold uppercase tracking-[0.2em] text-sl-purple glow-purple-intense" style={{ textShadow: '0 0 10px rgba(123, 44, 191, 0.8), 0 0 20px rgba(123, 44, 191, 0.4)' }}>
                {t('achievements.title')}
              </h1>
              <Trophy size={20} className="text-sl-purple" />
            </div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-sl-silver-muted mt-0.5">
              {t('achievements.subtitle')}
            </div>
          </div>

          <div className="w-20" />
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 px-6 py-8 space-y-12">
        {/* Summary */}
        <div className="text-center">
          <p className="text-sl-silver-muted text-sm">
            {t('achievements.summary', { unlocked: unlockedCount })}
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
              {section.badges.map((badge) => {
                const isUnlocked = unlockedIds.has(badge.badgeId);
                const progress = badgeProgress[badge.badgeId];
                const current = stats ? (stats[progress?.statKey] ?? 0) : 0;
                const threshold = progress?.threshold ?? 0;
                const percent = threshold > 0 ? Math.min(100, Math.round((current / threshold) * 100)) : 0;

                return (
                  <Tooltip key={badge.badgeId}>
                    <TooltipTrigger asChild>
                      <div
                        className={`led-border group relative p-5 border shrink-0 w-52 text-center ${section.borderColor} bg-linear-to-b from-sl-gray-light/50 to-sl-gray/30 transition-all duration-200 ${
                          isUnlocked
                            ? `hover:${section.glowColor}`
                            : ""
                        }`}
                        style={{ "--led-color": section.ledColor } as React.CSSProperties}
                      >
                        {/* Lock overlay for locked badges */}
                        {!isUnlocked && (
                          <div className="absolute top-4 right-4 text-sl-silver-dark/30">
                            <Lock size={14} />
                          </div>
                        )}

                        {/* Badge icon */}
                        {badge.image ? (
                          <img
                            src={badge.image}
                            alt={badge.name}
                            className={`w-24 h-24 object-contain mb-3 mx-auto ${
                              !isUnlocked ? "grayscale opacity-40" : ""
                            }`}
                          />
                        ) : (
                          <div className={`text-2xl mb-3 ${!isUnlocked ? "grayscale opacity-40" : ""}`}>
                            {categoryIcons[badge.category]}
                          </div>
                        )}

                        {/* Badge name */}
                        <h3
                          className={`text-base font-bold tracking-wide ${
                            isUnlocked ? section.color : "text-sl-silver-dark"
                          }`}
                        >
                          {badge.name}
                        </h3>

                        {/* Category tag */}
                        <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider ${
                          isUnlocked ? section.color : "text-sl-silver-dark"
                        } border ${section.borderColor} px-2 py-0.5`}>
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
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-sl-gray! border-sl-gray-muted! text-sl-silver! p-3 max-w-50">
                      {isUnlocked ? (
                        <p className="text-xs font-bold text-sl-blue">{t('achievements.unlocked')}</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs font-medium">
                            {t('achievements.progressDetail', { current: Math.min(current, threshold), threshold, label: progress?.label })}
                          </p>
                          <div className="w-full h-1.5 bg-sl-gray-muted/50 overflow-hidden">
                            <div
                              className="h-full bg-sl-blue transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-sl-silver-muted">{t('achievements.percentComplete', { percent })}</p>
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

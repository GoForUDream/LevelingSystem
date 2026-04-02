import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { useStreak } from "@/hooks/useStreak";
import AppTitle from "@/components/AppTitle";
import { Menu, Trophy, Target, LogOut, ChevronLeft, ChevronRight, BarChart3, Crown, Swords, Shield, Flame, Star, Sparkles, Zap, Link as LinkIcon, User, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GhostButton,
  IconButton,
  PrimaryButton,
  DangerButton,
} from "@/components/ui/buttons";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface HeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  disablePrevMonth?: boolean;
}


export default function Header({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  disablePrevMonth = false,
}: HeaderProps) {
  const { user, token, logout, linkGoogleAccount, isGuest } = useAuth();
  const streak = useStreak(token, user?.total_exp);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showRanksModal, setShowRanksModal] = useState(false);

  const rankData = [
    {
      range: "1-5",
      key: "Awakened One",
      title: t('rankTitles.Awakened One'),
      theme: t('rankThemes.Just discovered their potential'),
      icon: Sparkles,
      color: "text-slate-400",
      borderColor: "border-slate-400/30",
      bgColor: "bg-slate-400/10",
      glowColor: "rgba(148, 163, 184, 0.3)",
    },
    {
      range: "6-10",
      key: "Beginner Warrior",
      title: t('rankTitles.Beginner Warrior'),
      theme: t('rankThemes.Starting the journey'),
      icon: Shield,
      color: "text-emerald-400",
      borderColor: "border-emerald-400/30",
      bgColor: "bg-emerald-400/10",
      glowColor: "rgba(52, 211, 153, 0.3)",
    },
    {
      range: "11-20",
      key: "Task Slayer",
      title: t('rankTitles.Task Slayer'),
      theme: t('rankThemes.Learning to conquer daily challenges'),
      icon: Swords,
      color: "text-sky-400",
      borderColor: "border-sky-400/30",
      bgColor: "bg-sky-400/10",
      glowColor: "rgba(56, 189, 248, 0.3)",
    },
    {
      range: "21-30",
      key: "Dungeon Crawler",
      title: t('rankTitles.Dungeon Crawler'),
      theme: t('rankThemes.Consistently tackling goals'),
      icon: Flame,
      color: "text-orange-400",
      borderColor: "border-orange-400/30",
      bgColor: "bg-orange-400/10",
      glowColor: "rgba(251, 146, 60, 0.3)",
    },
    {
      range: "31-40",
      key: "Goal Hunter",
      title: t('rankTitles.Goal Hunter'),
      theme: t('rankThemes.Actively pursuing objectives'),
      icon: Target,
      color: "text-rose-400",
      borderColor: "border-rose-400/30",
      bgColor: "bg-rose-400/10",
      glowColor: "rgba(251, 113, 133, 0.3)",
    },
    {
      range: "41-50",
      key: "Elite Achiever",
      title: t('rankTitles.Elite Achiever'),
      theme: t('rankThemes.Proven track record'),
      icon: Trophy,
      color: "text-amber-400",
      borderColor: "border-amber-400/30",
      bgColor: "bg-amber-400/10",
      glowColor: "rgba(251, 191, 36, 0.3)",
    },
    {
      range: "51-60",
      key: "S-Rank Executor",
      title: t('rankTitles.S-Rank Executor'),
      theme: t('rankThemes.High-level discipline'),
      icon: Zap,
      color: "text-sl-blue",
      borderColor: "border-sl-blue/30",
      bgColor: "bg-sl-blue/10",
      glowColor: "rgba(0, 163, 255, 0.3)",
    },
    {
      range: "61-70",
      key: "Master of Habits",
      title: t('rankTitles.Master of Habits'),
      theme: t('rankThemes.Habits are now second nature'),
      icon: Star,
      color: "text-violet-400",
      borderColor: "border-violet-400/30",
      bgColor: "bg-violet-400/10",
      glowColor: "rgba(167, 139, 250, 0.3)",
    },
    {
      range: "71-80",
      key: "Sovereign of Will",
      title: t('rankTitles.Sovereign of Will'),
      theme: t('rankThemes.Unshakeable determination'),
      icon: Shield,
      color: "text-sl-purple",
      borderColor: "border-sl-purple/30",
      bgColor: "bg-sl-purple/10",
      glowColor: "rgba(123, 44, 191, 0.3)",
    },
    {
      range: "81-90",
      key: "Ruler of Self",
      title: t('rankTitles.Ruler of Self'),
      theme: t('rankThemes.Complete self-mastery'),
      icon: Swords,
      color: "text-fuchsia-400",
      borderColor: "border-fuchsia-400/30",
      bgColor: "bg-fuchsia-400/10",
      glowColor: "rgba(232, 121, 249, 0.3)",
    },
    {
      range: "91-99",
      key: "Monarch's Equal",
      title: t("rankTitles.Monarch's Equal"),
      theme: t('rankThemes.Among the elite few'),
      icon: Crown,
      color: "text-yellow-300",
      borderColor: "border-yellow-300/30",
      bgColor: "bg-yellow-300/10",
      glowColor: "rgba(253, 224, 71, 0.4)",
    },
    {
      range: "100+",
      key: "Shadow Monarch",
      title: t('rankTitles.Shadow Monarch'),
      theme: t('rankThemes.Absolute discipline, unlimited potential'),
      icon: Crown,
      color: "text-sl-red",
      borderColor: "border-sl-red/50",
      bgColor: "bg-sl-red/10",
      glowColor: "rgba(230, 57, 70, 0.5)",
      isLegendary: true,
    },
  ];


  return (
    <header className="shrink-0 px-8 py-4 border-b border-sl-blue/20 bg-linear-to-r from-sl-black via-sl-gray/50 to-sl-black relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Scan lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 163, 255, 0.15) 2px, rgba(0, 163, 255, 0.15) 4px)',
          }}
        />

        {/* Horizontal glow line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0, 163, 255, 0.5) 20%, rgba(123, 44, 191, 0.5) 50%, rgba(0, 163, 255, 0.5) 80%, transparent 100%)',
            boxShadow: '0 0 10px rgba(0, 163, 255, 0.3), 0 0 20px rgba(0, 163, 255, 0.2)',
          }}
        />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-sl-blue/40" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-sl-blue/40" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-sl-purple/40" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-sl-purple/40" />

        {/* Ambient orbs */}
        <div className="absolute -top-20 left-1/4 w-40 h-40 bg-sl-blue/10 rounded-full blur-[60px]" />
        <div className="absolute -top-20 right-1/4 w-40 h-40 bg-sl-purple/10 rounded-full blur-[60px]" />

        {/* Floating data particles */}
        <div className="absolute top-1/2 left-[10%] w-1 h-1 bg-sl-blue/40 rounded-full animate-pulse" />
        <div className="absolute top-1/3 left-[25%] w-0.5 h-0.5 bg-sl-blue/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-2/3 right-[30%] w-1 h-1 bg-sl-purple/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/4 right-[15%] w-0.5 h-0.5 bg-sl-purple/30 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 flex items-center justify-between">
        {/* Left - Menu & User */}
        <div className="flex items-center gap-4 flex-1">
          {/* Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton className="hover:text-sl-blue focus:outline-none focus-visible:outline-none data-[state=open]:bg-transparent">
                <Menu size={20} />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="bg-sl-gray border border-sl-blue/30 shadow-[0_0_20px_rgba(0,163,255,0.2)] min-w-45"
            >
              {user && (
                <>
                  <div className="px-3 py-2 border-b border-sl-gray-muted">
                    <div className="text-xs font-bold text-sl-silver tracking-wide">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-sl-silver-muted mt-0.5">
                      Level {user.level_progress.level} •{" "}
                      {user.level_progress.rank_title}
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-sl-gray-muted" />
                </>
              )}
              <DropdownMenuItem
                onClick={() => navigate("/goals")}
                className="text-sl-silver hover:text-sl-blue hover:bg-sl-blue/5 cursor-pointer text-xs font-bold uppercase tracking-wider"
              >
                <Target size={16} />
                {t('header.goals')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/achievements")}
                className="text-sl-silver hover:text-sl-blue hover:bg-sl-blue/5 cursor-pointer text-xs font-bold uppercase tracking-wider"
              >
                <Trophy size={16} />
                {t('header.achievements')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/stats")}
                className="text-sl-silver hover:text-sl-blue hover:bg-sl-blue/5 cursor-pointer text-xs font-bold uppercase tracking-wider"
              >
                <BarChart3 size={16} />
                {t('header.stats')}
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-sl-silver hover:text-sl-blue hover:bg-sl-blue/5 cursor-pointer text-xs font-bold uppercase tracking-wider">
                <Link to="/settings">
                  <Settings size={16} />
                  {t('header.settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-sl-gray-muted" />
              {isGuest && (
                <>
                  <DropdownMenuItem
                    onClick={linkGoogleAccount}
                    className="text-amber-400 hover:text-amber-400 hover:bg-amber-400/5 cursor-pointer text-xs font-bold uppercase tracking-wider"
                  >
                    <LinkIcon size={16} />
                    {t('header.linkGoogle')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-sl-gray-muted" />
                </>
              )}
              <DropdownMenuItem
                onClick={() => setShowLogoutModal(true)}
                className="text-sl-red hover:text-sl-red hover:bg-sl-red/5 cursor-pointer text-xs font-bold uppercase tracking-wider"
              >
                <LogOut size={16} />
                {t('header.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Info */}
          {user && (
            <>
              {/* Avatar */}
              <div className="relative group">
                {/* Animated ring */}
                <div className="absolute -inset-1 bg-linear-to-r from-sl-blue via-sl-purple to-sl-blue rounded-sm opacity-50 blur-sm group-hover:opacity-75 transition-opacity animate-pulse" />
                <div className="relative">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 border-2 border-sl-blue glow-blue relative z-10"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-sl-gray-light border-2 border-sl-blue flex items-center justify-center relative z-10">
                      <User size={20} className="text-sl-silver" />
                    </div>
                  )}
                </div>
                {/* Level badge */}
                <div className="absolute -bottom-1 -right-1 bg-sl-blue text-sl-black text-[10px] font-bold px-1.5 py-0.5 min-w-5 text-center z-20 shadow-[0_0_10px_rgba(0,163,255,0.5)]">
                  {user.level_progress.level}
                </div>
              </div>

              {/* Name & Level */}
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-sl-silver tracking-wide">
                    {user.name}
                  </span>
                  <button
                    onClick={() => setShowRanksModal(true)}
                    className="text-[10px] font-bold uppercase tracking-wider text-sl-red border border-sl-red/30 px-2 py-0.5 cursor-pointer hover:bg-sl-red/10 transition-colors"
                  >
                    {t(`rankTitles.${user.level_progress.rank_title}`)}
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-bold tracking-wider text-sl-blue text-glow-blue">
                    {user.level_progress.current_level_exp.toLocaleString()} /{" "}
                    {user.level_progress.exp_to_next_level.toLocaleString()} EXP
                  </span>
                  <div className="relative w-32 h-1.5 bg-sl-black border border-sl-gray-muted overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 animate-pulse-glow"
                      style={{
                        width: `${user.level_progress.progress_percent}%`,
                        background:
                          "linear-gradient(to right, #00A3FF, #7B2CBF)",
                        boxShadow: "0 0 10px rgba(0, 163, 255, 0.5)",
                      }}
                    />
                    {/* Shimmer effect */}
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s ease-in-out infinite',
                      }}
                    />
                  </div>

                  {/* Streak pill */}
                  {(() => {
                    const { currentStreak, longestStreak, isAtRisk } = streak;
                    const legendary = currentStreak >= 30;
                    const hot = currentStreak >= 7;
                    const active = currentStreak > 0;
                    const flameColor = isAtRisk && active
                      ? 'text-amber-400'
                      : legendary ? 'text-sl-red'
                      : hot ? 'text-orange-400'
                      : active ? 'text-sl-blue'
                      : 'text-sl-silver-dark';
                    const borderColor = isAtRisk && active
                      ? 'border-amber-400/50'
                      : legendary ? 'border-sl-red/50'
                      : hot ? 'border-orange-400/40'
                      : active ? 'border-sl-blue/30'
                      : 'border-sl-gray-muted/20';
                    const bgColor = isAtRisk && active
                      ? 'bg-amber-400/5'
                      : legendary ? 'bg-sl-red/10'
                      : hot ? 'bg-orange-400/5'
                      : active ? 'bg-sl-blue/5'
                      : 'bg-transparent';
                    const glowColor = isAtRisk && active
                      ? 'rgba(251,191,36,0.7)'
                      : legendary ? 'rgba(230,57,70,0.8)'
                      : hot ? 'rgba(251,146,60,0.6)'
                      : active ? 'rgba(0,163,255,0.5)'
                      : 'transparent';
                    return (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`flex items-center gap-1 px-2 py-0.5 border ${borderColor} ${bgColor} cursor-default shrink-0 select-none ${isAtRisk && active ? 'animate-pulse' : ''}`}
                            style={{ boxShadow: active ? `0 0 8px ${glowColor}` : 'none' }}
                          >
                            <Flame
                              size={11}
                              className={flameColor}
                              style={{ filter: active ? `drop-shadow(0 0 4px ${glowColor})` : 'none' }}
                            />
                            <span className={`text-[10px] font-bold tabular-nums ${flameColor}`}
                              style={{ textShadow: active ? `0 0 8px ${glowColor}` : 'none' }}>
                              {active ? currentStreak : '—'}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-sl-gray border border-sl-blue/30 text-sl-silver">
                          <div className="text-xs space-y-1 py-0.5">
                            <div className="flex items-center gap-2">
                              <Flame size={12} className={flameColor} />
                              <span>{t('header.streak.current', { count: currentStreak })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star size={12} className="text-yellow-400" />
                              <span>{t('header.streak.best', { count: longestStreak })}</span>
                            </div>
                            {isAtRisk && active && (
                              <div className="text-amber-400 font-semibold pt-0.5 border-t border-amber-400/20">
                                {t('header.streak.atRisk')}
                              </div>
                            )}
                            {!active && (
                              <div className="text-sl-silver-muted pt-0.5">
                                {t('header.streak.start')}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Center - Logo */}
        <div className="flex-1 flex justify-center">
          <AppTitle className="h-12" />
        </div>

        {/* Right - Navigation */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <GhostButton onClick={onToday}>{t('header.today')}</GhostButton>

          <div className="flex items-center gap-1 ml-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton
                  onClick={onPrevMonth}
                  disabled={disablePrevMonth}
                  className={disablePrevMonth ? "opacity-30 cursor-not-allowed" : ""}
                >
                  <ChevronLeft size={16} />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>
                {disablePrevMonth ? t('header.accountStart') : t('header.prevMonth')}
              </TooltipContent>
            </Tooltip>

            <span className="text-sm font-bold uppercase tracking-wider text-sl-silver min-w-40 text-center">
              {currentDate.toLocaleDateString(
                i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US',
                { month: 'long' }
              )} {currentDate.getFullYear()}
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton onClick={onNextMonth}>
                  <ChevronRight size={16} />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>{t('header.nextMonth')}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="bg-sl-black border border-sl-red/30 sm:max-w-sm shadow-[0_0_30px_rgba(230,57,70,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-sl-red font-bold uppercase tracking-wider">
              {t('header.logoutModal.title')}
            </DialogTitle>
            <DialogDescription className="text-sl-silver-muted text-sm pt-2">
              {isGuest
                ? t('header.logoutModal.guestWarning')
                : t('header.logoutModal.normalWarning')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <PrimaryButton
              onClick={() => setShowLogoutModal(false)}
              className="flex-1"
            >
              {t('header.logoutModal.stay')}
            </PrimaryButton>
            <DangerButton
              onClick={() => {
                setShowLogoutModal(false);
                logout();
              }}
              className="flex-1"
            >
              {t('header.logoutModal.confirm')}
            </DangerButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ranks Modal */}
      <Dialog open={showRanksModal} onOpenChange={setShowRanksModal}>
        <DialogContent className="bg-sl-black border border-sl-blue/30 sm:max-w-lg shadow-[0_0_40px_rgba(0,163,255,0.3)] max-h-[85vh] overflow-hidden flex flex-col p-0">
          {/* Animated background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0, 163, 255, 0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0, 163, 255, 0.5) 1px, transparent 1px)
                `,
                backgroundSize: '30px 30px',
              }}
            />
            {/* Ambient orbs */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-sl-blue/20 rounded-full blur-[80px]" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-sl-purple/20 rounded-full blur-[80px]" />
            {/* Vignette */}
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 0%, rgba(13, 13, 13, 0.6) 100%)',
              }}
            />
          </div>

          <DialogHeader className="relative z-10 p-6 pb-4 border-b border-sl-blue/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-linear-to-r from-sl-blue to-sl-purple rounded-full blur-sm opacity-50" />
                <div className="relative w-10 h-10 bg-sl-gray border border-sl-blue/50 flex items-center justify-center">
                  <Crown size={20} className="text-sl-blue" />
                </div>
              </div>
              <div>
                <DialogTitle className="text-sl-blue font-bold uppercase tracking-[0.15em]" style={{ textShadow: '0 0 20px rgba(0, 163, 255, 0.5)' }}>
                  {t('header.ranks.title')}
                </DialogTitle>
                <DialogDescription className="text-sl-silver-muted text-xs pt-0.5">
                  {t('header.ranks.subtitle')}
                </DialogDescription>
              </div>
            </div>
            {/* Progress bar showing overall rank progress */}
            {user && (
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-sl-silver-muted mb-1">
                  <span>Level {user.level_progress.level}</span>
                  <span>Level 100</span>
                </div>
                <div className="h-1.5 bg-sl-gray-muted/30 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(user.level_progress.level, 100)}%`,
                      background: 'linear-gradient(90deg, #00A3FF 0%, #7B2CBF 50%, #E63946 100%)',
                      boxShadow: '0 0 10px rgba(0, 163, 255, 0.5)',
                    }}
                  />
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="relative z-10 flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {rankData.map((rank) => {
                const isCurrentRank = user?.level_progress.rank_title === rank.key;
                const currentLevel = user?.level_progress.level || 1;
                const rankMinLevel = parseInt(rank.range.split('-')[0].replace('+', ''));
                const isPastRank = currentLevel > rankMinLevel + (rank.range.includes('+') ? 0 : parseInt(rank.range.split('-')[1]) - rankMinLevel);
                const isLegendary = 'isLegendary' in rank && rank.isLegendary;
                const RankIcon = rank.icon;

                return (
                  <div
                    key={rank.range}
                    className={`relative p-3 border transition-all duration-300 ${
                      isCurrentRank
                        ? `${rank.borderColor} ${rank.bgColor}`
                        : isPastRank
                        ? "border-sl-gray-muted/30 bg-sl-gray/20"
                        : "border-sl-gray-muted/20 bg-sl-gray/10 opacity-60"
                    } ${isLegendary && isCurrentRank ? 'led-border' : ''}`}
                    style={{
                      boxShadow: isCurrentRank ? `0 0 20px ${rank.glowColor}, inset 0 0 20px ${rank.glowColor}` : 'none',
                      '--led-color': isLegendary ? '#E63946' : undefined,
                    } as React.CSSProperties}
                  >
                    {/* Rank number indicator */}
                    <div className={`absolute -left-px top-0 bottom-0 w-1 ${isCurrentRank ? rank.bgColor : isPastRank ? 'bg-sl-gray-muted/50' : 'bg-transparent'}`}
                      style={{
                        background: isCurrentRank ? `linear-gradient(180deg, ${rank.glowColor}, transparent)` : undefined
                      }}
                    />

                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`shrink-0 w-10 h-10 flex items-center justify-center border ${
                        isCurrentRank ? rank.borderColor : 'border-sl-gray-muted/30'
                      } ${isCurrentRank ? rank.bgColor : 'bg-sl-gray/30'}`}>
                        <RankIcon size={18} className={isCurrentRank ? rank.color : isPastRank ? 'text-sl-silver-muted' : 'text-sl-silver-dark'} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isCurrentRank ? rank.color : isPastRank ? 'text-sl-silver-muted' : 'text-sl-silver-dark'
                          }`}>
                            Level {rank.range}
                          </span>
                          {isCurrentRank && (
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ${rank.color}`}
                              style={{
                                background: rank.glowColor,
                                boxShadow: `0 0 10px ${rank.glowColor}`,
                              }}
                            >
                              {t('header.ranks.current')}
                            </span>
                          )}
                          {isPastRank && !isCurrentRank && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-sl-silver-dark px-2 py-0.5 bg-sl-gray-muted/30">
                              {t('header.ranks.achieved')}
                            </span>
                          )}
                        </div>
                        <div className={`text-sm font-bold mt-0.5 ${
                          isCurrentRank ? 'text-sl-silver' : isPastRank ? 'text-sl-silver/70' : 'text-sl-silver-dark'
                        }`} style={isCurrentRank && isLegendary ? { textShadow: `0 0 10px ${rank.glowColor}` } : undefined}>
                          {rank.title}
                        </div>
                        <div className={`text-xs mt-0.5 ${
                          isCurrentRank ? 'text-sl-silver-muted' : 'text-sl-silver-dark'
                        }`}>
                          {rank.theme}
                        </div>
                      </div>
                    </div>

                    {/* Legendary shimmer effect */}
                    {isLegendary && isCurrentRank && (
                      <div
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(230, 57, 70, 0.3) 50%, transparent 100%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 3s ease-in-out infinite',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 p-4 border-t border-sl-blue/20 text-center">
            <p className="text-[10px] text-sl-silver-dark uppercase tracking-wider">
              {t('header.ranks.quote')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}

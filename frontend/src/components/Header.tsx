import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppTitle from "@/components/AppTitle";
import { Menu, Trophy, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
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

interface HeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function Header({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showRanksModal, setShowRanksModal] = useState(false);

  const rankData = [
    {
      range: "1-5",
      title: "Awakened One",
      theme: "Just discovered their potential",
    },
    { range: "6-10", title: "Beginner Warrior", theme: "Starting the journey" },
    {
      range: "11-20",
      title: "Task Slayer",
      theme: "Learning to conquer daily challenges",
    },
    {
      range: "21-30",
      title: "Dungeon Crawler",
      theme: "Consistently tackling goals",
    },
    {
      range: "31-40",
      title: "Goal Hunter",
      theme: "Actively pursuing objectives",
    },
    { range: "41-50", title: "Elite Achiever", theme: "Proven track record" },
    {
      range: "51-60",
      title: "S-Rank Executor",
      theme: "High-level discipline",
    },
    {
      range: "61-70",
      title: "Master of Habits",
      theme: "Habits are now second nature",
    },
    {
      range: "71-80",
      title: "Sovereign of Will",
      theme: "Unshakeable determination",
    },
    { range: "81-90", title: "Ruler of Self", theme: "Complete self-mastery" },
    { range: "91-99", title: "Monarch's Equal", theme: "Among the elite few" },
    {
      range: "100+",
      title: "Shadow Monarch",
      theme: "Absolute discipline, unlimited potential",
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="shrink-0 px-8 py-4 border-b border-sl-blue/20 bg-linear-to-r from-sl-black via-sl-gray/50 to-sl-black">
      <div className="flex items-center justify-between">
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
                onClick={() => navigate("/achievements")}
                className="text-sl-silver hover:text-sl-blue hover:bg-sl-blue/5 cursor-pointer text-xs font-bold uppercase tracking-wider"
              >
                <Trophy size={16} />
                Achievements
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-sl-gray-muted" />
              <DropdownMenuItem
                onClick={() => setShowLogoutModal(true)}
                className="text-sl-red hover:text-sl-red hover:bg-sl-red/5 cursor-pointer text-xs font-bold uppercase tracking-wider"
              >
                <LogOut size={16} />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Info */}
          {user && (
            <>
              {/* Avatar */}
              <div className="relative">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-10 h-10 border-2 border-sl-blue glow-blue"
                  />
                ) : (
                  <div className="w-10 h-10 bg-sl-gray-light border-2 border-sl-blue flex items-center justify-center text-sm font-bold text-sl-silver">
                    {getInitials(user.name)}
                  </div>
                )}
                {/* Level badge */}
                <div className="absolute -bottom-1 -right-1 bg-sl-blue text-sl-black text-[10px] font-bold px-1.5 py-0.5 min-w-5 text-center">
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
                    {user.level_progress.rank_title}
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-bold tracking-wider text-sl-blue text-glow-blue">
                    {user.level_progress.current_level_exp.toLocaleString()} /{" "}
                    {user.level_progress.exp_to_next_level.toLocaleString()} EXP
                  </span>
                  <div className="w-32 h-1.5 bg-sl-black border border-sl-gray-muted overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${user.level_progress.progress_percent}%`,
                        background:
                          "linear-gradient(to right, #00A3FF, #7B2CBF)",
                        boxShadow: "0 0 10px rgba(0, 163, 255, 0.5)",
                      }}
                    />
                  </div>
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
          <GhostButton onClick={onToday}>Today</GhostButton>

          <div className="flex items-center gap-1 ml-4">
            <IconButton onClick={onPrevMonth}>
              <ChevronLeft size={16} />
            </IconButton>

            <span className="text-sm font-bold uppercase tracking-wider text-sl-silver min-w-40 text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>

            <IconButton onClick={onNextMonth}>
              <ChevronRight size={16} />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="bg-sl-black border border-sl-red/30 sm:max-w-sm shadow-[0_0_30px_rgba(230,57,70,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-sl-red font-bold uppercase tracking-wider">
              Confirm Logout
            </DialogTitle>
            <DialogDescription className="text-sl-silver-muted text-sm pt-2">
              Are you sure you want to logout? Your progress is saved, but
              you'll need to login again to continue your quests.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <PrimaryButton
              onClick={() => setShowLogoutModal(false)}
              className="flex-1"
            >
              Stay
            </PrimaryButton>
            <DangerButton
              onClick={() => {
                setShowLogoutModal(false);
                logout();
              }}
              className="flex-1"
            >
              Logout
            </DangerButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ranks Modal */}
      <Dialog open={showRanksModal} onOpenChange={setShowRanksModal}>
        <DialogContent className="bg-sl-black border border-sl-blue/30 sm:max-w-md shadow-[0_0_30px_rgba(0,163,255,0.2)] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sl-blue text-glow-blue font-bold uppercase tracking-wider">
              Rank Progression
            </DialogTitle>
            <DialogDescription className="text-sl-silver-muted text-sm pt-1">
              Complete quests to earn EXP and unlock new ranks
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <div className="space-y-2 pt-2">
              {rankData.map((rank) => {
                const isCurrentRank =
                  user?.level_progress.rank_title === rank.title;
                return (
                  <div
                    key={rank.range}
                    className={`p-3 border transition-all ${
                      isCurrentRank
                        ? "bg-sl-blue/10 border-sl-blue/50 shadow-[0_0_15px_rgba(0,163,255,0.2)]"
                        : "bg-sl-gray/30 border-sl-gray-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isCurrentRank
                            ? "text-sl-blue"
                            : "text-sl-silver-muted"
                        }`}
                      >
                        Level {rank.range}
                      </span>
                      {isCurrentRank && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sl-black bg-sl-blue px-2 py-0.5">
                          Current
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        isCurrentRank ? "text-sl-silver" : "text-sl-silver/70"
                      }`}
                    >
                      {rank.title}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        isCurrentRank
                          ? "text-sl-silver-muted"
                          : "text-sl-silver-dark"
                      }`}
                    >
                      {rank.theme}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}

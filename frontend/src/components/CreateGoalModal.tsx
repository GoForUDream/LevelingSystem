import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { API_URL, apiFetch } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";

interface GoalData {
  id: number;
  title: string;
  description: string | null;
  rank: string;
  start_date: string;
  end_date: string;
  is_done: boolean;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalSaved: () => void;
  editGoal?: GoalData | null;
}

const rankLevels = [
  {
    value: "D",
    label: "D",
    color: "bg-sl-gray text-sl-silver-muted border-sl-gray-muted",
    accent: "border-sl-silver-muted",
    subtitle: "Short-term goals with a clear finish line",
    description: "Goals that can be completed within days to a couple of weeks. Low complexity, low risk, but still meaningful progress.",
    timeframe: "Days to 2 weeks",
    examples: "Organize workspace, finish a book, set up a budget spreadsheet",
  },
  {
    value: "C",
    label: "C",
    color: "bg-sl-blue/20 text-sl-blue border-sl-blue/50",
    accent: "border-sl-blue",
    subtitle: "Mid-term goals that need a plan",
    description: "Goals that take weeks to a month and involve multiple steps or phases. Moderate complexity with some dependencies between tasks.",
    timeframe: "2 weeks to 1 month",
    examples: "Complete an online course, build a 30-day exercise routine, redesign your portfolio",
  },
  {
    value: "B",
    label: "B",
    color: "bg-sl-purple/20 text-sl-purple border-sl-purple/50",
    accent: "border-sl-purple",
    subtitle: "Long-term goals that test your commitment",
    description: "Goals that span one to three months across different stages. They require planning, tracking, and adapting along the way.",
    timeframe: "1-3 months",
    examples: "Train for a half marathon, launch an MVP, pass a certification exam",
  },
  {
    value: "A",
    label: "A",
    color: "bg-[#FF6B00]/20 text-[#FF6B00] border-[#FF6B00]/50",
    accent: "border-[#FF6B00]",
    subtitle: "Major goals that reshape part of your life",
    description: "Goals that take three to six months of sustained effort with complex task structures and multiple milestones. You won't be the same person when you finish.",
    timeframe: "3-6 months",
    examples: "Get a promotion, write a book draft, complete a body transformation",
  },
  {
    value: "S",
    label: "S",
    color: "bg-sl-red/20 text-sl-red border-sl-red/50",
    accent: "border-sl-red",
    subtitle: "Life-defining goals that transform who you are",
    description: "Goals that take six months to a year or more, made up of dozens or hundreds of tasks. These are the mountains that change everything.",
    timeframe: "6 months to 1 year+",
    examples: "Start a business, earn a degree, achieve financial independence",
  },
];

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function CreateGoalModal({
  isOpen,
  onClose,
  onGoalSaved,
  editGoal,
}: GoalModalProps) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rank, setRank] = useState("C");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editGoal;

  useEffect(() => {
    if (editGoal) {
      setTitle(editGoal.title);
      setDescription(editGoal.description || "");
      setRank(editGoal.rank);
      setStartDate(toDateInputValue(editGoal.start_date));
      setEndDate(toDateInputValue(editGoal.end_date));
    } else {
      setTitle("");
      setDescription("");
      setRank("C");
      setStartDate("");
      setEndDate("");
    }
  }, [editGoal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Start date and end date are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        rank,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
      };

      const url = isEditMode
        ? `${API_URL}/api/goals/${editGoal.id}`
        : `${API_URL}/api/goals`;
      const method = isEditMode ? "PATCH" : "POST";

      const response = await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save goal");

      onGoalSaved();
      onClose();
      toast.success(isEditMode ? "Goal updated!" : "Goal created!");
    } catch {
      toast.error("Failed to save goal", { description: "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-sl-black border border-sl-blue/30 sm:max-w-md shadow-[0_0_30px_rgba(0,163,255,0.2)]">
        <DialogHeader>
          <DialogTitle className="text-sl-blue text-glow-blue font-bold uppercase tracking-wider">
            {isEditMode ? "Edit Goal" : "New Goal"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted mb-2">
              Goal Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to achieve?"
              className="w-full bg-sl-gray border border-sl-gray-muted px-4 py-3 text-sl-silver placeholder-sl-silver-dark focus:outline-none focus:border-sl-blue focus:shadow-[0_0_10px_rgba(0,163,255,0.3)] transition-all"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted mb-2">
              Description{" "}
              <span className="text-sl-silver-dark font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your goal..."
              rows={3}
              className="w-full bg-sl-gray border border-sl-gray-muted px-4 py-3 text-sl-silver placeholder-sl-silver-dark focus:outline-none focus:border-sl-blue focus:shadow-[0_0_10px_rgba(0,163,255,0.3)] transition-all resize-none"
            />
          </div>

          {/* Rank */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted mb-2">
              Rank
            </label>
            <div className="grid grid-cols-5 gap-1">
              {rankLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setRank(level.value)}
                  className={`py-2 px-1 text-sm font-bold uppercase tracking-wider transition-all border ${
                    rank === level.value
                      ? `${level.color} shadow-[0_0_10px_rgba(0,163,255,0.3)]`
                      : "bg-sl-gray text-sl-silver-muted border-sl-gray-muted hover:border-sl-silver-muted"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>

            {/* Rank Description */}
            {(() => {
              const selected = rankLevels.find((l) => l.value === rank);
              if (!selected) return null;
              return (
                <div className={`mt-3 p-3 bg-sl-gray border-l-2 ${selected.accent}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-sl-silver">
                      {selected.subtitle}
                    </span>
                    <span className="text-[10px] font-bold text-sl-blue text-glow-blue">
                      {selected.timeframe}
                    </span>
                  </div>
                  <p className="text-xs text-sl-silver-muted mb-2">
                    {selected.description}
                  </p>
                  <p className="text-[10px] text-sl-silver-dark">
                    e.g. {selected.examples}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-sl-gray border border-sl-gray-muted px-4 py-3 text-sl-silver focus:outline-none focus:border-sl-blue focus:shadow-[0_0_10px_rgba(0,163,255,0.3)] transition-all scheme-dark"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-sl-gray border border-sl-gray-muted px-4 py-3 text-sl-silver focus:outline-none focus:border-sl-blue focus:shadow-[0_0_10px_rgba(0,163,255,0.3)] transition-all scheme-dark"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <SecondaryButton type="button" onClick={onClose} className="flex-1">
              Cancel
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              isLoading={isSubmitting}
              className="flex-1"
            >
              {isEditMode ? "Save Changes" : "Create Goal"}
            </PrimaryButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

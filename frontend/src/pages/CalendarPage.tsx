import { RefreshCw } from "lucide-react";
import BadgeUnlockModal from "@/components/BadgeUnlockModal";
import CancelRecurringModal from "@/components/CancelRecurringModal";
import DayColumn from "@/components/calendar/DayColumn";
import Header from "@/components/Header";
import TaskModal from "@/components/CreateTaskModal";
import { useCalendarController } from "@/hooks/useCalendarController";
import { compareMonths, localDateKey } from "@/lib/calendarData";

export default function CalendarPage() {
  const {
    allDays,
    cancelModalTask,
    cancellingTaskId,
    completingTaskId,
    currentBadge,
    earliestMonth,
    editTask,
    expandedDays,
    failedMonths,
    goToToday,
    handleCancelClick,
    handleScroll,
    handleWheel,
    isModalOpen,
    navigateMonth,
    refreshTasks,
    retryFailedMonths,
    selectedDate,
    setCancelModalTask,
    setCurrentBadge,
    setEditTask,
    setExpandedDays,
    setIsModalOpen,
    setScrollElement,
    setSelectedDate,
    tasksByDate,
    visibleMonth,
    virtualDays,
    virtualTotalSize,
    cancelTask,
    completeTask,
  } = useCalendarController();

  return (
    <div className="h-screen w-screen bg-sl-black flex flex-col overflow-hidden">
      <Header
        currentDate={new Date(visibleMonth.year, visibleMonth.month, 1)}
        onPrevMonth={() => navigateMonth(-1)}
        onNextMonth={() => navigateMonth(1)}
        onToday={goToToday}
        disablePrevMonth={
          !!earliestMonth && compareMonths(visibleMonth, earliestMonth) === 0
        }
      />

      <div className="relative flex-1 min-h-0">
        {failedMonths.size > 0 && (
          <button
            onClick={retryFailedMonths}
            className="absolute z-30 right-4 top-4 p-2 border border-sl-red/40 bg-sl-black text-sl-red cursor-pointer"
            title="Retry failed month"
          >
            <RefreshCw size={16} />
          </button>
        )}
        <div
          ref={setScrollElement}
          onScroll={handleScroll}
          onWheel={handleWheel}
          className="h-full overflow-x-auto overflow-y-hidden scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="relative h-full" style={{ width: virtualTotalSize }}>
            {virtualDays.map((virtualDay) => {
              const day = allDays[virtualDay.index];
              const key = localDateKey(day);
              return (
                <div
                  key={key}
                  data-calendar-day={key}
                  className="absolute top-0 h-full"
                  style={{
                    width: virtualDay.size,
                    transform: `translateX(${virtualDay.start}px)`,
                  }}
                >
                  <DayColumn
                    day={day}
                    tasks={tasksByDate.get(key) ?? []}
                    isExpanded={expandedDays.has(key)}
                    completingTaskId={completingTaskId}
                    cancellingTaskId={cancellingTaskId}
                    onToggleExpanded={(dateKey) =>
                      setExpandedDays((previous) => {
                        const next = new Set(previous);
                        if (next.has(dateKey)) next.delete(dateKey);
                        else next.add(dateKey);
                        return next;
                      })
                    }
                    onAddTask={(date) => {
                      setEditTask(null);
                      setSelectedDate(date);
                      setIsModalOpen(true);
                    }}
                    onComplete={completeTask}
                    onCancel={handleCancelClick}
                    onEdit={(task) => {
                      setEditTask(task);
                      setIsModalOpen(true);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditTask(null);
        }}
        selectedDate={selectedDate}
        onTaskSaved={refreshTasks}
        editTask={editTask}
      />
      <BadgeUnlockModal
        isOpen={!!currentBadge}
        onClose={() => setCurrentBadge(null)}
        badge={currentBadge}
      />
      <CancelRecurringModal
        isOpen={!!cancelModalTask}
        onClose={() => setCancelModalTask(null)}
        onSkipOnce={() =>
          cancelModalTask && void cancelTask(cancelModalTask.id, true)
        }
        onCancelAll={() =>
          cancelModalTask && void cancelTask(cancelModalTask.id, false)
        }
        taskTitle={cancelModalTask?.title || ""}
        expPenalty={
          cancelModalTask ? Math.floor(cancelModalTask.exp_value / 5) : 0
        }
        isLoading={cancellingTaskId === cancelModalTask?.id}
      />
    </div>
  );
}

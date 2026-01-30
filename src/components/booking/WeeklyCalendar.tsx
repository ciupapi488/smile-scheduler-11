import { useState, useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay, isToday, isBefore, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WeeklyCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

export function WeeklyCalendar({ selectedDate, onDateSelect }: WeeklyCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const goToPreviousWeek = () => {
    setWeekStart(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setWeekStart(prev => addDays(prev, 7));
  };

  const today = startOfDay(new Date());

  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {format(weekStart, "MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousWeek}
            disabled={isBefore(weekStart, today)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const isPast = isBefore(day, today);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => !isPast && onDateSelect(day)}
              disabled={isPast}
              className={cn(
                "flex flex-col items-center rounded-lg p-3 transition-all",
                isPast && "cursor-not-allowed opacity-40",
                !isPast && !isSelected && "hover:bg-accent",
                isSelected && "bg-primary text-primary-foreground shadow-md",
                isTodayDate && !isSelected && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                {format(day, "EEE")}
              </span>
              <span className="mt-1 text-lg font-semibold">
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

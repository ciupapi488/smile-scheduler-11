import { useState } from "react";
import { format, eachDayOfInterval, isWeekend } from "date-fns";
import { CalendarIcon, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STANDARD_TIMES = ["08:00:00", "12:30:00", "14:00:00"];

export function SlotGenerator() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (endDate < startDate) {
      toast.error("End date must be after start date");
      return;
    }

    setIsGenerating(true);

    try {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const weekdays = days.filter((day) => !isWeekend(day));

      const slots = weekdays.flatMap((day) =>
        STANDARD_TIMES.map((time) => ({
          slot_date: format(day, "yyyy-MM-dd"),
          slot_time: time,
          status: "available" as const,
        }))
      );

      if (slots.length === 0) {
        toast.warning("No weekdays in the selected range");
        return;
      }

      const { error } = await supabase
        .from("appointment_slots")
        .upsert(slots, { onConflict: "slot_date,slot_time", ignoreDuplicates: true });

      if (error) throw error;

      toast.success(`Generated ${slots.length} slots for ${weekdays.length} weekdays`);
      setStartDate(undefined);
      setEndDate(undefined);
    } catch (error: any) {
      console.error("Error generating slots:", error);
      toast.error(error.message || "Failed to generate slots");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <h2 className="mb-6 text-xl font-semibold text-foreground">Generate Standard Slots</h2>
      
      <p className="mb-6 text-sm text-muted-foreground">
        Generate appointment slots for weekdays (Monday-Friday) at standard times:
        <span className="mt-2 flex gap-2">
          {STANDARD_TIMES.map((time) => (
            <span key={time} className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              {time.slice(0, 5)}
            </span>
          ))}
        </span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Start Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">End Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(date) => date < (startDate || new Date())}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={!startDate || !endDate || isGenerating}
        className="mt-6 w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Standard Hours
          </>
        )}
      </Button>
    </div>
  );
}

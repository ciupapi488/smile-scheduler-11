import { format } from "date-fns";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Slot {
  id: string;
  slot_time: string;
  status: string;
}

interface TimeSlotPickerProps {
  date: Date;
  slots: Slot[];
  isLoading: boolean;
  onSlotSelect: (slot: Slot) => void;
}

export function TimeSlotPicker({ date, slots, isLoading, onSlotSelect }: TimeSlotPickerProps) {
  const availableSlots = slots.filter((slot) => slot.status === "available");

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border bg-card">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">
          Available times for {format(date, "EEEE, MMMM d")}
        </h3>
      </div>

      {availableSlots.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg bg-muted/50">
          <p className="text-muted-foreground">No available slots for this date</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {availableSlots.map((slot) => (
            <Button
              key={slot.id}
              variant="outline"
              onClick={() => onSlotSelect(slot)}
              className={cn(
                "h-12 text-base font-medium transition-all",
                "hover:border-primary hover:bg-primary/5 hover:text-primary"
              )}
            >
              {slot.slot_time.slice(0, 5)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

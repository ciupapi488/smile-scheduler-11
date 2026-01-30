import { format } from "date-fns";
import { AlertTriangle, User, Phone, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Slot {
  id: string;
  slot_date: string;
  slot_time: string;
  status: string;
  patient_name: string | null;
  patient_phone: string | null;
}

interface ScheduleViewProps {
  slots: Slot[];
  isLoading: boolean;
}

export function ScheduleView({ slots, isLoading }: ScheduleViewProps) {
  const getStatusConfig = (status: string) => {
    if (status === "available") {
      return {
        label: "Available",
        className: "bg-muted text-muted-foreground",
        showWarning: false,
      };
    }
    if (status === "booked") {
      return {
        label: "Booked",
        className: "bg-status-booked/15 text-status-booked border-status-booked/30",
        showWarning: false,
      };
    }
    if (status.startsWith("late_")) {
      const minutes = status.split("_")[1];
      return {
        label: `Late ${minutes} min`,
        className: "bg-status-late/20 text-foreground border-status-late",
        showWarning: true,
      };
    }
    return {
      label: status,
      className: "bg-muted text-muted-foreground",
      showWarning: false,
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-muted/30">
        <p className="text-muted-foreground">No slots scheduled for today</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {slots.map((slot) => {
        const config = getStatusConfig(slot.status);

        return (
          <div
            key={slot.id}
            className={cn(
              "flex items-center justify-between rounded-lg border p-4 transition-all",
              config.className
            )}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-lg font-semibold">
                  {slot.slot_time.slice(0, 5)}
                </span>
              </div>

              {slot.patient_name && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span>{slot.patient_name}</span>
                  </div>
                  {slot.patient_phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      <span>{slot.patient_phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {config.showWarning && (
                <AlertTriangle className="h-5 w-5 text-status-late" />
              )}
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  slot.status === "available" && "bg-muted-foreground/20",
                  slot.status === "booked" && "bg-status-booked text-white",
                  slot.status.startsWith("late_") && "bg-status-late text-foreground"
                )}
              >
                {config.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

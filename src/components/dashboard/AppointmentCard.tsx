import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  slot_date: string;
  slot_time: string;
  status: string;
  patient_name: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onMarkLate: (id: string, minutes: number) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}

export function AppointmentCard({ appointment, onMarkLate, onCancel }: AppointmentCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const dateObj = new Date(appointment.slot_date);
  const isLate = appointment.status.startsWith("late_");
  const lateMinutes = isLate ? appointment.status.split("_")[1] : null;

  const handleMarkLate = async (minutes: number) => {
    setIsUpdating(true);
    try {
      await onMarkLate(appointment.id, minutes);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancel(appointment.id);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 shadow-card transition-all",
        isLate && "border-status-late bg-status-late/10"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          {isLate && (
            <div className="flex items-center gap-2 text-sm font-medium text-status-late">
              <AlertTriangle className="h-4 w-4" />
              <span>Running {lateMinutes} minutes late</span>
            </div>
          )}
          
          <div className="flex items-center gap-3 text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-semibold">{format(dateObj, "EEEE, MMMM d, yyyy")}</span>
          </div>
          
          <div className="flex items-center gap-3 text-foreground">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-semibold">{appointment.slot_time.slice(0, 5)}</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Booked as: {appointment.patient_name}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isUpdating}>
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "I'm Running Late"
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleMarkLate(5)}>
                5 minutes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMarkLate(10)}>
                10 minutes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMarkLate(15)}>
                15 minutes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isCancelling}>
                {isCancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Cancel Appointment"
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel your appointment on{" "}
                  {format(dateObj, "MMMM d")} at {appointment.slot_time.slice(0, 5)}?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Calendar, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppointmentCard } from "@/components/dashboard/AppointmentCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Appointment {
  id: string;
  slot_date: string;
  slot_time: string;
  status: string;
  patient_name: string;
}

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("appointment_slots")
        .select("id, slot_date, slot_time, status, patient_name")
        .eq("booked_by", user!.id)
        .gte("slot_date", today)
        .neq("status", "cancelled")
        .neq("status", "available")
        .order("slot_date")
        .order("slot_time");

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkLate = async (id: string, minutes: number) => {
    try {
      const { error } = await supabase
        .from("appointment_slots")
        .update({ status: `late_${minutes}` })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(`Marked as ${minutes} minutes late`);
      fetchAppointments();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const { error } = await supabase
        .from("appointment_slots")
        .update({
          status: "available",
          booked_by: null,
          patient_name: null,
          patient_phone: null,
        })
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Appointment cancelled");
      fetchAppointments();
    } catch (error: any) {
      console.error("Error cancelling:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">My Appointments</h1>
              <p className="mt-2 text-muted-foreground">
                Manage your upcoming dental appointments
              </p>
            </div>

            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="rounded-xl border bg-card p-8 text-center shadow-card">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold text-foreground">
                  No upcoming appointments
                </h3>
                <p className="mt-2 text-muted-foreground">
                  You don't have any scheduled appointments yet
                </p>
                <Button asChild className="mt-6">
                  <Link to="/">Book an Appointment</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onMarkLate={handleMarkLate}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;

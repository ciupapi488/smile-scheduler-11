import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Loader2, Calendar } from "lucide-react";
import { Header } from "@/components/Header";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ScheduleView } from "@/components/admin/ScheduleView";
import { SlotGenerator } from "@/components/admin/SlotGenerator";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Slot {
  id: string;
  slot_date: string;
  slot_time: string;
  status: string;
  patient_name: string | null;
  patient_phone: string | null;
}

const AdminSchedule = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodaySlots();
  }, []);

  const fetchTodaySlots = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("appointment_slots")
        .select("*")
        .eq("slot_date", today)
        .order("slot_time");

      if (error) throw error;
      setSlots(data || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Today's Schedule</h1>
          <p className="mt-1 text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
      </div>
      <ScheduleView slots={slots} isLoading={isLoading} />
    </div>
  );
};

const AdminGenerator = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Slot Generator</h1>
        <p className="mt-1 text-muted-foreground">
          Generate appointment slots for your schedule
        </p>
      </div>
      <SlotGenerator />
    </div>
  );
};

const Admin = () => {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const isGeneratorPage = location.pathname === "/admin/generator";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <AdminSidebar />
          <main className="flex-1 p-8">
            {isGeneratorPage ? <AdminGenerator /> : <AdminSchedule />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;

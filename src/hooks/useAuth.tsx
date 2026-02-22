import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,
});

// Helper to check admin with timeout - checks user_roles table
const checkAdminWithTimeout = async (userId: string, timeoutMs = 2000): Promise<boolean> => {
  return Promise.race([
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          // Table might not exist or RLS error - silently fail
          console.warn("Admin check warning (non-critical):", error.message);
          return false;
        }
        return !!data;
      })
      .catch((err) => {
        console.warn("Admin check failed (non-critical):", err.message);
        return false;
      }),
    new Promise<boolean>((resolve) => 
      setTimeout(() => {
        console.warn("Admin check timeout");
        resolve(false);
      }, timeoutMs)
    )
  ]);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    let initTimeout: ReturnType<typeof setTimeout>;

    // Failsafe: force loading to false after 3 seconds
    initTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn("Auth init timeout - forcing isLoading to false");
        setIsLoading(false);
      }
    }, 3000);

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          // Check admin with timeout to prevent hanging
          try {
            const adminStatus = await checkAdminWithTimeout(newSession.user.id);
            if (mounted) setIsAdmin(adminStatus);
          } catch (err) {
            console.error("Admin check error:", err);
            if (mounted) setIsAdmin(false);
          }
        } else {
          if (mounted) setIsAdmin(false);
        }
        
        if (mounted) {
          setIsLoading(false);
          clearTimeout(initTimeout);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mounted) return;

      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user) {
        try {
          const adminStatus = await checkAdminWithTimeout(initialSession.user.id);
          if (mounted) setIsAdmin(adminStatus);
        } catch (err) {
          console.error("Admin check error:", err);
          if (mounted) setIsAdmin(false);
        }
      } else {
        if (mounted) setIsAdmin(false);
      }
      
      if (mounted) {
        setIsLoading(false);
        clearTimeout(initTimeout);
      }
    }).catch((err) => {
      console.error("Get session error:", err);
      if (mounted) {
        setIsLoading(false);
        clearTimeout(initTimeout);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

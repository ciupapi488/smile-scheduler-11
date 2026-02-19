import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function AuthNav() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  if (loading) {
    return <div className="w-8" />; // Placeholder while loading
  }

  // If user is logged in, show profile/logout
  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link 
          to="/pacient/dashboard"
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <span className="hidden sm:block text-sm font-medium">
            {user.user_metadata?.first_name || 'Contul Meu'}
          </span>
        </Link>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // If not logged in, show login button
  return (
    <Link 
      to="/pacient/login"
      className="text-gray-600 hover:text-gray-900 font-medium"
    >
      Contul Meu
    </Link>
  );
}

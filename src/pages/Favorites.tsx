import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";

export default function Favorites() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchFavorites(session.user.id);
      }
    });
  }, [navigate]);

  const fetchFavorites = async (userId: string) => {
    try {
      const { data: favs, error } = await supabase
        .from('favorites')
        .select('calculator_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const enriched = await Promise.all((favs || []).map(async (fav) => {
        const { data: calc } = await supabase
          .from('calculators')
          .select('id, title, description, user_id')
          .eq('id', fav.calculator_id)
          .single();

        if (!calc) return null;

        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', calc.user_id)
          .single();

        return {
          id: calc.id,
          title: calc.title,
          description: calc.description,
          username: profile?.username || 'Anonymous'
        };
      }));
      
      setFavorites(enriched.filter(Boolean) as any[]);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center">
              <Heart className="w-7 h-7 text-primary-foreground fill-current" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Favorite Calculators</h1>
              <p className="text-muted-foreground">Calculators you've saved</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Loading favorites...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">No favorites yet</p>
              <Button onClick={() => navigate("/marketplace")} className="bg-gradient-primary">
                Explore Marketplace
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map(calc => (
                <CalculatorCard
                  key={calc.id}
                  id={calc.id}
                  title={calc.title}
                  description={calc.description}
                  username={calc.username}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
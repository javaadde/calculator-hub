import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Marketplace() {
  const [calculators, setCalculators] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalculators();
  }, []);

  const fetchCalculators = async () => {
    try {
      const { data: calcs, error: calcError } = await supabase
        .from('calculators')
        .select('id, title, description, user_id')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (calcError) throw calcError;

      const enriched = await Promise.all((calcs || []).map(async (calc) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', calc.user_id)
          .single();

        const { data: ratings } = await supabase
          .from('ratings')
          .select('rating')
          .eq('calculator_id', calc.id);

        const avgRating = ratings?.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0;

        return {
          ...calc,
          username: profile?.username || 'Anonymous',
          rating: avgRating
        };
      }));

      setCalculators(enriched);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCalculators = calculators.filter(calc =>
    calc.title.toLowerCase().includes(search.toLowerCase()) ||
    calc.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
              Calculator Marketplace
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover and use calculators created by the community
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search calculators..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Loading calculators...</p>
            </div>
          ) : filteredCalculators.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No calculators found. Be the first to create one!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCalculators.map(calc => (
                <CalculatorCard
                  key={calc.id}
                  id={calc.id}
                  title={calc.title}
                  description={calc.description}
                  rating={calc.rating}
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
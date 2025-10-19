import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CalculatorViewer } from "@/components/CalculatorViewer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CalculatorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [calculator, setCalculator] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCalculator();
    }
  }, [id]);

  const fetchCalculator = async () => {
    try {
      const { data, error } = await supabase
        .from('calculators')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCalculator(data.calculator_data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error("Calculator not found");
      navigate("/marketplace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/marketplace")}
            className="mb-6"
          >
            ← Back to Marketplace
          </Button>

          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading calculator...</p>
            </div>
          ) : calculator ? (
            <CalculatorViewer calculator={calculator} calculatorId={id} />
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Calculator not found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
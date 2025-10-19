import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Save, Share2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShareModal } from "./ShareModal";

interface CalculatorViewerProps {
  calculator: any;
  calculatorId?: string;
  onSave?: () => void;
}

export const CalculatorViewer = ({ calculator, calculatorId, onSave }: CalculatorViewerProps) => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [result, setResult] = useState<number | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (calculatorId && user) {
      checkFavorite();
      fetchRating();
    }
  }, [calculatorId, user]);

  const checkFavorite = async () => {
    if (!calculatorId || !user) return;
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('calculator_id', calculatorId)
      .eq('user_id', user.id)
      .single();
    setIsFavorited(!!data);
  };

  const fetchRating = async () => {
    if (!calculatorId) return;
    const { data } = await supabase
      .from('ratings')
      .select('rating')
      .eq('calculator_id', calculatorId);
    if (data && data.length > 0) {
      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      setAverageRating(avg);
    }
  };

  useEffect(() => {
    const initialValues: Record<string, any> = {};
    calculator.fields.forEach((field: any) => {
      initialValues[field.id] = field.defaultValue ?? (field.type === 'checkbox' ? false : '');
    });
    setValues(initialValues);
  }, [calculator]);

  useEffect(() => {
    calculateResult();
  }, [values]);

  const calculateResult = () => {
    try {
      const formula = calculator.formula;
      const func = new Function(...Object.keys(values), `return ${formula}`);
      const res = func(...Object.values(values));
      setResult(Number(res));
    } catch (error) {
      console.error('Calculation error:', error);
      setResult(null);
    }
  };

  const handleSaveCalculator = async () => {
    if (!user) {
      toast.error("Please sign in to save calculators");
      return;
    }

    try {
      const { error } = await supabase.from('calculators').insert({
        user_id: user.id,
        title: calculator.title,
        description: calculator.description,
        calculator_data: calculator
      });

      if (error) throw error;
      toast.success("Calculator saved!");
      onSave?.();
    } catch (error) {
      console.error('Save error:', error);
      toast.error("Failed to save calculator");
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !calculatorId) return;

    try {
      if (isFavorited) {
        await supabase
          .from('favorites')
          .delete()
          .eq('calculator_id', calculatorId)
          .eq('user_id', user.id);
        setIsFavorited(false);
        toast.success("Removed from favorites");
      } else {
        await supabase.from('favorites').insert({
          calculator_id: calculatorId,
          user_id: user.id
        });
        setIsFavorited(true);
        toast.success("Added to favorites");
      }
    } catch (error) {
      console.error('Favorite error:', error);
      toast.error("Failed to update favorites");
    }
  };

  return (
    <>
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">{calculator.title}</h2>
          <p className="text-muted-foreground">{calculator.description}</p>
          {averageRating > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          {calculator.fields.map((field: any) => (
            <div key={field.id}>
              <Label htmlFor={field.id}>{field.label}</Label>
              {field.type === 'number' && (
                <Input
                  id={field.id}
                  type="number"
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => setValues({ ...values, [field.id]: Number(e.target.value) })}
                  className="mt-1"
                />
              )}
              {field.type === 'text' && (
                <Input
                  id={field.id}
                  type="text"
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                  className="mt-1"
                />
              )}
              {field.type === 'select' && (
                <Select
                  value={values[field.id]}
                  onValueChange={(val) => setValues({ ...values, [field.id]: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt: string) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {field.type === 'checkbox' && (
                <div className="flex items-center gap-2 mt-1">
                  <Checkbox
                    id={field.id}
                    checked={values[field.id]}
                    onCheckedChange={(checked) => setValues({ ...values, [field.id]: checked })}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {result !== null && (
          <div className="bg-gradient-primary p-6 rounded-2xl text-center mb-6">
            <p className="text-primary-foreground/80 text-sm mb-1">{calculator.resultLabel}</p>
            <p className="text-4xl font-bold text-primary-foreground">{result.toFixed(2)}</p>
          </div>
        )}

        <div className="flex gap-3">
          {!calculatorId && (
            <Button onClick={handleSaveCalculator} className="flex-1" variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          )}
          {calculatorId && user && (
            <Button onClick={handleToggleFavorite} variant="outline">
              <Star className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              {isFavorited ? 'Favorited' : 'Favorite'}
            </Button>
          )}
          <Button onClick={() => setShowShare(true)} className="flex-1 bg-gradient-secondary">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </Card>

      <ShareModal
        open={showShare}
        onClose={() => setShowShare(false)}
        calculatorId={calculatorId}
      />
    </>
  );
};
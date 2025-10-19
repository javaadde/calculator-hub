import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CalculatorGeneratorProps {
  onGenerate: (calculator: any) => void;
}

export const CalculatorGenerator = ({ onGenerate }: CalculatorGeneratorProps) => {
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Please describe your calculator");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-calculator', {
        body: { description }
      });

      if (error) throw error;

      if (data.calculator) {
        onGenerate(data.calculator);
        toast.success("Calculator generated!");
        setDescription("");
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || "Failed to generate calculator");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Create Your Calculator</h2>
            <p className="text-sm text-muted-foreground">
              Describe what you want to calculate
            </p>
          </div>
        </div>

        <Textarea
          placeholder="E.g., 'Split my rent between 3 roommates' or 'Calculate my BMI' or 'Tip calculator with custom percentage'..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[120px] mb-4 text-lg resize-none"
          disabled={isGenerating}
        />

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          className="w-full bg-gradient-primary hover:opacity-90 text-lg h-12"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Calculator
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
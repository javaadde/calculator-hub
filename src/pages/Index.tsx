import { useState } from "react";
import { Header } from "@/components/Header";
import { CalculatorGenerator } from "@/components/CalculatorGenerator";
import { CalculatorViewer } from "@/components/CalculatorViewer";
import { Button } from "@/components/ui/button";
import { Calculator, Sparkles, Users, Share2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  const [generatedCalculator, setGeneratedCalculator] = useState<any>(null);

  const handleGenerate = (calculator: any) => {
    setGeneratedCalculator(calculator);
  };

  const handleSave = () => {
    setGeneratedCalculator(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        {!generatedCalculator ? (
          <>
            {/* Hero Section */}
            <section className="text-center mb-16 max-w-4xl mx-auto">
              <div className="inline-block mb-6 px-4 py-2 bg-gradient-primary rounded-full">
                <span className="text-primary-foreground font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Calculator Generator
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
                Any Calculator,
                <br />
                Instantly Created
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Describe what you want to calculate, and our AI generates a custom calculator in seconds.
                Save, share, and discover calculators from the community.
              </p>
            </section>

            {/* Generator */}
            <section className="mb-16">
              <CalculatorGenerator onGenerate={handleGenerate} />
            </section>

            {/* Features */}
            <section className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 mb-16">
              <div className="text-center p-6 rounded-2xl bg-card border border-border">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center">
                  <Calculator className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI Generation</h3>
                <p className="text-muted-foreground">
                  Describe your calculator in plain language and watch AI build it instantly
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-card border border-border">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-secondary flex items-center justify-center">
                  <Users className="w-7 h-7 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Community</h3>
                <p className="text-muted-foreground">
                  Browse, rate, and discover calculators created by others
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-card border border-border">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center">
                  <Share2 className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Share Easily</h3>
                <p className="text-muted-foreground">
                  Share your calculators via links or QR codes with anyone
                </p>
              </div>
            </section>

            {/* CTA */}
            <section className="text-center">
              <Link to="/marketplace">
                <Button size="lg" className="bg-gradient-secondary hover:opacity-90 text-lg h-14 px-8">
                  Explore Marketplace
                </Button>
              </Link>
            </section>
          </>
        ) : (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <Button
                variant="ghost"
                onClick={() => setGeneratedCalculator(null)}
                className="mb-4"
              >
                ← Generate Another
              </Button>
            </div>
            <CalculatorViewer calculator={generatedCalculator} onSave={handleSave} />
          </div>
        )}
      </main>
    </div>
  );
}
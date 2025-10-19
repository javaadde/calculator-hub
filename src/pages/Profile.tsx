import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { CalculatorCard } from "@/components/CalculatorCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [calculators, setCalculators] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
        fetchCalculators(session.user.id);
      }
    });
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
      setUsername(data.username || '');
    }
  };

  const fetchCalculators = async (userId: string) => {
    const { data } = await supabase
      .from('calculators')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    setCalculators(data || []);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);

      if (error) throw error;
      toast.success("Profile updated!");
      setIsEditing(false);
      fetchProfile(user.id);
    } catch (error) {
      console.error('Update error:', error);
      toast.error("Failed to update profile");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 mb-12">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center">
                <User className="w-10 h-10 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {profile?.username || 'User'}
                </h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Edit Profile
                </Button>
              )}
            </div>

            {isEditing && (
              <div className="space-y-4 pt-6 border-t">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleUpdateProfile} className="bg-gradient-primary">
                    Save Changes
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <div className="mb-6">
            <h2 className="text-2xl font-bold">My Calculators</h2>
            <p className="text-muted-foreground">Calculators you've created</p>
          </div>

          {calculators.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">You haven't created any calculators yet</p>
              <Button onClick={() => navigate("/")} className="bg-gradient-primary">
                Create Your First Calculator
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {calculators.map(calc => (
                <CalculatorCard
                  key={calc.id}
                  id={calc.id}
                  title={calc.title}
                  description={calc.description}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
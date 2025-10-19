import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Heart } from "lucide-react";
import { Link } from "react-router-dom";

interface CalculatorCardProps {
  id: string;
  title: string;
  description: string;
  rating?: number;
  username?: string;
}

export const CalculatorCard = ({ id, title, description, rating, username }: CalculatorCardProps) => {
  return (
    <Link to={`/calculator/${id}`}>
      <Card className="p-6 hover:shadow-xl transition-all hover:scale-105 cursor-pointer border-2 hover:border-primary">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold line-clamp-1">{title}</h3>
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{description}</p>
        
        {username && (
          <Badge variant="secondary" className="text-xs">
            by {username}
          </Badge>
        )}
      </Card>
    </Link>
  );
};
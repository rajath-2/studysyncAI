"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Star, ChevronRight, Lightbulb } from "lucide-react";
import { Recommendation } from "@/services/matching";
import { cn } from "@/lib/utils";

interface MatchRecommendationProps {
  recommendation: Recommendation;
  onJoin: (groupId: string) => void;
  isLoading?: boolean;
}

export function MatchRecommendation({ recommendation, onJoin, isLoading }: MatchRecommendationProps) {
  const scoreColor = recommendation.match_score >= 80 ? "text-green-500"
    : recommendation.match_score >= 60 ? "text-yellow-500"
    : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="overflow-hidden hover:border-primary/50 transition-colors">
        <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={cn("text-2xl font-bold", scoreColor)}>
                {recommendation.match_score}
              </div>
              <div>
                <CardTitle className="text-lg">AI Match</CardTitle>
                <p className="text-xs text-muted-foreground">Match Score</p>
              </div>
            </div>
            <Star className={cn("h-5 w-5", scoreColor)} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {recommendation.reasoning}
          </div>

          {recommendation.suggested_improvements && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {recommendation.suggested_improvements}
              </p>
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => onJoin(recommendation.group_id)}
            disabled={isLoading}
          >
            Join Group <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
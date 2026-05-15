"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Brain, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { matchingService, Recommendation } from "@/services/matching";
import { MatchRecommendation } from "@/components/MatchRecommendation";
import { useRouter } from "next/navigation";

export default function MatchingPage() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (token && recommendations.length === 0) {
      fetchRecommendations();
    }
  }, [token]);

  const fetchRecommendations = async () => {
    setIsFetching(true);
    try {
      const data = await matchingService.getRecommendations(token!);
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Failed to get recommendations:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleJoin = async (groupId: string) => {
    setIsLoading(true);
    alert(`Join request sent for group ${groupId}`);
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-4">
          <Brain className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">AI-Powered Matchmaking</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Our AI analyzes your preferences and historical match data to find the best study groups for you.
        </p>
      </motion.div>

      {isFetching ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Finding your perfect matches...</p>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Recommended for you</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {recommendations.map((rec, idx) => (
              <motion.div
                key={rec.group_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <MatchRecommendation
                  recommendation={rec}
                  onJoin={handleJoin}
                  isLoading={isLoading}
                />
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center border rounded-lg">
          <h2 className="text-muted-foreground mb-4">No recommendations yet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Complete your profile and preferences to get personalized recommendations.
          </p>
          <button onClick={fetchRecommendations} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
            Find Matches
          </button>
        </div>
      )}
    </div>
  );
}
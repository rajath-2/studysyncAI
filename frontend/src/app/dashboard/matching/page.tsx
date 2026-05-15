"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2, Sparkles, Users, Clock, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { matchingService, Recommendation } from "@/services/matching";
import { groupsService, Group } from "@/services/groups";

const SUBJECT_COLORS: Record<string, string> = {
  "Mathematics": "bg-blue-500",
  "Computer Science": "bg-green-500",
  "Physics": "bg-purple-500",
  "Chemistry": "bg-yellow-500",
  "Biology": "bg-emerald-500",
  "Literature": "bg-pink-500",
  "History": "bg-orange-500",
  "Economics": "bg-teal-500",
  "Psychology": "bg-indigo-500",
};

export default function MatchingPage() {
  const { token } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [groups, setGroups] = useState<Map<string, Group>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (token) {
      loadRecommendations();
    }
  }, [token]);

  const loadRecommendations = async (refresh = false) => {
    if (!token) return;

    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const actualToken = authData.state?.token || token;

      const data = await matchingService.getRecommendations(actualToken);
      setRecommendations(data.recommendations || []);

      if (data.recommendations?.length > 0) {
        const groupIds = data.recommendations.map((r: Recommendation) => r.group_id);
        const groupsData = await groupsService.listGroups(actualToken, {});
        const groupMap = new Map<string, Group>();
        groupsData.groups?.forEach((g: Group) => groupMap.set(g.id, g));
        setGroups(groupMap);
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleJoin = async (groupId: string) => {
    if (!token) return;
    try {
      const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const actualToken = authData.state?.token || token;

      await groupsService.joinGroup(groupId, actualToken);
      alert("Join request sent!");
    } catch (error: any) {
      const message = error?.message || '';
      if (message.includes('Already a member') || message.includes('pending')) {
        alert("You're already a member or have a pending request.");
      } else {
        alert("Failed to join group");
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Matches
          </h1>
          <p className="text-muted-foreground mt-2">
            Personalized study group recommendations based on your preferences and learning history.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/onboarding?returnTo=/dashboard/matching'}>
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Update Interests
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : recommendations.length === 0 ? (
        <Card className="p-8 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
          <p className="text-muted-foreground mb-4">
            Complete your profile and preferences to get AI-powered group recommendations.
          </p>
          <Button onClick={() => window.location.href = '/dashboard/settings'}>
            Update Preferences
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {recommendations.map((rec, idx) => {
            const group = groups.get(rec.group_id);
            // match_score is already 0-100 from AI
            const score = typeof rec.match_score === 'number' && rec.match_score <= 100 ? rec.match_score : 0;

            return (
              <motion.div key={rec.group_id} variants={itemVariants}>
                <Card className="h-full flex flex-col hover:border-primary/50 transition-colors relative overflow-hidden">
                  {/* Match Score Banner */}
                  <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-lg ${
                    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}>
                    {score.toFixed(0)}% Match
                  </div>

                  <CardHeader className="pb-4">
                    <div className={`px-2 py-1 rounded text-xs font-medium text-white w-fit ${
                      SUBJECT_COLORS[group?.subject || ''] || 'bg-gray-500'
                    }`}>
                      {group?.subject || 'General'}
                    </div>
                    <CardTitle className="text-xl leading-tight mt-2">
                      {group?.name || `Group ${idx + 1}`}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-2">
                      <Users className="h-3.5 w-3.5 mr-1" />
                      {group?.member_count || 0}/{group?.max_members || 6} members
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    {/* Reasoning */}
                    <div className="bg-muted/50 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Why this match
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                    </div>

                    {/* Suggested Improvements */}
                    {rec.suggested_improvements && (
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Star className="h-4 w-4" />
                          <span>Suggestions</span>
                        </div>
                        <p className="text-muted-foreground text-xs">{rec.suggested_improvements}</p>
                      </div>
                    )}
                  </CardContent>

                  <CardContent className="pt-0">
                    <Button className="w-full" onClick={() => handleJoin(rec.group_id)}>
                      Join Group
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
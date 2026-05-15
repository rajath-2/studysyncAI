"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface FeedbackFormProps {
  groupId: string;
  sessionId?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
}

const RATINGS = [
  { value: 1, emoji: "😠", label: "Poor" },
  { value: 2, emoji: "😕", label: "Fair" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🤩", label: "Excellent" },
];

export function FeedbackForm({ groupId, sessionId, onSubmit, onCancel }: FeedbackFormProps) {
  const { token } = useAuth();
  const [rating, setRating] = useState<number | null>(null);
  const [whatWorked, setWhatWorked] = useState("");
  const [whatCouldImprove, setWhatCouldImprove] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      setError("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          group_id: groupId,
          session_id: sessionId,
          rating,
          what_worked: whatWorked,
          what_could_improve: whatCouldImprove,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      onSubmit?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Rate your match</CardTitle>
          <CardDescription>
            Your feedback helps us improve future matches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                {error}
              </div>
            )}

            {/* Rating */}
            <div>
              <label className="mb-3 block text-sm font-medium">How well did the group match work?</label>
              <div className="flex gap-3 justify-center">
                {RATINGS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRating(r.value)}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-lg border transition-all",
                      rating === r.value
                        ? "border-primary bg-primary/10 scale-110"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-2xl">{r.emoji}</span>
                    <span className="text-xs text-muted-foreground mt-1">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* What worked */}
            <div>
              <label htmlFor="whatWorked" className="text-sm font-medium">What worked well?</label>
              <textarea
                id="whatWorked"
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                placeholder="e.g., Same learning pace, complementary skills, great communication..."
                value={whatWorked}
                onChange={(e) => setWhatWorked(e.target.value)}
              />
            </div>

            {/* What could improve */}
            <div>
              <label htmlFor="whatImprove" className="text-sm font-medium">What could improve?</label>
              <textarea
                id="whatImprove"
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                placeholder="e.g., Different time zones made scheduling hard, need more practice problems..."
                value={whatCouldImprove}
                onChange={(e) => setWhatCouldImprove(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

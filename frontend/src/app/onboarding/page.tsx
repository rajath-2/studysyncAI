"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Target, Clock, BookOpen, Sparkles, CheckCircle2, ChevronRight, ChevronLeft, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { usersService, PreferencesUpdate } from "@/services/users";

const STEPS = [
  { id: "welcome", title: "Welcome", icon: Sparkles },
  { id: "subjects", title: "Subjects", icon: BookOpen },
  { id: "availability", title: "Availability", icon: Clock },
  { id: "learning", title: "Learning Style", icon: Target },
];

const PRESET_SUBJECTS = [
  "Mathematics", "Computer Science", "Physics", "Chemistry", "Biology",
  "Literature", "History", "Economics", "Psychology"
];

const PRESET_AVAILABILITY = [
  "Early Morning",
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
  "Night Owl"
];

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

const LEARNING_STYLES = [
  { value: "visual", label: "Visual", description: "I learn best with diagrams, charts, and videos" },
  { value: "auditory", label: "Auditory", description: "I learn best by listening and discussing" },
  { value: "reading", label: "Reading", description: "I learn best from textbooks and written materials" },
  { value: "kinesthetic", label: "Kinesthetic", description: "I learn best by doing and hands-on practice" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [showCustomSubject, setShowCustomSubject] = useState(false);

  const [selections, setSelections] = useState<PreferencesUpdate>({
    subjects: [],
    availability: { preset: [] },
    learning_style: undefined,
  });

  // Check if user already completed onboarding (but allow access if returnTo is set)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');

    if (isAuthenticated && user?.is_onboarding_complete && !returnTo) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  // Load existing preferences if available
  useEffect(() => {
    if (user?.preferences && token) {
      const prefs = user.preferences as unknown as PreferencesUpdate;
      if (prefs.subjects?.length > 0 || (prefs.availability?.preset && prefs.availability.preset.length > 0)) {
        setSelections(prefs);
      }
    }
  }, [user, token]);

  const toggleSubject = (subjectName: string) => {
    setSelections((prev) => {
      const exists = prev.subjects.find(s => s.name === subjectName);
      if (exists) {
        return { ...prev, subjects: prev.subjects.filter(s => s.name !== subjectName) };
      }
      return { ...prev, subjects: [...prev.subjects, { name: subjectName, level: "intermediate" }] };
    });
  };

  const setSubjectLevel = (subjectName: string, level: typeof LEVELS[number]) => {
    setSelections((prev) => ({
      ...prev,
      subjects: prev.subjects.map(s => s.name === subjectName ? { ...s, level } : s),
    }));
  };

  const addCustomSubject = () => {
    if (customSubject.trim()) {
      setSelections((prev) => ({
        ...prev,
        subjects: [...prev.subjects, { name: customSubject.trim(), level: "intermediate", is_custom: true }],
      }));
      setCustomSubject("");
      setShowCustomSubject(false);
    }
  };

  const toggleAvailability = (slot: string) => {
    setSelections((prev) => {
      const current = prev.availability.preset;
      if (current.includes(slot)) {
        return { ...prev, availability: { ...prev.availability, preset: current.filter(s => s !== slot) } };
      }
      return { ...prev, availability: { ...prev.availability, preset: [...current, slot] } };
    });
  };

  const setLearningStyle = (style: string) => {
    setSelections((prev) => ({
      ...prev,
      learning_style: prev.learning_style === style ? undefined : (style as PreferencesUpdate['learning_style']),
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Welcome
      case 1: return selections.subjects.length > 0; // Subjects
      case 2: return selections.availability.preset.length > 0; // Availability
      case 3: return true; // Learning style (optional)
      default: return true;
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user || !token) {
      router.push("/signin");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await usersService.updatePreferences(user.id, selections, token);

      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo');
      router.push(returnTo || "/dashboard");
    } catch (err) {
      console.error("Failed to save preferences:", err);
      setError("Failed to save preferences. Please try again.");
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between relative">
            <div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 bg-muted -z-10" />
            <motion.div
              className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-primary -z-10 origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: currentStep / (STEPS.length - 1) }}
              transition={{ duration: 0.3 }}
            />

            {STEPS.map((step, index) => {
              const isActive = index <= currentStep;
              return (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300",
                    isActive ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background text-muted-foreground"
                  )}>
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span className={cn(
                    "text-xs font-medium hidden sm:block",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Content */}
        <Card className="p-8 min-h-[450px] flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            {/* STEP 0: Welcome */}
            {currentStep === 0 && (
              <motion.div key="step0" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col justify-center">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Let's personalize your experience</h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    We'll ask about your subjects, availability, and learning style. 
                    This helps us find study partners who really fit you.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 max-w-md mx-auto text-left">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">Why we ask:</span> Your preferences are stored securely and used only to improve your matches. 
                      You can update them anytime in Settings.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Subjects */}
            {currentStep === 1 && (
              <motion.div key="step1" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex-1">
                <h2 className="text-2xl font-bold mb-2">What subjects do you study?</h2>
                <p className="text-muted-foreground mb-4">Select all that apply.</p>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-6 text-sm">
                  <p className="text-primary">
                    <span className="font-medium">Why:</span> We'll match you with peers at similar skill levels so no one feels lost or bored.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {PRESET_SUBJECTS.map((subject) => {
                    const selected = selections.subjects.find(s => s.name === subject);
                    return (
                      <button
                        key={subject}
                        onClick={() => toggleSubject(subject)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border p-3 text-left transition-all hover:bg-muted/50",
                          selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                        )}
                      >
                        <span className="font-medium text-sm">{subject}</span>
                        {selected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                
                {/* Custom Subject */}
                {showCustomSubject ? (
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Enter subject name"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomSubject()}
                    />
                    <Button size="sm" onClick={addCustomSubject}>Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowCustomSubject(false); setCustomSubject(""); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowCustomSubject(true)} className="mb-4">
                    <Plus className="h-4 w-4 mr-2" /> Add Custom Subject
                  </Button>
                )}

                {/* Selected subjects with level selector */}
                {selections.subjects.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-medium mb-3">Set your level for each subject:</p>
                    <div className="space-y-3">
                      {selections.subjects.map((subject) => (
                        <div key={subject.name} className="flex items-center justify-between">
                          <span className="text-sm">{subject.name}</span>
                          <div className="flex gap-1">
                            {LEVELS.map((level) => (
                              <button
                                key={level}
                                onClick={() => setSubjectLevel(subject.name, level)}
                                className={cn(
                                  "px-3 py-1 text-xs rounded-full transition-colors",
                                  subject.level === level
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                              >
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: Availability */}
            {currentStep === 2 && (
              <motion.div key="step2" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex-1">
                <h2 className="text-2xl font-bold mb-2">When are you available to study?</h2>
                <p className="text-muted-foreground mb-4">Select your typical availability.</p>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-6 text-sm">
                  <p className="text-primary">
                    <span className="font-medium">Why:</span> We only recommend groups that meet when you're free.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESET_AVAILABILITY.map((slot) => {
                    const isSelected = selections.availability.preset.includes(slot);
                    return (
                      <button
                        key={slot}
                        onClick={() => toggleAvailability(slot)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border p-4 text-left transition-all hover:bg-muted/50",
                          isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                        )}
                      >
                        <span className="font-medium text-sm">{slot}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
                {selections.availability.preset.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    {selections.availability.preset.length} time slot(s) selected
                  </p>
                )}
              </motion.div>
            )}

            {/* STEP 3: Learning Style */}
            {currentStep === 3 && (
              <motion.div key="step3" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="flex-1">
                <h2 className="text-2xl font-bold mb-2">How do you learn best?</h2>
                <p className="text-muted-foreground mb-4">Optional - helps us match teaching styles.</p>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-6 text-sm">
                  <p className="text-primary">
                    <span className="font-medium">Why:</span> Study partners who match your style learn faster together.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LEARNING_STYLES.map((style) => {
                    const isSelected = selections.learning_style === style.value;
                    return (
                      <button
                        key={style.value}
                        onClick={() => setLearningStyle(style.value)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border p-4 text-left transition-all hover:bg-muted/50",
                          isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                        )}
                      >
                        <div className="text-left">
                          <span className="font-medium text-sm block">{style.label}</span>
                          <span className="text-xs text-muted-foreground">{style.description}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error display */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={nextStep} disabled={!canProceed() || isSubmitting}>
              {isSubmitting ? "Saving..." : currentStep === STEPS.length - 1 ? "Complete Setup" : "Continue"}
              {currentStep < STEPS.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

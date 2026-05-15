"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Users, Zap, BrainCircuit } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center text-center px-4 py-24 sm:px-6 lg:px-8">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)]" />
      <div className="absolute top-0 -z-10 h-full w-full bg-background">
        <div className="absolute bottom-auto left-auto right-0 top-0 h-[500px] w-[500px] -translate-x-[30%] translate-y-[20%] rounded-full bg-[rgba(79,70,229,0.15)] opacity-50 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl space-y-8"
      >
        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Zap className="mr-2 h-4 w-4" />
          <span>StudySync AI is now in Beta</span>
        </div>
        
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
          Find your perfect <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            study group
          </span>{" "}
          with AI.
        </h1>
        
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
          Stop studying alone. Our advanced AI matches you with peers who share your goals, learning style, and schedule to maximize your academic potential.
        </p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Button size="lg" className="w-full sm:w-auto text-md h-12 px-8">
            <Link href="/signin">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto text-md h-12 px-8">
            <Link href="/signup">Create Account</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20 text-left"
        >
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <BrainCircuit className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Smart Matching</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Our AI analyzes your syllabus and learning style to connect you with the most compatible study partners.</p>
          </div>
          
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Active Groups</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Join dynamic study sessions, share notes, and collaborate in real-time with integrated tools.</p>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Boost Grades</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Students in structured study groups score 20% higher on average. Unlock your full potential today.</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

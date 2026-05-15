"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Button } from "./ui/Button";
import { motion } from "framer-motion";

export function Navbar() {
  const pathname = usePathname();
  const isAuthenticated = pathname?.startsWith("/dashboard") || pathname?.startsWith("/onboarding");

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">StudySync<span className="text-primary">AI</span></span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">Dashboard</Link>
          <Link href="/matching" className="transition-colors hover:text-foreground/80 text-foreground/60">Find Groups</Link>
          <Link href="/about" className="transition-colors hover:text-foreground/80 text-foreground/60">About</Link>
        </nav>

        {!isAuthenticated && (
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="hidden sm:inline-flex">
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </motion.header>
  );
}

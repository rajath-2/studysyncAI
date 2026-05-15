"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { LogOut, User, Bell, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usersService } from "@/services/users";

interface UserData {
  id: string;
  email: string;
  full_name: string;
  bio?: string;
  university?: string;
  avatar_url?: string;
  preferences: {
    priorities: string[];
    hours: string[];
    subjects: string[];
  };
  is_onboarding_complete: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    university: "",
  });

  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user?.id) return;

    try {
      const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const token = authData.state?.token;

      if (!token) return;

      const userData = await usersService.getUser(user.id, token);
      setFormData({
        full_name: userData.full_name || "",
        bio: userData.bio || "",
        university: userData.university || "",
      });
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const token = authData.state?.token;

      if (!token) return;

      await usersService.updateUser(user.id, {
        full_name: formData.full_name,
        bio: formData.bio,
        university: formData.university,
      }, token);

      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences.</p>
      </div>

      <div className="grid md:grid-cols-[200px_1fr] gap-8">
        <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto pb-2 md:pb-0">
          <Button variant="secondary" className="justify-start"><User className="mr-2 h-4 w-4" /> Profile</Button>
          <Button variant="ghost" className="justify-start"><Bell className="mr-2 h-4 w-4" /> Notifications</Button>
          <Button variant="ghost" className="justify-start"><Shield className="mr-2 h-4 w-4" /> Security</Button>
        </nav>

        <div className="space-y-6">
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg p-3 text-sm">
              {successMessage}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input
                  id="university"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  placeholder="Your university"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-red-900/20 bg-red-900/5">
            <CardHeader>
              <CardTitle className="text-red-500">Danger Zone</CardTitle>
              <CardDescription>Log out of your account or delete your data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-between hover:bg-red-950 hover:text-red-500 border-red-900/50"
                onClick={handleLogout}
              >
                <span className="flex items-center"><LogOut className="mr-2 h-4 w-4" /> Log out of StudySync</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
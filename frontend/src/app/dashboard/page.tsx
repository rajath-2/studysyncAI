"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Users, Clock, BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchAPI } from "@/lib/api";

interface Group {
  id: string;
  name: string;
  subject: string;
  member_count: number;
}

interface Session {
  id: string;
  group_id: string;
  scheduled_at: string;
  group_name?: string;
}

interface DashboardData {
  active_groups: Group[];
  upcoming_sessions: Session[];
  total_study_hours: number;
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('auth-storage');
        const parsedToken = token ? JSON.parse(token).state?.token : null;

        if (!parsedToken) {
          setLoading(false);
          return;
        }

        const [groups, sessions] = await Promise.all([
          fetchAPI<{ groups: Group[] }>('/groups/my', { token: parsedToken }).catch(() => ({ groups: [] })),
          fetchAPI<{ sessions: Session[] }>('/sessions/upcoming', { token: parsedToken }).catch(() => ({ sessions: [] })),
        ]);

        setData({
          active_groups: groups.groups || [],
          upcoming_sessions: sessions.sessions || [],
          total_study_hours: 0,
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  const userName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
      initial="hidden"
      animate="show"
      className="max-w-5xl space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userName} 👋</h1>
        <p className="text-muted-foreground mt-2">Here's what's happening with your study groups today.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.active_groups?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {data?.active_groups?.length === 0 ? 'No groups yet' : 'Active study groups'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.upcoming_sessions?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {data?.upcoming_sessions?.length === 0 ? 'No sessions scheduled' : 'Sessions scheduled'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.total_study_hours || 0}</div>
              <p className="text-xs text-muted-foreground">Hours this week</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">AI Match</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium mb-3">Find study partners</p>
              <Button size="sm" className="w-full" onClick={() => window.location.href = '/dashboard/groups'}>
                Browse Groups
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Your Groups</CardTitle>
            <CardDescription>Active study groups you're part of.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.active_groups && data.active_groups.length > 0 ? (
                data.active_groups.map((group) => (
                  <div key={group.id} className="flex items-center">
                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center mr-4">
                      <span className="font-bold text-primary text-xs">
                        {group.subject?.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{group.name}</p>
                      <p className="text-xs text-muted-foreground">{group.subject} • {group.member_count} members</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => window.location.href = `/dashboard/groups/${group.id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You haven't joined any groups yet.</p>
                  <Button onClick={() => window.location.href = '/dashboard/groups'}>
                    Find a Group
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Don't miss your study sessions!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.upcoming_sessions && data.upcoming_sessions.length > 0 ? (
              data.upcoming_sessions.map((session) => (
                <div key={session.id} className="flex items-center p-3 rounded-lg border border-border/50 bg-muted/30">
                  <div className="h-10 w-10 rounded bg-primary/20 flex items-center justify-center mr-4">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{session.group_name || 'Study Session'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.scheduled_at).toLocaleDateString()} at{' '}
                      {new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming sessions</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

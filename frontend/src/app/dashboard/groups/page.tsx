"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Users, Clock, MoreHorizontal, Plus, Loader2, CheckCircle, XCircle, Video } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { groupsService, Group, PendingRequest } from "@/services/groups";
import { CompatibilityBadge } from "@/components/groups/CompatibilityBadge";

const SUBJECTS = ["Mathematics", "Computer Science", "Physics", "Chemistry", "Biology", "Literature", "History", "Economics", "Psychology"];
const TIMING_OPTIONS = ["Early Morning", "Morning", "Afternoon", "Evening", "Night", "Night Owl"];
const STUDY_FORMATS = [
  { value: "virtual", label: "Virtual" },
  { value: "in_person", label: "In-Person" },
  { value: "hybrid", label: "Hybrid" },
];

const COLORS: Record<string, string> = {
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

interface CreateGroupData {
  name: string;
  subject: string;
  description: string;
  max_members: number;
  goal: string;
  study_format: string;
  session_timing: string[];
  meeting_frequency: number;
}

function CreateGroupModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (data: CreateGroupData) => Promise<void> }) {
  const [formData, setFormData] = useState<CreateGroupData>({
    name: "",
    subject: "",
    description: "",
    max_members: 6,
    goal: "",
    study_format: "virtual",
    session_timing: [],
    meeting_frequency: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      setFormData({ name: "", subject: "", description: "", max_members: 6, goal: "", study_format: "virtual", session_timing: [], meeting_frequency: 1 });
    } catch (error) {
      console.error("Failed to create group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTiming = (timing: string) => {
    setFormData(prev => ({
      ...prev,
      session_timing: prev.session_timing.includes(timing)
        ? prev.session_timing.filter(t => t !== timing)
        : [...prev.session_timing, timing]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl border border-border/50 w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create New Study Group</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Group Name *</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Calculus 101 Midterm Prep" required />
          </div>

          <div>
            <Label htmlFor="subject">Subject *</Label>
            <select id="subject" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required>
              <option value="">Select a subject</option>
              {SUBJECTS.map((subject) => (<option key={subject} value={subject}>{subject}</option>))}
            </select>
          </div>

          <div>
            <Label>Study Format</Label>
            <div className="flex gap-4 mt-2">
              {STUDY_FORMATS.map((format) => (
                <label key={format.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="study_format" value={format.value} checked={formData.study_format === format.value} onChange={() => setFormData({ ...formData, study_format: format.value })} />
                  <span className="text-sm">{format.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Session Timing</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {TIMING_OPTIONS.map((timing) => (
                <label key={timing} className={`flex items-center gap-2 cursor-pointer p-2 border rounded text-sm ${formData.session_timing.includes(timing) ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <input type="checkbox" checked={formData.session_timing.includes(timing)} onChange={() => toggleTiming(timing)} />
                  <span>{timing}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="meeting_frequency">Meeting Frequency</Label>
            <select id="meeting_frequency" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.meeting_frequency} onChange={(e) => setFormData({ ...formData, meeting_frequency: parseInt(e.target.value) })}>
              <option value={1}>1x per week</option>
              <option value={2}>2x per week</option>
              <option value={3}>3x per week</option>
              <option value={4}>4-5x per week</option>
            </select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea id="description" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="What will your group focus on?" />
          </div>

          <div>
            <Label htmlFor="max_members">Max Members (3-6)</Label>
            <select id="max_members" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.max_members} onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) })}>
              {[3, 4, 5, 6].map((num) => (<option key={num} value={num}>{num} members</option>))}
            </select>
          </div>

          <div>
            <Label htmlFor="goal">Study Goal (optional)</Label>
            <Input id="goal" value={formData.goal} onChange={(e) => setFormData({ ...formData, goal: e.target.value })} placeholder="e.g., Pass the midterm exam" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Group"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JoinFlowModal({ group, isOpen, onClose, onSuccess }: { group: Group | null; isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [compatibility, setCompatibility] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !group) return null;

  const checkCompatibility = async () => {
    if (!token) return;
    try {
      const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const actualToken = authData.state?.token || token;
      const result = await groupsService.getCompatibility(group.id, actualToken);
      setCompatibility(result.score);
    } catch (error) {
      console.error("Failed to get compatibility:", error);
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const actualToken = authData.state?.token || token;
      await groupsService.joinGroupWithMessage(group.id, message, actualToken);
      onSuccess();
      onClose();
      setStep(1);
      setMessage("");
      setCompatibility(null);
    } catch (error) {
      console.error("Failed to join group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl border border-border/50 w-full max-w-md p-6">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Join {group.name}?</h2>
            <p className="text-muted-foreground mb-4">Check your compatibility before sending a request.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button onClick={checkCompatibility} className="flex-1">Check Compatibility</Button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Your Compatibility</h2>
            {compatibility !== null && (
              <div className="mb-4">
                <CompatibilityBadge score={compatibility} />
              </div>
            )}
            <p className="text-muted-foreground mb-2">Add a short intro (optional):</p>
            <textarea className="w-full p-2 border rounded mb-4" placeholder="Hi! I'm looking to practice algorithms..." value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Sending..." : "Send Join Request"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ request, groupId, onAction }: { request: PendingRequest; groupId: string; onAction: () => void }) {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const actualToken = authData.state?.token || token;
      await groupsService.acceptRequest(groupId, request.user_id, actualToken);
      onAction();
    } catch (error) {
      console.error("Failed to accept:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const actualToken = authData.state?.token || token;
      await groupsService.rejectRequest(groupId, request.user_id, actualToken);
      onAction();
    } catch (error) {
      console.error("Failed to reject:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-medium">{request.user_name}</p>
            <p className="text-sm text-muted-foreground">{request.user_email}</p>
          </div>
          <CompatibilityBadge score={request.compatibility_score} showLabel={false} />
        </div>
        {request.join_message && (
          <p className="text-sm text-muted-foreground mb-3 italic">"{request.join_message}"</p>
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAccept} disabled={isLoading}>
            <CheckCircle className="h-4 w-4 mr-1" /> Accept
          </Button>
          <Button size="sm" variant="destructive" onClick={handleReject} disabled={isLoading}>
            <XCircle className="h-4 w-4 mr-1" /> Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GroupsPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-groups' | 'discover' | 'requests'>('my-groups');
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<Group[]>([]  );
  const [pendingRequests, setPendingRequests] = useState<{ groupId: string; groupName: string; requests: PendingRequest[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [adminGroups, setAdminGroups] = useState<Group[]>([]);

  const loadData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const actualToken = authData.state?.token || token;

      // Use /groups/my for user's groups, not /groups/ (which returns all)
      const [myData, discoverData] = await Promise.all([
        groupsService.getMyGroups(actualToken),
        groupsService.getDiscoverGroups(actualToken)
      ]);

      setMyGroups(myData.groups || []);
      setDiscoverGroups(discoverData.groups || []);

      // Find admin groups
      const admins = (myData.groups || []).filter((g: Group) => g.your_role === 'admin');
      setAdminGroups(admins);

      // Load pending requests for admin groups
      const requestsPromises = admins.map(async (g: Group) => {
        const req = await groupsService.getPendingRequests(g.id, actualToken);
        return { groupId: g.id, groupName: g.name, requests: req.requests };
      });
      const requestsData = await Promise.all(requestsPromises);
      setPendingRequests(requestsData.filter(r => r.requests.length > 0));
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const handleCreateGroup = async (data: CreateGroupData) => {
    if (!token) throw new Error("Not authenticated");
    const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const actualToken = authData.state?.token || token;
    await groupsService.createGroup({
      name: data.name,
      subject: data.subject,
      description: data.description,
      max_members: data.max_members,
      goal: data.goal,
      study_format: data.study_format,
      session_timing: data.session_timing,
      meeting_frequency: data.meeting_frequency,
    }, actualToken);
    loadData();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const totalPending = pendingRequests.reduce((sum, r) => sum + r.requests.length, 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground mt-2">Manage your study groups and discover new ones.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Group
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button className={`px-4 py-2 font-medium ${activeTab === 'my-groups' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setActiveTab('my-groups')}>
          My Groups
        </button>
        <button className={`px-4 py-2 font-medium ${activeTab === 'discover' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setActiveTab('discover')}>
          Discover
        </button>
        {adminGroups.length > 0 && (
          <button className={`px-4 py-2 font-medium ${activeTab === 'requests' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} onClick={() => setActiveTab('requests')}>
            Requests {totalPending > 0 && <span className="ml-1 bg-red-500 text-white rounded-full px-1.5 text-xs">{totalPending}</span>}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* My Groups Tab */}
          {activeTab === 'my-groups' && (
            myGroups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>You haven't joined any groups yet.</p>
                <Button variant="link" className="mt-2" onClick={() => setActiveTab('discover')}>Discover groups</Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myGroups.map((group) => (
                  <motion.div key={group.id} variants={itemVariants}>
                    <Card className="h-full flex flex-col hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className={`px-2 py-1 rounded text-xs font-medium text-white ${COLORS[group.subject] || 'bg-gray-500'}/80 mb-2 inline-block`}>
                            {group.subject}
                          </div>
                          {group.your_role === 'admin' && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">Admin</span>
                          )}
                        </div>
                        <CardTitle className="text-xl leading-tight">{group.name}</CardTitle>
                        <CardDescription>
                          <Users className="h-3.5 w-3.5 inline mr-1" /> {group.member_count}/{group.max_members} members
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        {group.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{group.description}</p>}
                        <Button variant="secondary" className="w-full mt-auto">
                          <Video className="mr-2 h-4 w-4" /> View Group
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )
          )}

          {/* Discover Tab */}
          {activeTab === 'discover' && (
            discoverGroups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No groups to discover right now.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {discoverGroups.map((group) => (
                  <motion.div key={group.id} variants={itemVariants}>
                    <Card className="h-full flex flex-col hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className={`px-2 py-1 rounded text-xs font-medium text-white ${COLORS[group.subject] || 'bg-gray-500'}/80 mb-2 inline-block`}>
                            {group.subject}
                          </div>
                          {group.compatibility_score !== undefined && (
                            <CompatibilityBadge score={group.compatibility_score} />
                          )}
                        </div>
                        <CardTitle className="text-xl leading-tight">{group.name}</CardTitle>
                        <CardDescription>
                          <Users className="h-3.5 w-3.5 inline mr-1" /> {group.member_count}/{group.max_members} members
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        {group.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{group.description}</p>}
                        <Button className="w-full mt-auto" onClick={() => setSelectedGroup(group)}>
                          Join Group
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )
          )}

          {/* Requests Tab (Admin Only) */}
          {activeTab === 'requests' && (
            pendingRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No pending requests.</p>
              </div>
            ) : (
              <div>
                {pendingRequests.map(({ groupId, groupName, requests }) => (
                  <div key={groupId} className="mb-6">
                    <h3 className="font-medium mb-3">{groupName}</h3>
                    {requests.map((request) => (
                      <RequestCard key={request.id} request={request} groupId={groupId} onAction={loadData} />
                    ))}
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      <CreateGroupModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSubmit={handleCreateGroup} />
      <JoinFlowModal group={selectedGroup} isOpen={selectedGroup !== null} onClose={() => setSelectedGroup(null)} onSuccess={loadData} />
    </motion.div>
  );
}
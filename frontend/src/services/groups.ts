import { fetchAPI } from '@/lib/api';

export interface Group {
  id: string;
  name: string;
  subject: string;
  description?: string;
  max_members: number;
  goal?: string;
  goal_deadline?: string;
  status: string;
  created_by: string;
  member_count: number;
  created_at: string;
  study_format?: string;
  session_timing?: string[];
  meeting_frequency?: number;
  compatibility_score?: number;
  your_role?: string;
}

export interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  user_email: string;
  user_name: string;
}

export interface PendingRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  compatibility_score: number;
  join_message: string;
  preferences_snapshot: any;
  requested_at: string;
}

export const groupsService = {
  async getMyGroups(token: string): Promise<{ groups: Group[] }> {
    return fetchAPI<{ groups: Group[] }>('/groups/my', { method: 'GET', token });
  },

  async listGroups(token: string, params?: { subject?: string; status?: string }): Promise<{ groups: Group[] }> {
    const queryParams = new URLSearchParams();
    if (params?.subject) queryParams.set('subject', params.subject);
    if (params?.status) queryParams.set('status', params.status);

    const endpoint = `/groups/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return fetchAPI<{ groups: Group[] }>(endpoint, { method: 'GET', token });
  },

  async getDiscoverGroups(token: string): Promise<{ groups: Group[] }> {
    return fetchAPI<{ groups: Group[] }>('/groups/discover', { method: 'GET', token });
  },

  async getGroup(groupId: string, token: string): Promise<Group> {
    return fetchAPI<Group>(`/groups/${groupId}`, { method: 'GET', token });
  },

  async createGroup(data: Partial<Group>, token: string): Promise<Group> {
    return fetchAPI<Group>('/groups/', { method: 'POST', body: JSON.stringify(data), token });
  },

  async getMembers(groupId: string, token: string): Promise<{ members: GroupMember[] }> {
    return fetchAPI<{ members: GroupMember[] }>(`/groups/${groupId}/members`, { method: 'GET', token });
  },

  async joinGroup(groupId: string, token: string): Promise<void> {
    return fetchAPI<void>(`/groups/${groupId}/join`, { method: 'POST', token });
  },

  async joinGroupWithMessage(groupId: string, message: string, token: string): Promise<void> {
    return fetchAPI<void>(`/groups/${groupId}/join`, {
      method: 'POST',
      body: JSON.stringify({ message }),
      token
    });
  },

  async leaveGroup(groupId: string, token: string): Promise<void> {
    return fetchAPI<void>(`/groups/${groupId}/leave`, { method: 'POST', token });
  },

  async getPendingRequests(groupId: string, token: string): Promise<{ requests: PendingRequest[] }> {
    return fetchAPI<{ requests: PendingRequest[] }>(`/groups/${groupId}/pending-requests`, { method: 'GET', token });
  },

  async getCompatibility(groupId: string, token: string): Promise<any> {
    return fetchAPI<any>(`/groups/compatibility/${groupId}`, { method: 'GET', token });
  },

  async acceptRequest(groupId: string, userId: string, token: string): Promise<void> {
    return fetchAPI<void>(`/groups/${groupId}/accept/${userId}`, { method: 'POST', token });
  },

  async rejectRequest(groupId: string, userId: string, token: string): Promise<void> {
    return fetchAPI<void>(`/groups/${groupId}/requests/${userId}`, { method: 'DELETE', token });
  },
};
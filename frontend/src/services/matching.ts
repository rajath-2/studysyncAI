import { fetchAPI } from '@/lib/api';

export interface Recommendation {
  group_id: string;
  match_score: number;
  reasoning: string;
  suggested_improvements?: string;
}

export const matchingService = {
  async getRecommendations(token: string): Promise<{ recommendations: Recommendation[] }> {
    return fetchAPI<{ recommendations: Recommendation[] }>('/matching/recommend', {
      method: 'POST',
      body: JSON.stringify({}),
      token,
    });
  },
};
export interface AIRecommendation {
  id: string;
  userId: string;
  type: 'FOOD' | 'ATTRACTION' | 'ROUTE' | 'WEEKEND_PLAN' | 'FULL_TRIP' | 'HIDDEN_GEM' | 'TRENDING';
  prompt: string;
  response?: any;
  model?: string;
  tokensUsed?: number;
  costIncurred?: number;
  latencyMs?: number;
  feedback?: 'positive' | 'negative' | 'none';
  createdAt: string;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

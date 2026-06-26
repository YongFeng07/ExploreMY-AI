const API = '/api/v1';
export const aiService = {
  async planTrip(destination: string, duration: number, budget: number, interests: string[]) {
    const res = await fetch(`${API}/ai/plan-trip`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, duration, budget, interests }),
    });
    return res.json();
  },
  async generateWeekendPlan(input: any) {
    const res = await fetch(`${API}/weekend-planner/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo' },
      body: JSON.stringify(input),
    });
    return res.json();
  },
};

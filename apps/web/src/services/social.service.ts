const API = '/api/v1';
export const socialService = {
  async getFeed(page = 1) { const res = await fetch(`${API}/social/feed?page=${page}`); return res.json(); },
  async createPost(data: any) { const res = await fetch(`${API}/social/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo' }, body: JSON.stringify(data) }); return res.json(); },
  async likePost(postId: string) { const res = await fetch(`${API}/social/posts/${postId}/like`, { method: 'POST', headers: { 'x-user-id': 'demo' } }); return res.json(); },
};

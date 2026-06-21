const API = 'http://localhost:3001/api/v1';
export const notificationsService = {
  async getAll() { const res = await fetch(`${API}/notifications`, { headers: { 'x-user-id': 'demo' } }); return res.json(); },
  async markRead(id: string) { const res = await fetch(`${API}/notifications/${id}/read`, { method: 'POST', headers: { 'x-user-id': 'demo' } }); return res.json(); },
  async unreadCount() { const res = await fetch(`${API}/notifications/unread-count`, { headers: { 'x-user-id': 'demo' } }); return res.json(); },
};

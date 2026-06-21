import { Injectable } from '@nestjs/common';

@Injectable()
export class SocialService {
  private posts: any[] = [];
  private likes = new Map<string, Set<string>>();

  getFeed(page = 1, limit = 10) {
    return { data: this.posts.slice((page - 1) * limit, page * limit), meta: { page, limit, total: this.posts.length } };
  }

  createPost(userId: string, data: { content?: string; photos?: string[]; placeId?: string; tripId?: string }) {
    const post = { id: `post-${Date.now()}`, userId, ...data, likeCount: 0, commentCount: 0, createdAt: new Date().toISOString() };
    this.posts.unshift(post);
    return { data: post };
  }

  toggleLike(postId: string, userId: string) {
    if (!this.likes.has(postId)) this.likes.set(postId, new Set());
    const set = this.likes.get(postId)!;
    set.has(userId) ? set.delete(userId) : set.add(userId);
    return { data: { liked: set.has(userId), count: set.size } };
  }

  getUserPosts(userId: string) {
    return { data: this.posts.filter(p => p.userId === userId) };
  }
}

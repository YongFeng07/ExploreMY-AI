import { Injectable } from '@nestjs/common';
@Injectable()
export class PhotosService {
  getForPlace(placeId: string) { return { data: [{ id:'p1', url:'https://via.placeholder.com/400', userId:'u1', placeId }] }; }
  upload(userId: string, placeId: string, url: string) { return { data: { id: `photo-${Date.now()}`, userId, placeId, url, createdAt: new Date().toISOString() } }; }
  getForUser(userId: string) { return { data: [] }; }
}

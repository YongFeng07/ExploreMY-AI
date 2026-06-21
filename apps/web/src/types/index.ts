export interface Place { id: string; name: string; category: string; rating: number; reviewCount: number; photos: string[]; address: string; lat: number; lng: number; priceLevel?: number; isOpen: boolean; distance?: number; }
export interface Trip { id: string; title: string; destinationCity: string; startDate: string; endDate: string; budget?: number; status: string; dayCount: number; totalCost?: number; }
export interface UserProfile { id: string; displayName: string; avatarUrl?: string; bio?: string; level: number; }
export interface ApiResponse<T> { data: T; meta?: { page: number; limit: number; total: number; totalPages: number }; }

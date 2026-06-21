import { z } from 'zod';

export const placeSearchSchema = z.object({
  query: z.string().min(1).max(200),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radius: z.number().min(100).max(50000).optional().default(5000),
  category: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
});

export const reviewCreateSchema = z.object({
  placeId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(255).optional(),
  content: z.string().min(10).max(5000),
  tags: z.array(z.string()).max(10).optional(),
  photos: z.array(z.string().url()).max(10).optional(),
});

export const tripCreateSchema = z.object({
  title: z.string().min(1).max(255),
  destinationCity: z.string().min(1).max(100),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  budget: z.number().positive().max(100000).optional(),
  travelStyle: z.string().optional(),
});

export type PlaceSearchInput = z.infer<typeof placeSearchSchema>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type TripCreateInput = z.infer<typeof tripCreateSchema>;

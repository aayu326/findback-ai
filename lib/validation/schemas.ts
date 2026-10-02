import { z } from 'zod';
import { CATEGORIES, ORG_TYPES } from '@/lib/constants';

const opt = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));
export const reportSchema = z.object({
  title: z.string().trim().min(2, 'Give the item a name').max(120),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Choose a category' }) }),
  description: opt(1500), color: opt(40), brand: opt(60), model: opt(60),
  location_id: z.string().uuid().optional().or(z.literal('')),
  location_text: opt(160),
  occurred_at: z.string().min(1, 'Date & time is required'),
  distinctive_features: opt(800),
  private_details: opt(1000),
  storage_note: opt(160),
});
export type ReportInput = z.infer<typeof reportSchema>;

export const claimSchema = z.object({
  found_item_id: z.string().uuid(),
  lost_item_id: z.string().uuid().optional().or(z.literal('')),
  match_id: z.string().uuid().optional().or(z.literal('')),
  describe: z.string().trim().min(10, 'Describe the item in your own words (min 10 chars)').max(1500),
  identifiers: opt(500),
  lost_when_where: z.string().trim().min(3, 'Tell us when and where you lost it').max(500),
  message: opt(800),
});
export type ClaimInput = z.infer<typeof claimSchema>;

export const authSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your name').optional(),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
export const orgSchema = z.object({ name: z.string().trim().min(2).max(100), type: z.enum(ORG_TYPES) });
export const MAX_IMAGE = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

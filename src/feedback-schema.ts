import { z } from "zod";

/**
 * Vendor feedback: a 0 to 10 score and an optional note. Shared by paykit,
 * printkit, stockkit and merqo. qkit's own schema adds customer-order fields
 * (source, boothId, orderNumber, token, rating) and stays local.
 */
export const feedbackSchema = z.object({
  nps: z.number().int().min(0).max(10),
  message: z.string().trim().max(2000).optional(),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;

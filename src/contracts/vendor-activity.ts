import { z } from "zod";

export const INCIDENT_KINDS = [
  "payment_callback_failed",
  "payment_claim_stuck",
  "print_failed",
  "print_stuck",
  "webhook_rejected",
  "action_error",
] as const;

export type IncidentKind = (typeof INCIDENT_KINDS)[number];

const incidentKindSchema = z.enum(INCIDENT_KINDS);

/** Triage bands every kit's vendor-health module reports. `expiring` is qkit-only. */
export const vendorStatusSchema = z.enum([
  "attention",
  "expiring",
  "stuck",
  "quiet",
  "new",
  "healthy",
]);

export type VendorActivityStatus = z.infer<typeof vendorStatusSchema>;

/**
 * Payload a kit returns from its Merqo vendor-activity endpoint. `incidents`
 * and `recent` are optional so a kit that does not report them yet stays valid.
 */
export const vendorActivityPayloadSchema = z.object({
  active: z.boolean(),
  plan: z.enum(["free", "pro"]).nullable(),
  status: vendorStatusSchema.nullable(),
  metrics: z.array(z.object({ label: z.string(), value: z.string() })),
  lastActivityAt: z.string().nullable(),
  incidents: z
    .array(
      z.object({
        kind: incidentKindSchema,
        count: z.number().int().nonnegative(),
        lastAt: z.string(),
      }),
    )
    .optional(),
  recent: z
    .array(
      z.object({
        kind: incidentKindSchema,
        ref: z.string(),
        code: z.string(),
        at: z.string(),
      }),
    )
    .max(10)
    .optional(),
});

export type VendorActivityPayload = z.infer<typeof vendorActivityPayloadSchema>;

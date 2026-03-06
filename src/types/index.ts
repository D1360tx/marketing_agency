import { z } from "zod";

// Prospect / Lead
export const prospectStatusValues = [
  "new",
  "contacted",
  "interested",
  "follow_up",
  "client",
  "not_interested",
  "lost",
] as const;

export type ProspectStatus = (typeof prospectStatusValues)[number];

export const prospectSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  business_name: z.string(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website_url: z.string().nullable(),
  google_maps_url: z.string().nullable(),
  rating: z.number().nullable(),
  review_count: z.number().nullable(),
  business_type: z.string().nullable(),
  search_query: z.string().nullable(),
  status: z.enum(prospectStatusValues),
  notes: z.string().nullable(),
  follow_up_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Prospect = z.infer<typeof prospectSchema>;

// Website Analysis
export const websiteGradeValues = ["A", "B", "C", "D", "F"] as const;
export type WebsiteGrade = (typeof websiteGradeValues)[number];

export const websiteAnalysisSchema = z.object({
  id: z.string().uuid(),
  prospect_id: z.string().uuid(),
  performance_score: z.number().nullable(),
  accessibility_score: z.number().nullable(),
  best_practices_score: z.number().nullable(),
  seo_score: z.number().nullable(),
  has_ssl: z.boolean().nullable(),
  is_mobile_friendly: z.boolean().nullable(),
  load_time_ms: z.number().nullable(),
  has_viewport_meta: z.boolean().nullable(),
  technology_stack: z.record(z.string(), z.unknown()).nullable(),
  overall_grade: z.enum(websiteGradeValues).nullable(),
  raw_data: z.record(z.string(), z.unknown()).nullable(),
  analyzed_at: z.string(),
});

export type WebsiteAnalysis = z.infer<typeof websiteAnalysisSchema>;

// Campaign
export const campaignStatusValues = [
  "draft",
  "active",
  "paused",
  "completed",
] as const;
export type CampaignStatus = (typeof campaignStatusValues)[number];

export const campaignSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  type: z.enum(["email", "sms"]),
  subject_template: z.string().nullable(),
  body_template: z.string(),
  status: z.enum(campaignStatusValues),
  sent_count: z.number(),
  open_count: z.number(),
  reply_count: z.number(),
  created_at: z.string(),
});

export type Campaign = z.infer<typeof campaignSchema>;

// Campaign Message
export const messageStatusValues = [
  "pending",
  "sent",
  "delivered",
  "opened",
  "replied",
  "bounced",
  "failed",
] as const;

export const campaignMessageSchema = z.object({
  id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  prospect_id: z.string().uuid(),
  channel: z.enum(["email", "sms"]),
  to_address: z.string(),
  subject: z.string().nullable(),
  body: z.string(),
  status: z.enum(messageStatusValues),
  sent_at: z.string().nullable(),
  opened_at: z.string().nullable(),
  replied_at: z.string().nullable(),
  error_message: z.string().nullable(),
});

export type CampaignMessage = z.infer<typeof campaignMessageSchema>;

// User Settings
export const userSettingsSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  brave_api_key: z.string().nullable(),
  outscraper_api_key: z.string().nullable(),
  google_pagespeed_key: z.string().nullable(),
  hunter_api_key: z.string().nullable(),
  resend_api_key: z.string().nullable(),
  twilio_account_sid: z.string().nullable(),
  twilio_auth_token: z.string().nullable(),
  twilio_phone_number: z.string().nullable(),
  sender_email: z.string().nullable(),
  sender_name: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

// Prospect with analysis joined
export type ProspectWithAnalysis = Prospect & {
  website_analyses?: WebsiteAnalysis[];
};

// Search params
export const searchParamsSchema = z.object({
  query: z.string().min(1, "Business type is required"),
  location: z.string().min(1, "Location is required"),
  limit: z.number().min(1).max(100).default(20),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

// --- Validation schemas for PATCH/POST endpoints ---

export const prospectUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(prospectStatusValues).optional(),
  notes: z.string().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  follow_up_date: z.string().nullable().optional(),
});

export const campaignUpdateSchema = z.object({
  status: z.enum(campaignStatusValues).optional(),
  name: z.string().min(1).optional(),
  subject_template: z.string().nullable().optional(),
  body_template: z.string().optional(),
});

export const campaignCreateSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  type: z.enum(["email", "sms"]),
  subject_template: z.string().nullable().optional(),
  body_template: z.string().min(1, "Body template is required"),
});

// --- Drip Sequences ---

export const dripSequenceStatusValues = [
  "draft",
  "active",
  "paused",
  "archived",
] as const;
export type DripSequenceStatus = (typeof dripSequenceStatusValues)[number];

export const dripSequenceSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  channel: z.enum(["email", "sms"]),
  status: z.enum(dripSequenceStatusValues),
  created_at: z.string(),
  updated_at: z.string(),
});

export type DripSequence = z.infer<typeof dripSequenceSchema>;

export const dripStepSchema = z.object({
  id: z.string().uuid(),
  sequence_id: z.string().uuid(),
  step_order: z.number(),
  delay_days: z.number(),
  subject_template: z.string().nullable(),
  body_template: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type DripStep = z.infer<typeof dripStepSchema>;

export const dripEnrollmentStatusValues = [
  "active",
  "paused",
  "completed",
  "cancelled",
] as const;

export const dripEnrollmentSchema = z.object({
  id: z.string().uuid(),
  sequence_id: z.string().uuid(),
  prospect_id: z.string().uuid(),
  user_id: z.string().uuid(),
  current_step: z.number(),
  status: z.enum(dripEnrollmentStatusValues),
  enrolled_at: z.string(),
  last_sent_at: z.string().nullable(),
  next_send_at: z.string().nullable(),
  completed_at: z.string().nullable(),
});

export type DripEnrollment = z.infer<typeof dripEnrollmentSchema>;

export const dripMessageSchema = z.object({
  id: z.string().uuid(),
  enrollment_id: z.string().uuid(),
  step_id: z.string().uuid(),
  prospect_id: z.string().uuid(),
  user_id: z.string().uuid(),
  channel: z.enum(["email", "sms"]),
  to_address: z.string(),
  subject: z.string().nullable(),
  body: z.string(),
  status: z.enum(messageStatusValues),
  sent_at: z.string().nullable(),
  opened_at: z.string().nullable(),
  replied_at: z.string().nullable(),
  error_message: z.string().nullable(),
  created_at: z.string(),
});

export type DripMessage = z.infer<typeof dripMessageSchema>;

export type DripSequenceWithSteps = DripSequence & {
  drip_steps?: DripStep[];
};

export const dripSequenceCreateSchema = z.object({
  name: z.string().min(1, "Sequence name is required"),
  description: z.string().nullable().optional(),
  channel: z.enum(["email", "sms"]),
  steps: z.array(
    z.object({
      delay_days: z.number().min(0),
      subject_template: z.string().nullable().optional(),
      body_template: z.string().min(1, "Step body is required"),
    })
  ).min(1, "At least one step is required"),
});

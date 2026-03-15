import { z } from 'zod';

/** Server-spec §2.1 — Package descriptor from flapi search (Type filtered to "Package") */
export const packageDescriptorSchema = z.object({
  Id: z.number(),
  Logo: z.string(),
  Name: z.string(),
  Type: z.literal('Package'),
});
export type PackageDescriptor = z.infer<typeof packageDescriptorSchema>;

/** Server-spec §2.1 — Flapi run response */
export const flapiRunResponseSchema = z.object({
  results: z.record(z.string(), z.array(z.unknown())),
});
export type FlapiRunResponse = z.infer<typeof flapiRunResponseSchema>;

/** Server-spec §3.1 — Lib descriptor */
export const libDescriptorSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['js', 'css', 'js-css']),
  files: z.object({
    js: z.string().optional(),
    css: z.string().optional(),
  }),
});
export type LibDescriptor = z.infer<typeof libDescriptorSchema>;

/** Server-spec §4.1 — Generate request */
export const fieldExplanationSchema = z.object({
  fieldName: z.string(),
  explanation: z.string().max(100),
});
export const generateRequestSchema = z.object({
  fieldExplanations: z.array(fieldExplanationSchema).max(16),
  userPrompt: z.string().min(1),
  mainCubeName: z.string().min(1),
  mainCubeData: z.array(z.unknown()),
  librariesUsed: z.array(z.string()).optional(),
  modelId: z.string().optional(),
});
export type GenerateRequest = z.infer<typeof generateRequestSchema>;

/** Server-spec §4.1 — Generate response */
export const generateResponseSchema = z.object({
  runId: z.string(),
  htmlSnippet: z.string(),
  librariesUsed: z.array(z.string()),
});
export type GenerateResponse = z.infer<typeof generateResponseSchema>;

/** Server-spec §4.2 — Feedback request */
export const feedbackRequestSchema = z.object({
  runId: z.string().min(1),
  feedback: z.string().min(1),
  modelId: z.string().optional(),
});
export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;

/** Server-spec §5 — Error body */
export const errorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ErrorBody = z.infer<typeof errorBodySchema>;

/** GET /api/config — baseUrl, iframeDataEvent */
export const configSchema = z.object({
  baseUrl: z.string(),
  iframeDataEvent: z.string(),
});
export type Config = z.infer<typeof configSchema>;

/** GET /api/models — list of available models */
export const modelDescriptorSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
});
export type ModelDescriptor = z.infer<typeof modelDescriptorSchema>;

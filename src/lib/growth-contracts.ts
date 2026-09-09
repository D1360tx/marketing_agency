import observationSchema from "../../schemas/growth/v1/observation.schema.json" with { type: "json" };
import evidenceSchema from "../../schemas/growth/v1/evidence-block.schema.json" with { type: "json" };
import actionSchema from "../../schemas/growth/v1/action-candidate.schema.json" with { type: "json" };

export type SourceStatus = "verified" | "unavailable" | "blocked" | "not_due" | "stale";
export type Classification = "MAPS_NEAR_WIN" | "RANKING_GAP" | "DIRECTORY_DEPENDENT" | "TOP_3_WINNER" | "QUERY_MISMATCH";
export type Channel = "maps" | "organic";
export interface Geography { city: string; region: string; country: string }
export interface ProspectIdentity {
  tenant_id: string;
  subject_id: string;
  business_name: string;
  website_url: string;
  maps_url: string;
}
export interface SerpResult { position: number; name: string; url: string; kind: "business" | "directory" }
export interface Observation {
  schema_version: "1.0.0";
  observation_id: string;
  tenant_id: string;
  subject_type: "prospect";
  subject_id: string;
  identity: ProspectIdentity;
  source_type: "cached_local_serp";
  source_url: string;
  source_status: SourceStatus;
  observed_at: string;
  expires_at: string;
  query: string;
  geography: Geography;
  device: "desktop" | "mobile";
  language: string;
  channel: Channel;
  value: { depth: number; complete: true; results: SerpResult[] } | null;
  confidence: number;
  limitations: string[];
  collector_version: string;
}
export interface EvidenceBlock {
  schema_version: "1.0.0";
  evidence_id: string;
  identity: ProspectIdentity;
  query: string;
  geography: Geography;
  evaluated_at: string;
  expires_at: string;
  classification: Classification | null;
  eligible: boolean;
  reasons: string[];
  observations: Observation[];
  maps_position: number | null;
  organic_position: number | null;
  competitors: (SerpResult & { channel: Channel })[];
  calculation_method: "bounded-serp-v1; no impact estimate";
  allowed_wording: string;
  prohibited_inference: string[];
}
export interface ActionCandidate {
  schema_version: "1.0.0";
  action_id: string;
  tenant_id: string;
  subject_type: "prospect" | "client";
  subject_id: string;
  affected_url: string;
  evidence_ids: string[];
  problem: string;
  expected_mechanism: string;
  priority: "low" | "medium" | "high";
  confidence: number;
  proposed_action: string;
  owner: string;
  dependencies: string[];
  verification_method: string;
  rollback: string | null;
  approval_required: true;
  status: "proposed" | "approved" | "executing" | "verified" | "rejected" | "expired" | "blocked";
}

export interface Schema {
  $ref?: string;
  const?: unknown;
  enum?: unknown[];
  anyOf?: Schema[];
  type?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: Schema;
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  format?: string;
}
export const growthSchemas: Record<string, Schema> = {
  "observation.schema.json": observationSchema,
  "evidence-block.schema.json": evidenceSchema,
  "action-candidate.schema.json": actionSchema,
};
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Restrict this version to unambiguous, round-trippable UTC timestamps.
export function validTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}
export function validPublicUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && !!url.hostname && !url.username && !url.password && !/[\s\u0000-\u001f\u007f]/u.test(value);
  } catch { return false; }
}

/** Dependency-free evaluator for the exact schema vocabulary checked in above.
 * Not a general JSON Schema implementation; never loads remote refs or URLs.
 */
export function validateShape(schema: Schema, value: unknown, path = "$ ".trim()): string[] {
  if (schema.$ref) {
    const target = growthSchemas[schema.$ref];
    if (!target) throw new Error(`Unsupported schema reference: ${schema.$ref}`);
    return validateShape(target, value, path);
  }
  const errors: string[] = [];
  const fail = (code: string) => { errors.push(`${path}:${code}`); };
  if ("const" in schema && value !== schema.const) fail("const");
  if (schema.enum && !schema.enum.includes(value)) fail("enum");
  if (schema.anyOf && !schema.anyOf.some((part) => validateShape(part, value, path).length === 0)) fail("anyOf");
  if (schema.type) {
    const matches = schema.type === "null" ? value === null
      : schema.type === "object" ? isRecord(value)
      : schema.type === "array" ? Array.isArray(value)
      : schema.type === "integer" ? Number.isInteger(value)
      : typeof value === schema.type;
    if (!matches) return [...errors, `${path}:type`];
  }
  if (isRecord(value) && schema.properties) {
    for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) fail(`required:${key}`);
    for (const [key, item] of Object.entries(value)) {
      if (Object.hasOwn(schema.properties, key)) errors.push(...validateShape(schema.properties[key], item, `${path}.${key}`));
      else if (schema.additionalProperties === false) fail(`unknown:${key}`);
    }
  }
  if (Array.isArray(value)) {
    if (value.length < (schema.minItems ?? 0) || value.length > (schema.maxItems ?? Infinity)) fail("items_count");
    if (schema.items) value.forEach((item, index) => errors.push(...validateShape(schema.items!, item, `${path}[${index}]`)));
  }
  if (typeof value === "string") {
    if (value.length < (schema.minLength ?? 0) || value.length > (schema.maxLength ?? Infinity)) fail("length");
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) fail("pattern");
    if (schema.format === "date-time" && !validTimestamp(value)) fail("date-time");
    if (schema.format === "uri" && !validPublicUrl(value)) fail("uri");
    if (value !== value.trim() || /[\u0000-\u001f\u007f]/u.test(value)) fail("unsafe_text");
  }
  if (typeof value === "number" && (!Number.isFinite(value) || value < (schema.minimum ?? -Infinity) || value > (schema.maximum ?? Infinity))) fail("range");
  return errors;
}
export function validateContract(name: "observation" | "evidence-block" | "action-candidate", value: unknown): string[] {
  return validateShape(growthSchemas[`${name}.schema.json`], value);
}

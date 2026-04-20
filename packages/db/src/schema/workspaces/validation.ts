import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { allPlans, selfHostLimitsOverride } from "../plan/config";
import { limitsSchema } from "../plan/schema";
import { workspacePlans, workspaceRole } from "./constants";
import { workspace } from "./workspace";

const isSelfHost = process.env.SELF_HOST === "true";

export const workspacePlanSchema = z.enum(workspacePlans);
export const workspaceRoleSchema = z.enum(workspaceRole);

/**
 * Workspace schema with limits and plan
 */
export const selectWorkspaceSchema = createSelectSchema(workspace)
  .extend({
    limits: z.string().transform((val) => {
      try {
        const parsed = JSON.parse(val);

        // Only validate properties that are actually present in the parsed object
        // This avoids triggering .prefault() for missing properties
        const validated: Record<string, unknown> = {};
        const limitsShape = limitsSchema.shape;

        for (const key in parsed) {
          if (key in limitsShape) {
            // Validate only the properties that exist in the parsed object
            const propertySchema = limitsShape[key as keyof typeof limitsShape];
            const result = propertySchema.safeParse(parsed[key]);
            if (result.success) {
              validated[key] = result.data;
            } else {
              console.warn(`Invalid value for limits.${key}:`, result.error);
              // Skip invalid properties instead of failing entirely
            }
          }
          // Unknown properties are ignored
        }

        return validated;
      } catch (error) {
        console.error("Error parsing limits:", error);
        return {};
      }
    }),
    plan: z
      .enum(workspacePlans)
      .nullable()
      .prefault("free")
      .transform((val) => val ?? "free"),
    // REMINDER: workspace usage
    usage: z
      .object({
        monitors: z.number().prefault(0),
        notifications: z.number().prefault(0),
        pages: z.number().prefault(0),
        pageComponents: z.number().prefault(0),
        // checks: z.number().default(0),
      })
      .nullish(),
  })
  .transform((val) => {
    // Self-hosted instances always run on the "team" plan with limits matching
    // the self-hosting docs (see apps/docs/.../self-hosting-openstatus.mdx).
    const plan = isSelfHost ? "team" : val.plan;
    // 315360000s ≈ 10 years; matches the self-hosting docs curl.
    const paidUntil = isSelfHost
      ? new Date(Date.now() + 315_360_000 * 1000)
      : val.paidUntil;
    const endsAt = isSelfHost ? null : val.endsAt;
    return {
      ...val,
      plan,
      paidUntil,
      endsAt,
      limits: limitsSchema.parse({
        ...allPlans[plan].limits,
        ...(isSelfHost ? selfHostLimitsOverride : {}),
        /**
         * override the default plan limits
         * allows us to set custom limits for a workspace
         */
        ...val.limits,
      }),
    };
  });

export const insertWorkspaceSchema = createSelectSchema(workspace);

export type Workspace = z.infer<typeof selectWorkspaceSchema>;
export type WorkspacePlan = z.infer<typeof workspacePlanSchema>;
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  items: defineTable({
    userId: v.id("users"),
    title: v.string(),
    episode: v.string(),
    link: v.string(),
    status: v.string(), // "current" or "watched"
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),
});

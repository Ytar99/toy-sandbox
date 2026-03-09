import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function getUserId(ctx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export const addItem = mutation({
  args: {
    title: v.string(),
    episode: v.string(),
    link: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    await ctx.db.insert("items", {
      userId,
      title: args.title,
      episode: args.episode,
      link: args.link,
      status: "current",
    });
  },
});

export const updateItem = mutation({
  args: {
    itemId: v.id("items"),
    title: v.optional(v.string()),
    episode: v.optional(v.string()),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");
    if (item.userId !== userId) throw new Error("Not authorized");
    const patch = {};
    if (args.title !== undefined) patch.title = args.title;
    if (args.episode !== undefined) patch.episode = args.episode;
    if (args.link !== undefined) patch.link = args.link;
    await ctx.db.patch(args.itemId, patch);
  },
});

export const deleteItem = mutation({
  args: {
    itemId: v.id("items"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");
    if (item.userId !== userId) throw new Error("Not authorized");
    await ctx.db.delete(args.itemId);
  },
});

export const markWatched = mutation({
  args: {
    itemId: v.id("items"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");
    if (item.userId !== userId) throw new Error("Not authorized");
    if (item.status !== "current") throw new Error("Item is not current");
    await ctx.db.patch(args.itemId, { status: "watched" });
  },
});

export const getCurrentItems = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("items")
      .withIndex("by_status", (q) => q.eq("status", "current"))
      .collect();
    return await Promise.all(
      items.map(async (item) => {
        const user = await ctx.db.get(item.userId);
        return {
          ...item,
          userName: user?.name ?? user?.email ?? "Unknown",
        };
      }),
    );
  },
});

export const getHistoryItems = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("items")
      .withIndex("by_status", (q) => q.eq("status", "watched"))
      .order("desc")
      .collect();
    return await Promise.all(
      items.map(async (item) => {
        const user = await ctx.db.get(item.userId);
        return {
          ...item,
          userName: user?.name ?? user?.email ?? "Unknown",
        };
      }),
    );
  },
});

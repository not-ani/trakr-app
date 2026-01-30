import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireCurrentUser, isValidUsername } from "./lib/helpers";

export const getOrCreate = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser) {
      // Update email if changed
      if (existingUser.email !== identity.email) {
        await ctx.db.patch(existingUser._id, { email: identity.email ?? "" });
      }
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? "",
      displayName: identity.name,
      avatarUrl: identity.pictureUrl,
    });

    return userId;
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    return getCurrentUser(ctx);
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username.toLowerCase()))
      .unique();

    if (!user) return null;

    // Return public info only
    return {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    const updates: Partial<{
      displayName: string;
      avatarUrl: string;
      timezone: string;
    }> = {};

    if (args.displayName !== undefined) {
      updates.displayName = args.displayName;
    }
    if (args.avatarUrl !== undefined) {
      updates.avatarUrl = args.avatarUrl;
    }
    if (args.timezone !== undefined) {
      updates.timezone = args.timezone;
    }

    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});

export const setUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const username = args.username.toLowerCase();

    if (!isValidUsername(username)) {
      throw new Error("Username must be 3-20 characters, alphanumeric and underscores only");
    }

    // Check if username is taken
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    if (existing && existing._id !== user._id) {
      throw new Error("Username already taken");
    }

    await ctx.db.patch(user._id, { username });
    return user._id;
  },
});

export const checkUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const username = args.username.toLowerCase();

    if (!isValidUsername(username)) {
      return { available: false, reason: "Invalid format" };
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();

    return { available: !existing };
  },
});

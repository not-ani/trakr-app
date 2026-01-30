import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser, areFriends, countNudgesToday } from "./lib/helpers";
import { Id } from "./_generated/dataModel";

const MAX_NUDGES_PER_DAY = 3;

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const limit = args.limit ?? 50;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user.userId))
      .order("desc")
      .take(limit);

    // Add habit info and fromUserId (frontend will fetch sender data via Clerk)
    const enriched = await Promise.all(
      notifications.map(async (notification) => {
        let habit = null;
        if (notification.habitId) {
          const h = await ctx.db.get(notification.habitId);
          if (h) {
            habit = {
              _id: h._id,
              name: h.name,
              icon: h.icon,
              color: h.color,
            };
          }
        }

        return {
          ...notification,
          fromUserId: notification.fromUserId,
          habit,
        };
      })
    );

    return enriched;
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", user.userId).eq("read", false)
      )
      .collect();

    return unread.length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.userId !== user.userId) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.notificationId, { read: true });
    return args.notificationId;
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", user.userId).eq("read", false)
      )
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { read: true });
    }

    return unread.length;
  },
});

export const sendNudge = mutation({
  args: {
    toUserId: v.string(),
    habitId: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    // Verify they are friends
    const isFriend = await areFriends(ctx, user.userId, args.toUserId);
    if (!isFriend) {
      throw new Error("Not friends");
    }

    // Check nudge limit
    const nudgeCount = await countNudgesToday(ctx, user.userId, args.toUserId);
    if (nudgeCount >= MAX_NUDGES_PER_DAY) {
      throw new Error(`You can only send ${MAX_NUDGES_PER_DAY} nudges per day to each friend`);
    }

    // If habitId provided, verify it belongs to the target user and is public
    if (args.habitId) {
      const habit = await ctx.db.get(args.habitId as Id<"habits">);
      if (!habit || habit.userId !== args.toUserId || !habit.isPublic) {
        throw new Error("Habit not found");
      }
    }

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.toUserId,
      fromUserId: user.userId,
      type: "nudge",
      habitId: args.habitId as Id<"habits"> | undefined,
      message: args.message,
      read: false,
    });

    return notificationId;
  },
});

export const sendCelebration = mutation({
  args: {
    toUserId: v.string(),
    habitId: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    // Verify they are friends
    const isFriend = await areFriends(ctx, user.userId, args.toUserId);
    if (!isFriend) {
      throw new Error("Not friends");
    }

    // If habitId provided, verify it belongs to the target user and is public
    if (args.habitId) {
      const habit = await ctx.db.get(args.habitId as Id<"habits">);
      if (!habit || habit.userId !== args.toUserId || !habit.isPublic) {
        throw new Error("Habit not found");
      }
    }

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.toUserId,
      fromUserId: user.userId,
      type: "celebration",
      habitId: args.habitId as Id<"habits"> | undefined,
      message: args.message,
      read: false,
    });

    return notificationId;
  },
});

export const createStreakMilestone = mutation({
  args: {
    userId: v.string(),
    habitId: v.id("habits"),
    streak: v.number(),
  },
  handler: async (ctx, args) => {
    // This would typically be called by a cron job or internal function
    // For now, it's a utility function

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "streak_milestone",
      habitId: args.habitId,
      message: `You've reached a ${args.streak} day streak!`,
      read: false,
    });

    return notificationId;
  },
});

export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.userId !== user.userId) {
      throw new Error("Notification not found");
    }

    await ctx.db.delete(args.notificationId);
    return args.notificationId;
  },
});

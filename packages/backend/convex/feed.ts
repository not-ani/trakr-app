import { v } from "convex/values";
import { query } from "./_generated/server";
import {
  requireCurrentUser,
  areFriends,
  getDateString,
  calculateStreak,
  getDayOfWeek,
} from "./lib/helpers";
import { Id } from "./_generated/dataModel";

export const getFriendActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const limit = args.limit ?? 50;

    // Get all friends
    const asRequester = await ctx.db
      .query("friendships")
      .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const asAddressee = await ctx.db
      .query("friendships")
      .withIndex("by_addressee_status", (q) =>
        q.eq("addresseeId", user._id).eq("status", "accepted")
      )
      .collect();

    const friendIds = [
      ...asRequester.map((f) => f.addresseeId),
      ...asAddressee.map((f) => f.requesterId),
    ];

    if (friendIds.length === 0) {
      return [];
    }

    // Get recent habit completions from friends
    const today = getDateString();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = getDateString(weekAgo);

    const activities: Array<{
      type: "completion";
      userId: Id<"users">;
      user: { displayName?: string; username?: string; avatarUrl?: string };
      habitName: string;
      habitColor?: string;
      habitIcon?: string;
      date: string;
      timestamp: number;
    }> = [];

    for (const friendId of friendIds) {
      const friend = await ctx.db.get(friendId);
      if (!friend) continue;

      // Get friend's public habits
      const habits = await ctx.db
        .query("habits")
        .withIndex("by_user_active", (q) =>
          q.eq("userId", friendId).eq("isArchived", false)
        )
        .filter((q) => q.eq(q.field("isPublic"), true))
        .collect();

      for (const habit of habits) {
        const logs = await ctx.db
          .query("habitLogs")
          .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
          .filter((q) =>
            q.and(
              q.gte(q.field("date"), weekAgoStr),
              q.lte(q.field("date"), today),
              q.eq(q.field("completed"), true)
            )
          )
          .collect();

        for (const log of logs) {
          activities.push({
            type: "completion",
            userId: friendId,
            user: {
              displayName: friend.displayName,
              username: friend.username,
              avatarUrl: friend.avatarUrl,
            },
            habitName: habit.name,
            habitColor: habit.color,
            habitIcon: habit.icon,
            date: log.date,
            timestamp: log.completedAt ?? log._creationTime,
          });
        }
      }
    }

    // Sort by timestamp descending
    activities.sort((a, b) => b.timestamp - a.timestamp);

    return activities.slice(0, limit);
  },
});

export const getFriendProgress = query({
  args: { friendId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    // Verify they are friends
    const isFriend = await areFriends(ctx, user._id, args.friendId);
    if (!isFriend) {
      throw new Error("Not friends");
    }

    const friend = await ctx.db.get(args.friendId);
    if (!friend) {
      throw new Error("User not found");
    }

    const today = getDateString();
    const todayDow = getDayOfWeek();

    // Get friend's public habits
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", args.friendId).eq("isArchived", false)
      )
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();

    // Get today's status for each habit
    const habitsWithStatus = await Promise.all(
      habits.map(async (habit) => {
        const isScheduledToday = habit.scheduleDays.includes(todayDow);

        const log = await ctx.db
          .query("habitLogs")
          .withIndex("by_habit_date", (q) =>
            q.eq("habitId", habit._id).eq("date", today)
          )
          .unique();

        const streak = await calculateStreak(ctx, habit._id);

        return {
          _id: habit._id,
          name: habit.name,
          icon: habit.icon,
          color: habit.color,
          isScheduledToday,
          completedToday: log?.completed ?? false,
          streak,
        };
      })
    );

    // Filter to only today's habits
    const todaysHabits = habitsWithStatus.filter((h) => h.isScheduledToday);

    return {
      friend: {
        _id: friend._id,
        displayName: friend.displayName,
        username: friend.username,
        avatarUrl: friend.avatarUrl,
      },
      todaysHabits,
      allPublicHabits: habitsWithStatus,
    };
  },
});

export const getFriendStreaks = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);

    // Get all friends
    const asRequester = await ctx.db
      .query("friendships")
      .withIndex("by_requester", (q) => q.eq("requesterId", user._id))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const asAddressee = await ctx.db
      .query("friendships")
      .withIndex("by_addressee_status", (q) =>
        q.eq("addresseeId", user._id).eq("status", "accepted")
      )
      .collect();

    const friendIds = [
      ...asRequester.map((f) => f.addresseeId),
      ...asAddressee.map((f) => f.requesterId),
    ];

    // Get streak data for each friend
    const friendStreaks = await Promise.all(
      friendIds.map(async (friendId) => {
        const friend = await ctx.db.get(friendId);
        if (!friend) return null;

        // Get friend's public habits
        const habits = await ctx.db
          .query("habits")
          .withIndex("by_user_active", (q) =>
            q.eq("userId", friendId).eq("isArchived", false)
          )
          .filter((q) => q.eq(q.field("isPublic"), true))
          .collect();

        // Calculate max streak
        let maxStreak = 0;
        let totalStreak = 0;

        for (const habit of habits) {
          const streak = await calculateStreak(ctx, habit._id);
          maxStreak = Math.max(maxStreak, streak);
          totalStreak += streak;
        }

        return {
          friend: {
            _id: friend._id,
            displayName: friend.displayName,
            username: friend.username,
            avatarUrl: friend.avatarUrl,
          },
          maxStreak,
          totalStreak,
          habitCount: habits.length,
        };
      })
    );

    // Filter nulls and sort by max streak
    return friendStreaks
      .filter(Boolean)
      .sort((a, b) => (b?.maxStreak ?? 0) - (a?.maxStreak ?? 0));
  },
});

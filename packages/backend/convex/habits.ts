import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireCurrentUser,
  getDateString,
  getDayOfWeek,
  calculateStreak,
  addDays,
} from "./lib/helpers";

export const list = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    if (args.includeArchived) {
      return ctx.db
        .query("habits")
        .withIndex("by_user", (q) => q.eq("userId", user.userId))
        .collect();
    }

    return ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user.userId).eq("isArchived", false),
      )
      .collect();
  },
});

export const get = query({
  args: { id: v.id("habits") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const habit = await ctx.db.get(args.id);

    if (!habit || habit.userId !== user.userId) {
      return null;
    }

    return habit;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    scheduleDays: v.array(v.number()),
    reminderTime: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);

    // Validate scheduleDays
    for (const day of args.scheduleDays) {
      if (day < 0 || day > 6) {
        throw new Error("Invalid schedule day");
      }
    }

    const habitId = await ctx.db.insert("habits", {
      userId: user.userId,
      name: args.name,
      description: args.description,
      icon: args.icon,
      color: args.color,
      scheduleDays: args.scheduleDays,
      reminderTime: args.reminderTime,
      isArchived: false,
      isPublic: args.isPublic ?? true,
    });

    return habitId;
  },
});

export const update = mutation({
  args: {
    id: v.id("habits"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    scheduleDays: v.optional(v.array(v.number())),
    reminderTime: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const habit = await ctx.db.get(args.id);

    if (!habit || habit.userId !== user.userId) {
      throw new Error("Habit not found");
    }

    const updates: Partial<{
      name: string;
      description: string;
      icon: string;
      color: string;
      scheduleDays: number[];
      reminderTime: string;
      isPublic: boolean;
    }> = {};

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.icon !== undefined) updates.icon = args.icon;
    if (args.color !== undefined) updates.color = args.color;
    if (args.scheduleDays !== undefined) {
      for (const day of args.scheduleDays) {
        if (day < 0 || day > 6) {
          throw new Error("Invalid schedule day");
        }
      }
      updates.scheduleDays = args.scheduleDays;
    }
    if (args.reminderTime !== undefined)
      updates.reminderTime = args.reminderTime;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const archive = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const habit = await ctx.db.get(args.id);

    if (!habit || habit.userId !== user.userId) {
      throw new Error("Habit not found");
    }

    await ctx.db.patch(args.id, { isArchived: true });
    return args.id;
  },
});

export const unarchive = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const habit = await ctx.db.get(args.id);

    if (!habit || habit.userId !== user.userId) {
      throw new Error("Habit not found");
    }

    await ctx.db.patch(args.id, { isArchived: false });
    return args.id;
  },
});

export const toggleCompletion = mutation({
  args: {
    habitId: v.id("habits"),
    date: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const habit = await ctx.db.get(args.habitId);

    if (!habit || habit.userId !== user.userId) {
      throw new Error("Habit not found");
    }

    const date = args.date ?? getDateString();

    // Check if log exists
    const existingLog = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_date", (q) =>
        q.eq("habitId", args.habitId).eq("date", date),
      )
      .unique();

    if (existingLog) {
      // Toggle completion
      await ctx.db.patch(existingLog._id, {
        completed: !existingLog.completed,
        completedAt: !existingLog.completed ? Date.now() : undefined,
        note: args.note ?? existingLog.note,
      });
      return existingLog._id;
    }

    // Create new log
    const logId = await ctx.db.insert("habitLogs", {
      habitId: args.habitId,
      userId: user.userId,
      date,
      completed: true,
      completedAt: Date.now(),
      note: args.note,
    });

    return logId;
  },
});

export const getTodaysHabits = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);
    const today = getDateString();
    const todayDow = getDayOfWeek();

    // Get active habits scheduled for today
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user.userId).eq("isArchived", false),
      )
      .collect();

    const todaysHabits = habits.filter((h) =>
      h.scheduleDays.includes(todayDow),
    );

    // Get completion status for each
    const habitsWithStatus = await Promise.all(
      todaysHabits.map(async (habit) => {
        const log = await ctx.db
          .query("habitLogs")
          .withIndex("by_habit_date", (q) =>
            q.eq("habitId", habit._id).eq("date", today),
          )
          .unique();

        const streak = await calculateStreak(ctx, habit._id);

        return {
          ...habit,
          completedToday: log?.completed ?? false,
          streak,
        };
      }),
    );

    return habitsWithStatus;
  },
});

export const getCompletionsForRange = query({
  args: {
    habitId: v.id("habits"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const habit = await ctx.db.get(args.habitId);

    if (!habit || habit.userId !== user.userId) {
      throw new Error("Habit not found");
    }

    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate),
        ),
      )
      .collect();

    // Return as a map of date -> completed
    const completions: Record<string, boolean> = {};
    for (const log of logs) {
      completions[log.date] = log.completed;
    }

    return completions;
  },
});

export const getStreak = query({
  args: { habitId: v.id("habits") },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const habit = await ctx.db.get(args.habitId);

    if (!habit || habit.userId !== user.userId) {
      throw new Error("Habit not found");
    }

    return calculateStreak(ctx, args.habitId);
  },
});

export const getWeekCompletions = query({
  args: { habitId: v.optional(v.id("habits")) },
  handler: async (ctx, args) => {
    const user = await requireCurrentUser(ctx);
    const today = getDateString();

    // Get dates for current week (Mon-Sun)
    const todayDate = new Date();
    const dayOfWeek = todayDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(today, mondayOffset + i));
    }

    if (args.habitId) {
      const habit = await ctx.db.get(args.habitId);
      if (!habit || habit.userId !== user.userId) {
        throw new Error("Habit not found");
      }

      const logs = await ctx.db
        .query("habitLogs")
        .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("date"), dates[0]),
            q.lte(q.field("date"), dates[6]),
          ),
        )
        .collect();

      const completions: Record<string, boolean> = {};
      for (const date of dates) {
        const log = logs.find((l) => l.date === date);
        completions[date] = log?.completed ?? false;
      }

      return { dates, completions };
    }

    // Get all completions for all habits
    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", user.userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), dates[0]),
          q.lte(q.field("date"), dates[6]),
        ),
      )
      .collect();

    const completionsByHabit: Record<string, Record<string, boolean>> = {};
    for (const log of logs) {
      if (!completionsByHabit[log.habitId]) {
        completionsByHabit[log.habitId] = {};
      }
      completionsByHabit[log.habitId][log.date] = log.completed;
    }

    return { dates, completionsByHabit };
  },
});

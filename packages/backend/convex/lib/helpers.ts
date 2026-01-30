import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ConvexError } from "convex/values";

// User identity now comes directly from Clerk via ctx.auth.getUserIdentity()
// We no longer maintain a users table - all user data is in Clerk

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // Return the Clerk identity which contains userId (subject), email, name, etc.
  return identity;
}

export async function requireCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await getCurrentUser(ctx);
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }
  return {
    userId: identity.subject, // Clerk user ID
    email: identity.email,
    name: identity.name,
    pictureUrl: identity.pictureUrl,
  };
}

export function getDateString(date?: Date): string {
  const d = date ?? new Date();
  return d.toISOString().split("T")[0];
}

export function getDayOfWeek(date?: Date): number {
  const d = date ?? new Date();
  return d.getDay(); // 0 = Sunday, 6 = Saturday
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDateString(dateStr);
  date.setDate(date.getDate() + days);
  return getDateString(date);
}

export async function calculateStreak(
  ctx: QueryCtx,
  habitId: Id<"habits">,
): Promise<number> {
  const habit = await ctx.db.get(habitId);
  if (!habit) return 0;

  const today = getDateString();
  let streak = 0;
  let currentDate = today;

  // Check if today is a scheduled day - if not, start from yesterday
  const todayDow = getDayOfWeek();
  if (!habit.scheduleDays.includes(todayDow)) {
    currentDate = addDays(currentDate, -1);
  }

  // Walk backwards through scheduled days
  while (true) {
    const currentDow = getDayOfWeek(parseDateString(currentDate));

    // Skip non-scheduled days
    if (!habit.scheduleDays.includes(currentDow)) {
      currentDate = addDays(currentDate, -1);
      continue;
    }

    // Check if this scheduled day was completed
    const log = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_date", (q) =>
        q.eq("habitId", habitId).eq("date", currentDate),
      )
      .unique();

    if (!log || !log.completed) {
      break;
    }

    streak++;
    currentDate = addDays(currentDate, -1);

    // Safety limit
    if (streak > 365) break;
  }

  return streak;
}

export async function areFriends(
  ctx: QueryCtx,
  userId1: string,
  userId2: string,
): Promise<boolean> {
  // Check both directions
  const friendship1 = await ctx.db
    .query("friendships")
    .withIndex("by_pair", (q) =>
      q.eq("requesterId", userId1).eq("addresseeId", userId2),
    )
    .unique();

  if (friendship1?.status === "accepted") return true;

  const friendship2 = await ctx.db
    .query("friendships")
    .withIndex("by_pair", (q) =>
      q.eq("requesterId", userId2).eq("addresseeId", userId1),
    )
    .unique();

  return friendship2?.status === "accepted";
}

export function isValidUsername(username: string): boolean {
  // 3-20 chars, alphanumeric + underscore, case-insensitive
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export async function countNudgesToday(
  ctx: QueryCtx,
  fromUserId: string,
  toUserId: string,
): Promise<number> {
  const today = getDateString();
  const startOfDay = parseDateString(today).getTime();
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

  const nudges = await ctx.db
    .query("notifications")
    .withIndex("by_user", (q) => q.eq("userId", toUserId))
    .filter((q) =>
      q.and(
        q.eq(q.field("type"), "nudge"),
        q.eq(q.field("fromUserId"), fromUserId),
        q.gte(q.field("_creationTime"), startOfDay),
        q.lt(q.field("_creationTime"), endOfDay),
      ),
    )
    .collect();

  return nudges.length;
}

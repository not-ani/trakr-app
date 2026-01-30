import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const notificationType = v.union(
  v.literal("friend_request"),
  v.literal("friend_accepted"),
  v.literal("nudge"),
  v.literal("celebration"),
  v.literal("streak_milestone"),
);

export const friendshipStatus = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("rejected"),
);

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    username: v.optional(v.string()),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    timezone: v.optional(v.string()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"])
    .index("by_email", ["email"]),

  habits: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    scheduleDays: v.array(v.number()), // 0-6, Sunday=0
    reminderTime: v.optional(v.string()), // HH:MM format
    isArchived: v.boolean(),
    isPublic: v.boolean(), // controls friend visibility
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isArchived"]),

  habitLogs: defineTable({
    habitId: v.id("habits"),
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD format
    completed: v.boolean(),
    completedAt: v.optional(v.number()), // timestamp
    note: v.optional(v.string()),
  })
    .index("by_habit_date", ["habitId", "date"])
    .index("by_user_date", ["userId", "date"])
    .index("by_habit", ["habitId"]),

  friendships: defineTable({
    requesterId: v.id("users"),
    addresseeId: v.id("users"),
    status: friendshipStatus,
  })
    .index("by_requester", ["requesterId"])
    .index("by_addressee", ["addresseeId"])
    .index("by_addressee_status", ["addresseeId", "status"])
    .index("by_pair", ["requesterId", "addresseeId"]),

  notifications: defineTable({
    userId: v.string(),
    fromUserId: v.optional(v.id("users")),
    type: notificationType,
    habitId: v.optional(v.id("habits")),
    message: v.optional(v.string()),
    read: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"]),
});

"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { searchUsersByUsername, ClerkUserData } from "./lib/clerk";

// Validator for user data returned from Clerk
const clerkUserValidator = v.object({
  id: v.string(),
  username: v.optional(v.string()),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  imageUrl: v.string(),
  emailAddresses: v.array(
    v.object({
      id: v.string(),
      emailAddress: v.string(),
    })
  ),
});

// Search users by username
// Uses Clerk's backend API with Node.js runtime
export const searchUsers = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(clerkUserValidator),
  handler: async (ctx, args): Promise<ClerkUserData[]> => {
    const { query, limit = 20 } = args;

    // Validate query length
    if (query.length < 2) {
      return [];
    }

    // Get current user ID to exclude from results
    const identity = await ctx.auth.getUserIdentity();
    const currentUserId = identity?.subject;

    try {
      const users = await searchUsersByUsername(
        query,
        currentUserId,
        limit
      );

      return users;
    } catch (error) {
      console.error("Error in searchUsers action:", error);
      throw new ConvexError({
        code: "SEARCH_ERROR",
        message: "Failed to search users. Please try again.",
      });
    }
  },
});

// Get multiple users by their IDs
// Useful for fetching friend profiles
export const getUsersByIds = action({
  args: {
    userIds: v.array(v.string()),
  },
  returns: v.array(clerkUserValidator),
  handler: async (ctx, args) => {
    const { userIds } = args;

    if (userIds.length === 0) {
      return [];
    }

    try {
      // Fetch users in parallel
      const { clerk } = await import("./lib/clerk");
      
      const userPromises = userIds.map(async (userId) => {
        try {
          const user = await clerk.users.getUser(userId);
          return {
            id: user.id,
            username: user.username ?? undefined,
            firstName: user.firstName ?? undefined,
            lastName: user.lastName ?? undefined,
            imageUrl: user.imageUrl,
            emailAddresses: user.emailAddresses.map((email) => ({
              id: email.id,
              emailAddress: email.emailAddress,
            })),
          };
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          return null;
        }
      });

      const users = await Promise.all(userPromises);
      return users.filter((user) => user !== null);
    } catch (error) {
      console.error("Error in getUsersByIds action:", error);
      throw new ConvexError({
        code: "FETCH_ERROR",
        message: "Failed to fetch users. Please try again.",
      });
    }
  },
});

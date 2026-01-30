"use node";

import { createClerkClient } from "@clerk/backend";

// Clerk client for backend operations
// This requires CLERK_SECRET_KEY environment variable
const secretKey = process.env.CLERK_SECRET_KEY;

if (!secretKey) {
  console.error("CLERK_SECRET_KEY environment variable is not set");
}

export const clerk = createClerkClient({
  secretKey: secretKey || "",
});

// Type for user data returned from Clerk (transformed to match Convex validators)
export interface ClerkUserData {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  imageUrl: string;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
  }>;
}

// Search users by username prefix
export async function searchUsersByUsername(
  query: string,
  excludeUserId?: string,
  limit: number = 20
): Promise<ClerkUserData[]> {
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is not configured");
  }

  if (query.length < 2) {
    return [];
  }

  try {
    // Get all users and filter by username
    // Note: Clerk's getUserList doesn't support direct username filtering,
    // so we fetch users and filter locally
    const { data: users } = await clerk.users.getUserList({
      limit: 100, // Fetch more to filter
    });

    // Filter users by username (case-insensitive prefix match)
    const queryLower = query.toLowerCase();
    const filteredUsers = users.filter((user) => {
      // Skip the current user
      if (excludeUserId && user.id === excludeUserId) {
        return false;
      }

      // Match by username
      if (user.username && user.username.toLowerCase().startsWith(queryLower)) {
        return true;
      }

      // Match by email (optional)
      const primaryEmail = user.emailAddresses[0]?.emailAddress;
      if (primaryEmail && primaryEmail.toLowerCase().startsWith(queryLower)) {
        return true;
      }

      return false;
    });

    // Limit results
    const limitedUsers = filteredUsers.slice(0, limit);

    // Map to our interface, converting null to undefined
    return limitedUsers.map((user) => ({
      id: user.id,
      username: user.username ?? undefined,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      imageUrl: user.imageUrl,
      emailAddresses: user.emailAddresses.map((email) => ({
        id: email.id,
        emailAddress: email.emailAddress,
      })),
    }));
  } catch (error) {
    console.error("Error searching users in Clerk:", error);
    throw new Error("Failed to search users");
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<ClerkUserData | null> {
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is not configured");
  }

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
    console.error("Error fetching user from Clerk:", error);
    return null;
  }
}

import { useUser } from "@clerk/clerk-expo";

// This hook returns user data directly from Clerk
// The users table has been removed - all user data is now in Clerk

export function useCurrentUser() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  // Map Clerk user to the expected format
  const user = clerkUser ? {
    userId: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress,
    username: clerkUser.username,
    displayName: clerkUser.firstName && clerkUser.lastName 
      ? `${clerkUser.firstName} ${clerkUser.lastName}`
      : clerkUser.firstName || clerkUser.lastName || clerkUser.username,
    avatarUrl: clerkUser.imageUrl,
  } : null;

  return {
    user,
    clerkUser,
    isLoading: !clerkLoaded,
    isAuthenticated: !!clerkUser,
  };
}

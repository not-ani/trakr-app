import { useUser } from "@clerk/clerk-expo";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "@trakr/backend/convex/_generated/api";

// Note: This hook can be used anywhere as it handles auth state internally

export function useCurrentUser() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { isAuthenticated, isLoading: convexLoading } = useConvexAuth();

  // Only query Convex if Convex auth is ready
  const convexUser = useQuery(
    api.users.me,
    isAuthenticated ? undefined : "skip"
  );
  const getOrCreate = useMutation(api.users.getOrCreate);

  useEffect(() => {
    if (clerkLoaded && isAuthenticated && clerkUser && convexUser === null) {
      // User is signed in but doesn't exist in Convex yet
      getOrCreate();
    }
  }, [clerkLoaded, isAuthenticated, clerkUser, convexUser, getOrCreate]);

  return {
    user: convexUser,
    clerkUser,
    isLoading: !clerkLoaded || convexLoading || (isAuthenticated && convexUser === undefined),
    isAuthenticated,
  };
}

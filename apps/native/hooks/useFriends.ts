import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@trakr/backend/convex/_generated/api";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";

// Note: These hooks should only be used inside <Authenticated> or <AuthGuard>
// The parent component guarantees the user is authenticated

export function useFriends() {
  const friends = useQuery(api.friends.listFriends);
  const pendingRequests = useQuery(api.friends.listPendingRequests);
  const friendStreaks = useQuery(api.feed.getFriendStreaks);

  const sendRequest = useMutation(api.friends.sendRequest);
  const sendRequestByClerkId = useMutation(api.friends.sendRequestByClerkId);
  const acceptRequest = useMutation(api.friends.acceptRequest);
  const rejectRequest = useMutation(api.friends.rejectRequest);
  const removeFriend = useMutation(api.friends.removeFriend);

  return {
    friends,
    pendingRequests,
    friendStreaks,
    sendRequest,
    sendRequestByClerkId,
    acceptRequest,
    rejectRequest,
    removeFriend,
    isLoading: friends === undefined,
  };
}

export function useFriendProgress(friendId: string | undefined) {
  const progress = useQuery(
    api.feed.getFriendProgress,
    friendId ? { friendId } : "skip"
  );

  return {
    progress,
    isLoading: friendId !== undefined && progress === undefined,
  };
}

export function useFriendActivity(limit?: number) {
  const activity = useQuery(api.feed.getFriendActivity, { limit });

  return {
    activity: activity ?? [],
    isLoading: activity === undefined,
  };
}

// Type for user search result from Clerk
export interface SearchUserResult {
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

// Search users by username using Clerk backend API
export function useSearchUsers(query: string) {
  const searchAction = useAction(api.clerkUsers.searchUsers);
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const users = await searchAction({ query: searchQuery, limit: 20 });
      setResults(users);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err?.message || "Failed to search users");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchAction]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  return {
    results,
    isLoading: isLoading || (query.length >= 2 && results.length === 0 && !error),
    error,
  };
}

// Type for user profile from Clerk
export interface FriendProfile {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  imageUrl: string;
  displayName: string;
}

// Fetch user profiles by IDs for friends list
export function useFriendProfiles(userIds: string[]) {
  const getUsersAction = useAction(api.clerkUsers.getUsersByIds);
  const [profiles, setProfiles] = useState<Record<string, FriendProfile>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Serialize userIds to avoid infinite loop from array reference changes
  const userIdsKey = useMemo(() => [...userIds].sort().join(","), [userIds]);
  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;

  useEffect(() => {
    const currentProfiles = profilesRef.current;
    const ids = userIdsKey ? userIdsKey.split(",").filter(Boolean) : [];

    const fetchProfiles = async () => {
      if (ids.length === 0) {
        // Only clear if profiles isn't already empty
        if (Object.keys(currentProfiles).length > 0) {
          setProfiles({});
        }
        return;
      }

      // Only fetch profiles we don't already have
      const missingIds = ids.filter((id) => !currentProfiles[id]);
      if (missingIds.length === 0) return;

      setIsLoading(true);
      try {
        const users = await getUsersAction({ userIds: missingIds });
        const newProfiles: Record<string, FriendProfile> = { ...currentProfiles };

        users.forEach((user) => {
          const displayName = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.lastName || user.username || "Unknown";

          newProfiles[user.id] = {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            displayName,
          };
        });

        setProfiles(newProfiles);
      } catch (err) {
        console.error("Error fetching friend profiles:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [userIdsKey, getUsersAction]);

  return {
    profiles,
    isLoading,
    getProfile: (id: string) => profiles[id],
  };
}

// Fetch a single user profile
export function useUserProfile(userId: string | undefined) {
  const getUsersAction = useAction(api.clerkUsers.getUsersByIds);
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const users = await getUsersAction({ userIds: [userId] });
        if (users.length > 0) {
          const user = users[0];
          const displayName = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.lastName || user.username || "Unknown";
          
          setProfile({
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            displayName,
          });
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, getUsersAction]);

  return {
    profile,
    isLoading,
  };
}

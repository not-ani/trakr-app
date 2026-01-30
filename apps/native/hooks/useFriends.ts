import { useMutation, useQuery } from "convex/react";
import { api } from "@trakr/backend/convex/_generated/api";
import { Id } from "@trakr/backend/convex/_generated/dataModel";

// Note: These hooks should only be used inside <Authenticated> or <AuthGuard>
// The parent component guarantees the user is authenticated

export function useFriends() {
  const friends = useQuery(api.friends.listFriends);
  const pendingRequests = useQuery(api.friends.listPendingRequests);
  const friendStreaks = useQuery(api.feed.getFriendStreaks);

  const sendRequest = useMutation(api.friends.sendRequest);
  const sendRequestByUsername = useMutation(api.friends.sendRequestByUsername);
  const acceptRequest = useMutation(api.friends.acceptRequest);
  const rejectRequest = useMutation(api.friends.rejectRequest);
  const removeFriend = useMutation(api.friends.removeFriend);

  return {
    friends,
    pendingRequests,
    friendStreaks,
    sendRequest,
    sendRequestByUsername,
    acceptRequest,
    rejectRequest,
    removeFriend,
    isLoading: friends === undefined,
  };
}

export function useSearchUsers(query: string) {
  const results = useQuery(
    api.friends.searchUsers,
    query.length >= 2 ? { query } : "skip"
  );

  return {
    results: results ?? [],
    isLoading: query.length >= 2 && results === undefined,
  };
}

export function useFriendProgress(friendId: Id<"users"> | undefined) {
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

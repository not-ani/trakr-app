import { useMutation, useQuery } from "convex/react";
import { api } from "@trakr/backend/convex/_generated/api";

// Note: This hook should only be used inside <Authenticated> or <AuthGuard>
// The parent component guarantees the user is authenticated

export function useNotifications() {
  const notifications = useQuery(api.notifications.list, { limit: 50 });
  const unreadCount = useQuery(api.notifications.getUnreadCount);

  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const sendNudge = useMutation(api.notifications.sendNudge);
  const sendCelebration = useMutation(api.notifications.sendCelebration);

  return {
    notifications: notifications ?? [],
    unreadCount: unreadCount ?? 0,
    markRead,
    markAllRead,
    deleteNotification,
    sendNudge,
    sendCelebration,
    isLoading: notifications === undefined,
  };
}

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { Card, useThemeColor } from "heroui-native";

import { Container } from "@/components/container";
import { useNotifications } from "@/hooks";

const NOTIFICATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  friend_request: "person-add",
  friend_accepted: "people",
  nudge: "notifications",
  celebration: "heart",
  streak_milestone: "flame",
};

const NOTIFICATION_COLORS: Record<string, string> = {
  friend_request: "#3b82f6",
  friend_accepted: "#22c55e",
  nudge: "#f59e0b",
  celebration: "#f43f5e",
  streak_milestone: "#f59e0b",
};

export default function NotificationsScreen() {
  const router = useRouter();
  const foreground = useThemeColor("foreground");
  const { notifications, markRead, markAllRead, isLoading } = useNotifications();

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationPress = async (notification: (typeof notifications)[0]) => {
    if (!notification.read) {
      try {
        await markRead({ notificationId: notification._id });
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }

    // Navigate based on notification type
    if (notification.type === "friend_request" || notification.type === "friend_accepted") {
      router.push("/friends");
    } else if (notification.habitId) {
      router.push(`/habits/${notification.habitId}`);
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationText = (notification: (typeof notifications)[0]) => {
    const fromName = notification.fromUser?.displayName || notification.fromUser?.username || "Someone";

    switch (notification.type) {
      case "friend_request":
        return `${fromName} sent you a friend request`;
      case "friend_accepted":
        return `${fromName} accepted your friend request`;
      case "nudge":
        if (notification.habit) {
          return `${fromName} nudged you about ${notification.habit.name}`;
        }
        return `${fromName} sent you a nudge`;
      case "celebration":
        if (notification.habit) {
          return `${fromName} celebrated your progress on ${notification.habit.name}!`;
        }
        return `${fromName} celebrated your progress!`;
      case "streak_milestone":
        return notification.message || "You reached a streak milestone!";
      default:
        return notification.message || "New notification";
    }
  };

  if (isLoading) {
    return (
      <Container className="p-6">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={foreground} />
        </View>
      </Container>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Container className="p-6">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-2xl font-bold" style={{ color: foreground }}>
          Notifications
        </Text>
        {unreadCount > 0 && (
          <Pressable
            onPress={handleMarkAllRead}
            className="px-3 py-1.5 rounded-full bg-default-100 active:bg-default-200"
          >
            <Text className="text-sm text-foreground">Mark all read</Text>
          </Pressable>
        )}
      </View>

      {notifications.length > 0 ? (
        <View>
          {notifications.map((notification) => {
            const iconName = NOTIFICATION_ICONS[notification.type] || "notifications";
            const iconColor = NOTIFICATION_COLORS[notification.type] || foreground;

            return (
              <Pressable
                key={notification._id}
                onPress={() => handleNotificationPress(notification)}
              >
                <Card
                  variant="secondary"
                  className={`flex-row items-center p-4 mb-3 ${!notification.read ? "border-l-4 border-primary" : ""}`}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: iconColor + "20" }}
                  >
                    <Ionicons name={iconName} size={20} color={iconColor} />
                  </View>

                  <View className="flex-1">
                    <Text
                      className={`${notification.read ? "font-normal" : "font-medium"}`}
                      style={{ color: foreground }}
                    >
                      {getNotificationText(notification)}
                    </Text>
                    <Text className="text-xs text-default-500 mt-1">
                      {formatTime(notification._creationTime)}
                    </Text>
                  </View>

                  {!notification.read && (
                    <View className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </Card>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View className="flex-1 justify-center items-center py-12">
          <View className="w-16 h-16 bg-default-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="notifications-outline" size={32} color={foreground} />
          </View>
          <Text className="text-lg font-medium mb-2" style={{ color: foreground }}>
            No notifications
          </Text>
          <Text className="text-default-500 text-center">
            You're all caught up!
          </Text>
        </View>
      )}
    </Container>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { Authenticated } from "convex/react";
import { useRouter } from "expo-router";
import { Pressable, View, Text } from "react-native";
import { useThemeColor } from "heroui-native";
import { useNotifications } from "@/hooks";

function NotificationBadgeContent() {
  const router = useRouter();
  const foreground = useThemeColor("foreground");
  const { unreadCount } = useNotifications();

  return (
    <Pressable
      onPress={() => router.push("/notifications")}
      className="relative p-2"
    >
      <Ionicons name="notifications-outline" size={24} color={foreground} />
      {unreadCount > 0 && (
        <View className="absolute top-1 right-1 bg-primary min-w-[18px] h-[18px] rounded-full items-center justify-center">
          <Text className="text-xs text-white font-bold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function NotificationBadge() {
  const router = useRouter();
  const foreground = useThemeColor("foreground");

  return (
    <Authenticated>
      <NotificationBadgeContent />
    </Authenticated>
  );
}

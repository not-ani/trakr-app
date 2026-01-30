import { Ionicons } from "@expo/vector-icons";
import { Card, cn, useThemeColor } from "heroui-native";
import { Pressable, View, Text, Image, ActivityIndicator } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

type FriendCardProps = {
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  maxStreak?: number;
  onPress?: () => void;
  onNudge?: () => void;
  onCelebrate?: () => void;
};

export function FriendCard({
  displayName,
  username,
  avatarUrl,
  maxStreak,
  onPress,
  onNudge,
  onCelebrate,
}: FriendCardProps) {
  const foreground = useThemeColor("foreground");

  return (
    <Pressable onPress={onPress}>
      <Card variant="secondary" className="p-4 mb-3 border border-default-100">
        <View className="flex-row items-center">
          <View className="w-14 h-14 rounded-2xl bg-default-100 items-center justify-center mr-4 overflow-hidden">
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={26} color={foreground + "40"} />
            )}
          </View>

          <View className="flex-1">
            <Text
              className="text-base font-semibold tracking-tight"
              style={{ color: foreground }}
              numberOfLines={1}
            >
              {displayName || username || "Unknown"}
            </Text>
            {username && displayName && (
              <Text className="text-sm text-default-500">@{username}</Text>
            )}
            {maxStreak !== undefined && maxStreak > 0 && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="flame" size={14} color="#f59e0b" />
                <Text className="ml-1 text-sm font-medium text-amber-500">
                  {maxStreak} day streak
                </Text>
              </View>
            )}
          </View>

          {(onNudge || onCelebrate) && (
            <View className="flex-row gap-2">
              {onNudge && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onNudge();
                  }}
                  className="w-10 h-10 rounded-xl bg-default-100 items-center justify-center"
                >
                  <Ionicons name="notifications-outline" size={20} color={foreground} />
                </Pressable>
              )}
              {onCelebrate && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onCelebrate();
                  }}
                  className="w-10 h-10 rounded-xl bg-rose-500/10 items-center justify-center"
                >
                  <Ionicons name="heart" size={20} color="#f43f5e" />
                </Pressable>
              )}
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

type FriendRequestCardProps = {
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
};

export function FriendRequestCard({
  displayName,
  username,
  avatarUrl,
  onAccept,
  onReject,
  isLoading,
}: FriendRequestCardProps) {
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");

  return (
    <Card variant="secondary" className="p-4 mb-3 border border-default-100">
      <View className="flex-row items-center mb-4">
        <View className="w-14 h-14 rounded-2xl bg-default-100 items-center justify-center mr-4 overflow-hidden">
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={26} color={foreground + "40"} />
          )}
        </View>

        <View className="flex-1">
          <Text
            className="text-base font-semibold"
            style={{ color: foreground }}
          >
            {displayName || username || "Unknown"}
          </Text>
          {username && (
            <Text className="text-sm text-default-500">@{username}</Text>
          )}
        </View>
      </View>

      <View className="flex-row gap-3">
        <Pressable
          onPress={onReject}
          disabled={isLoading}
          className="flex-1 py-3 rounded-xl bg-default-100"
          style={{ opacity: isLoading ? 0.5 : 1 }}
        >
          <Text
            className="text-center font-semibold"
            style={{ color: foreground }}
          >
            Decline
          </Text>
        </Pressable>
        <Pressable
          onPress={onAccept}
          disabled={isLoading}
          className="flex-1 py-3 rounded-xl bg-foreground flex-row items-center justify-center"
          style={{ backgroundColor: foreground, opacity: isLoading ? 0.5 : 1 }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={background} />
          ) : (
            <Text className="text-center font-semibold" style={{ color: background }}>
              Accept
            </Text>
          )}
        </Pressable>
      </View>
    </Card>
  );
}

type UserSearchResultCardProps = {
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  status: "none" | "friends" | "pending_outgoing" | "pending_incoming";
  onSendRequest: () => void;
  onAccept?: () => void;
  isLoading?: boolean;
};

export function UserSearchResultCard({
  displayName,
  username,
  avatarUrl,
  status,
  onSendRequest,
  onAccept,
  isLoading,
}: UserSearchResultCardProps) {
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");

  return (
    <Card variant="secondary" className="flex-row items-center p-4 mb-3 border border-default-100">
      <View className="w-12 h-12 rounded-xl bg-default-100 items-center justify-center mr-3 overflow-hidden">
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="person" size={22} color={foreground + "40"} />
        )}
      </View>

      <View className="flex-1">
        <Text
          className="text-base font-semibold"
          style={{ color: foreground }}
        >
          {displayName || username}
        </Text>
        {username && <Text className="text-sm text-default-500">@{username}</Text>}
      </View>

      {status === "none" && (
        <Pressable
          onPress={onSendRequest}
          disabled={isLoading}
          className="py-2 px-4 rounded-xl bg-foreground"
          style={{ backgroundColor: foreground, opacity: isLoading ? 0.5 : 1 }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={background} />
          ) : (
            <Text className="font-semibold" style={{ color: background }}>Add</Text>
          )}
        </Pressable>
      )}
      {status === "friends" && (
        <View className="bg-success/10 px-3 py-2 rounded-xl">
          <Text className="text-sm font-semibold text-success">Friends</Text>
        </View>
      )}
      {status === "pending_outgoing" && (
        <View className="bg-amber-500/10 px-3 py-2 rounded-xl">
          <Text className="text-sm font-semibold text-amber-500">Pending</Text>
        </View>
      )}
      {status === "pending_incoming" && onAccept && (
        <Pressable
          onPress={onAccept}
          disabled={isLoading}
          className="py-2 px-4 rounded-xl bg-success"
          style={{ opacity: isLoading ? 0.5 : 1 }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="font-semibold text-white">Accept</Text>
          )}
        </Pressable>
      )}
    </Card>
  );
}

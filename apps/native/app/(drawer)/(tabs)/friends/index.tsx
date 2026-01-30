import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, ActivityIndicator, Pressable, Alert } from "react-native";
import { useThemeColor } from "heroui-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { AuthGuard } from "@/components/AuthGuard";
import { Container } from "@/components/container";
import { FriendCard, FriendRequestCard } from "@/components/friends";
import { useFriends, useNotifications } from "@/hooks";
import { Id } from "@trakr/backend/convex/_generated/dataModel";

type Tab = "friends" | "requests";

export default function FriendsListScreen() {
  return (
    <AuthGuard>
      <FriendsListContent />
    </AuthGuard>
  );
}

function FriendsListContent() {
  const router = useRouter();
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const {
    friends,
    pendingRequests,
    friendStreaks,
    acceptRequest,
    rejectRequest,
    isLoading,
  } = useFriends();
  const { sendNudge, sendCelebration } = useNotifications();

  const handleAccept = async (friendshipId: Id<"friendships">) => {
    setLoadingId(friendshipId);
    try {
      await acceptRequest({ friendshipId });
    } catch (error) {
      Alert.alert("Error", "Failed to accept request");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (friendshipId: Id<"friendships">) => {
    setLoadingId(friendshipId);
    try {
      await rejectRequest({ friendshipId });
    } catch (error) {
      Alert.alert("Error", "Failed to reject request");
    } finally {
      setLoadingId(null);
    }
  };

  const handleNudge = async (userId: Id<"users">) => {
    try {
      await sendNudge({ toUserId: userId });
      Alert.alert("Sent!", "Nudge sent successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send nudge");
    }
  };

  const handleCelebrate = async (userId: Id<"users">) => {
    try {
      await sendCelebration({ toUserId: userId });
      Alert.alert("Sent!", "Celebration sent!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send celebration");
    }
  };

  if (isLoading) {
    return (
      <Container safeAreaTop>
        <Container.Loading>
          <ActivityIndicator size="large" color={foreground} />
        </Container.Loading>
      </Container>
    );
  }

  const requestCount = pendingRequests?.length ?? 0;
  const filteredRequests = pendingRequests?.filter((r): r is NonNullable<typeof r> => r !== null) ?? [];

  // Merge friend data with streak data
  const friendsWithStreaks = friends
    ?.filter((f): f is NonNullable<typeof f> => f !== null)
    .map((friend) => {
      const streakData = friendStreaks?.find((fs) => fs?.friend._id === friend._id);
      return {
        ...friend,
        maxStreak: streakData?.maxStreak ?? 0,
      };
    }) ?? [];

  return (
    <Container safeAreaTop>
      <Container.Header className="pb-2">
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text
            className="text-3xl font-bold tracking-tight mb-2"
            style={{ color: foreground }}
          >
            Friends
          </Text>
          <Text className="text-base text-default-500">
            Stay accountable together
          </Text>
        </Animated.View>
      </Container.Header>

      <Container.Content>
        {/* Tab Switcher */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
          className="flex-row mb-6 bg-default-50 rounded-2xl p-1.5 border border-default-100"
        >
          <Pressable
            onPress={() => setActiveTab("friends")}
            className={`flex-1 py-3 rounded-xl ${activeTab === "friends" ? "bg-background shadow-sm" : ""}`}
          >
            <Text
              className="text-center font-semibold"
              style={{
                color: activeTab === "friends" ? foreground : foreground + "60",
              }}
            >
              Friends
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("requests")}
            className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${activeTab === "requests" ? "bg-background shadow-sm" : ""}`}
          >
            <Text
              className="text-center font-semibold"
              style={{
                color: activeTab === "requests" ? foreground : foreground + "60",
              }}
            >
              Requests
            </Text>
            {requestCount > 0 && (
              <View className="ml-2 bg-primary w-6 h-6 rounded-full items-center justify-center">
                <Text className="text-xs text-white font-bold">{requestCount}</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* Friends Tab */}
        {activeTab === "friends" ? (
          friendsWithStreaks.length > 0 ? (
            <Animated.View entering={FadeInUp.delay(300).duration(500)}>
              <Text className="text-sm font-semibold text-default-400 uppercase tracking-wider mb-4">
                {friendsWithStreaks.length} Friend{friendsWithStreaks.length !== 1 ? "s" : ""}
              </Text>
              {friendsWithStreaks.map((friend, index) => (
                <Animated.View
                  key={friend._id}
                  entering={FadeInUp.delay(350 + index * 50).duration(400)}
                >
                  <FriendCard
                    displayName={friend.displayName}
                    username={friend.username}
                    avatarUrl={friend.avatarUrl}
                    maxStreak={friend.maxStreak}
                    onPress={() => router.push(`/friends/${friend._id}`)}
                    onNudge={() => handleNudge(friend._id)}
                    onCelebrate={() => handleCelebrate(friend._id)}
                  />
                </Animated.View>
              ))}
            </Animated.View>
          ) : (
            <Container.EmptyState
              icon={<Ionicons name="people-outline" size={36} color={foreground + "60"} />}
              title="No friends yet"
              description="Add friends to see their progress and stay motivated together"
            />
          )
        ) : filteredRequests.length > 0 ? (
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <Text className="text-sm font-semibold text-default-400 uppercase tracking-wider mb-4">
              Pending Requests
            </Text>
            {filteredRequests.map((request, index) => (
              <Animated.View
                key={request.friendshipId}
                entering={FadeInUp.delay(350 + index * 50).duration(400)}
              >
                <FriendRequestCard
                  displayName={request.user.displayName}
                  username={request.user.username}
                  avatarUrl={request.user.avatarUrl}
                  onAccept={() => handleAccept(request.friendshipId)}
                  onReject={() => handleReject(request.friendshipId)}
                  isLoading={loadingId === request.friendshipId}
                />
              </Animated.View>
            ))}
          </Animated.View>
        ) : (
          <Container.EmptyState
            icon={<Ionicons name="mail-outline" size={36} color={foreground + "60"} />}
            title="No pending requests"
            description="Friend requests will appear here"
          />
        )}
      </Container.Content>

      {/* Add Friend Button */}
      <Container.Footer>
        <Pressable
          onPress={() => router.push("/friends/add")}
          className="flex-row items-center justify-center py-4 rounded-2xl"
          style={{ backgroundColor: foreground }}
        >
          <Ionicons name="person-add" size={20} color={background} />
          <Text
            className="ml-2 text-base font-semibold"
            style={{ color: background }}
          >
            Add Friend
          </Text>
        </Pressable>
      </Container.Footer>
    </Container>
  );
}

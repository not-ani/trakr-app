import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, TextInput, ActivityIndicator, Alert, Pressable } from "react-native";
import { useThemeColor } from "heroui-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { Container } from "@/components/container";
import { UserSearchResultCard } from "@/components/friends";
import { useSearchUsers, useFriends } from "@/hooks";
import { Id } from "@trakr/backend/convex/_generated/dataModel";

export default function AddFriendScreen() {
  const router = useRouter();
  const foreground = useThemeColor("foreground");
  const [query, setQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { results, isLoading } = useSearchUsers(query);
  const { sendRequest, acceptRequest } = useFriends();

  const handleSendRequest = async (userId: Id<"users">) => {
    setLoadingId(userId);
    try {
      await sendRequest({ addresseeId: userId });
      Alert.alert("Success", "Friend request sent!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send request");
    } finally {
      setLoadingId(null);
    }
  };

  const handleAccept = async (userId: Id<"users">) => {
    Alert.alert("Info", "Accept this request from the Friends tab");
  };

  return (
    <Container>
      <Container.Header className="pb-2">
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text
            className="text-3xl font-bold tracking-tight mb-2"
            style={{ color: foreground }}
          >
            Add Friend
          </Text>
          <Text className="text-base text-default-500">
            Search by username to connect
          </Text>
        </Animated.View>
      </Container.Header>

      <Container.Content>
        {/* Search Input */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
          className="mb-6"
        >
          <View className="flex-row items-center bg-default-50 rounded-2xl px-4 border border-default-100">
            <Ionicons name="search" size={20} color={foreground + "60"} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by username..."
              placeholderTextColor={foreground + "40"}
              className="flex-1 py-4 px-3 text-base"
              style={{ color: foreground }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={20} color={foreground + "60"} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Results */}
        {query.length < 2 ? (
          <Container.EmptyState
            icon={<Ionicons name="search-outline" size={36} color={foreground + "60"} />}
            title="Find friends"
            description="Enter at least 2 characters to search for users"
          />
        ) : isLoading ? (
          <Container.Loading>
            <ActivityIndicator size="large" color={foreground} />
          </Container.Loading>
        ) : results.length > 0 ? (
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <Text className="text-sm font-semibold text-default-400 uppercase tracking-wider mb-4">
              {results.length} Result{results.length !== 1 ? "s" : ""}
            </Text>
            {results.map((user, index) => (
              <Animated.View
                key={user._id}
                entering={FadeInUp.delay(350 + index * 50).duration(400)}
              >
                <UserSearchResultCard
                  displayName={user.displayName}
                  username={user.username}
                  avatarUrl={user.avatarUrl}
                  status={user.status}
                  onSendRequest={() => handleSendRequest(user._id)}
                  onAccept={() => handleAccept(user._id)}
                  isLoading={loadingId === user._id}
                />
              </Animated.View>
            ))}
          </Animated.View>
        ) : (
          <Container.EmptyState
            icon={<Ionicons name="person-outline" size={36} color={foreground + "60"} />}
            title="No users found"
            description="Try a different username"
          />
        )}
      </Container.Content>
    </Container>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, ActivityIndicator, Image, Alert, Pressable } from "react-native";
import { Card, useThemeColor } from "heroui-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { Container } from "@/components/container";
import { HABIT_COLORS, HABIT_ICONS } from "@/components/habits";
import { useFriendProgress, useFriends, useNotifications, useUserProfile } from "@/hooks";

export default function FriendDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");

  const { progress, isLoading } = useFriendProgress(id);
  const { removeFriend } = useFriends();
  const { sendNudge, sendCelebration } = useNotifications();
  const { profile, isLoading: profileLoading } = useUserProfile(id);

  const handleNudge = async (habitId?: string) => {
    try {
      await sendNudge({
        toUserId: id,
        habitId,
      });
      Alert.alert("Sent!", "Nudge sent successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send nudge");
    }
  };

  const handleCelebrate = async (habitId?: string) => {
    try {
      await sendCelebration({
        toUserId: id,
        habitId,
      });
      Alert.alert("Sent!", "Celebration sent!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send celebration");
    }
  };

  const handleRemoveFriend = () => {
    Alert.alert(
      "Remove Friend",
      "Are you sure you want to remove this friend?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFriend({ friendId: id });
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to remove friend");
            }
          },
        },
      ]
    );
  };

  if (isLoading || profileLoading || !progress || !profile) {
    return (
      <Container>
        <Container.Loading>
          <ActivityIndicator size="large" color={foreground} />
        </Container.Loading>
      </Container>
    );
  }

  const { todaysHabits, allPublicHabits } = progress;
  const completedToday = todaysHabits.filter((h) => h.completedToday).length;
  const totalToday = todaysHabits.length;
  const progressPercentage = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  return (
    <Container>
      <Container.Content>
        {/* Profile Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          className="items-center pt-6 pb-6"
        >
          <View className="w-24 h-24 rounded-full bg-default-100 items-center justify-center mb-4 overflow-hidden border-4 border-background shadow-lg">
            {profile.imageUrl ? (
              <Image
                source={{ uri: profile.imageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={48} color={foreground + "40"} />
            )}
          </View>
          <Text
            className="text-2xl font-bold tracking-tight mb-1"
            style={{ color: foreground }}
          >
            {profile.displayName || profile.username}
          </Text>
          {profile.username && profile.displayName && (
            <Text className="text-base text-default-500">@{profile.username}</Text>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          className="flex-row gap-3 mb-6"
        >
          <Pressable
            onPress={() => handleNudge()}
            className="flex-1 flex-row items-center justify-center py-4 rounded-2xl bg-default-100"
          >
            <Ionicons name="notifications-outline" size={20} color={foreground} />
            <Text className="ml-2 font-semibold" style={{ color: foreground }}>
              Nudge
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleCelebrate()}
            className="flex-1 flex-row items-center justify-center py-4 rounded-2xl bg-rose-500/10"
          >
            <Ionicons name="heart" size={20} color="#f43f5e" />
            <Text className="ml-2 font-semibold text-rose-500">Celebrate</Text>
          </Pressable>
        </Animated.View>

        {/* Today's Progress */}
        {totalToday > 0 && (
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <Card variant="secondary" className="p-5 mb-6 border border-default-100">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-sm text-default-500 mb-1">Today's Progress</Text>
                  <Text
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: foreground }}
                  >
                    {completedToday}
                    <Text className="text-lg text-default-400">/{totalToday}</Text>
                  </Text>
                </View>
                <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center">
                  <Text className="text-lg font-bold text-primary">
                    {Math.round(progressPercentage)}%
                  </Text>
                </View>
              </View>
              <View className="h-2 bg-default-100 rounded-full overflow-hidden">
                <Animated.View
                  entering={FadeIn.delay(500).duration(600)}
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Public Habits */}
        <Animated.View entering={FadeInUp.delay(400).duration(500)}>
          <Text className="text-sm font-semibold text-default-400 uppercase tracking-wider mb-4">
            Public Habits
          </Text>

          {allPublicHabits.length > 0 ? (
            <View>
              {allPublicHabits.map((habit, index) => {
                const habitColor = habit.color
                  ? HABIT_COLORS[habit.color] ?? foreground
                  : foreground;
                const iconName = habit.icon
                  ? HABIT_ICONS[habit.icon] ?? "ellipse"
                  : "ellipse";

                return (
                  <Animated.View
                    key={habit._id}
                    entering={FadeInUp.delay(450 + index * 50).duration(400)}
                  >
                    <Card variant="secondary" className="flex-row items-center p-4 mb-3 border border-default-100">
                      <View
                        className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                        style={{ backgroundColor: habitColor + "15" }}
                      >
                        {habit.completedToday ? (
                          <Ionicons name="checkmark" size={24} color={habitColor} />
                        ) : (
                          <Ionicons name={iconName} size={22} color={habitColor} />
                        )}
                      </View>

                      <View className="flex-1">
                        <Text
                          className="text-base font-semibold"
                          style={{ color: foreground }}
                        >
                          {habit.name}
                        </Text>
                        {habit.isScheduledToday && (
                          <Text className="text-sm text-default-500">
                            {habit.completedToday ? "Completed today" : "Scheduled for today"}
                          </Text>
                        )}
                      </View>

                      {habit.streak > 0 && (
                        <View className="flex-row items-center bg-amber-500/10 px-3 py-1.5 rounded-xl">
                          <Ionicons name="flame" size={16} color="#f59e0b" />
                          <Text className="ml-1 text-sm font-bold text-amber-500">
                            {habit.streak}
                          </Text>
                        </View>
                      )}
                    </Card>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <Card variant="secondary" className="p-8 items-center border border-default-100">
              <View className="w-14 h-14 rounded-2xl bg-default-100 items-center justify-center mb-4">
                <Ionicons name="eye-off-outline" size={24} color={foreground + "60"} />
              </View>
              <Text className="text-default-500 text-center">No public habits</Text>
            </Card>
          )}
        </Animated.View>

        {/* Remove Friend */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(500)}
          className="pt-8 pb-6"
        >
          <Pressable
            onPress={handleRemoveFriend}
            className="flex-row items-center justify-center py-4 rounded-2xl border-2 border-danger/30 bg-danger/5"
          >
            <Ionicons name="person-remove-outline" size={20} color="#ef4444" />
            <Text className="ml-2 text-base font-semibold text-danger">
              Remove Friend
            </Text>
          </Pressable>
        </Animated.View>
      </Container.Content>
    </Container>
  );
}

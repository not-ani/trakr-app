import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, Alert, ActivityIndicator, Pressable } from "react-native";
import { Card, useThemeColor } from "heroui-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { Container } from "@/components/container";
import { HabitForm, type HabitFormData, WeekView, HABIT_COLORS, HABIT_ICONS } from "@/components/habits";
import { useHabit } from "@/hooks";
import { Id } from "@trakr/backend/convex/_generated/dataModel";

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { habit, streak, weekCompletions, updateHabit, archiveHabit } = useHabit(
    id as Id<"habits"> | undefined
  );

  if (!id || habit === undefined) {
    return (
      <Container>
        <Container.Loading>
          <ActivityIndicator size="large" color={foreground} />
        </Container.Loading>
      </Container>
    );
  }

  if (habit === null) {
    return (
      <Container>
        <Container.EmptyState
          icon={<Ionicons name="alert-circle-outline" size={36} color={foreground + "60"} />}
          title="Habit not found"
          description="This habit may have been deleted or doesn't exist"
        />
      </Container>
    );
  }

  const habitColor = habit.color ? HABIT_COLORS[habit.color] ?? foreground : foreground;
  const iconName = habit.icon ? HABIT_ICONS[habit.icon] ?? "ellipse" : "ellipse";

  const handleUpdate = async (data: HabitFormData) => {
    setIsLoading(true);
    try {
      await updateHabit({
        id: id as Id<"habits">,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        scheduleDays: data.scheduleDays,
        reminderTime: data.reminderTime,
        isPublic: data.isPublic,
      });
      setIsEditing(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update habit. Please try again.");
      console.error("Failed to update habit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = () => {
    Alert.alert(
      "Archive Habit",
      "Are you sure you want to archive this habit? You can restore it later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            try {
              await archiveHabit({ id: id as Id<"habits"> });
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to archive habit.");
            }
          },
        },
      ]
    );
  };

  if (isEditing) {
    return (
      <Container>
        <Container.Content className="pt-6">
          <HabitForm
            initialData={{
              name: habit.name,
              description: habit.description,
              icon: habit.icon,
              color: habit.color,
              scheduleDays: habit.scheduleDays,
              reminderTime: habit.reminderTime,
              isPublic: habit.isPublic,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            submitLabel="Save Changes"
            isLoading={isLoading}
          />
        </Container.Content>
      </Container>
    );
  }

  const dates = weekCompletions?.dates ?? [];
  const completions = weekCompletions?.completions ?? {};

  return (
    <Container>
      <Container.Content>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          className="items-center pt-6 pb-8"
        >
          <View
            className="w-24 h-24 rounded-3xl items-center justify-center mb-5"
            style={{ backgroundColor: habitColor + "15" }}
          >
            <Ionicons name={iconName} size={48} color={habitColor} />
          </View>
          <Text
            className="text-2xl font-bold tracking-tight mb-2 text-center"
            style={{ color: foreground }}
          >
            {habit.name}
          </Text>
          {habit.description && (
            <Text className="text-base text-default-500 text-center px-4">
              {habit.description}
            </Text>
          )}
        </Animated.View>

        {/* Streak Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <Card variant="secondary" className="p-5 mb-4 border border-default-100">
            <View className="flex-row items-center justify-between mb-5">
              <View>
                <Text className="text-sm text-default-500 mb-1">Current Streak</Text>
                <View className="flex-row items-center">
                  <Ionicons name="flame" size={24} color="#f59e0b" />
                  <Text className="ml-2 text-3xl font-bold text-amber-500">
                    {streak ?? 0}
                  </Text>
                  <Text className="ml-2 text-base text-default-500">days</Text>
                </View>
              </View>
              <View className="w-16 h-16 rounded-2xl bg-amber-500/10 items-center justify-center">
                <Ionicons name="trophy" size={28} color="#f59e0b" />
              </View>
            </View>

            <Text className="text-sm font-semibold text-default-400 uppercase tracking-wider mb-3">
              This Week
            </Text>
            <WeekView
              dates={dates}
              completions={completions}
              scheduledDays={habit.scheduleDays}
              color={habit.color}
            />
          </Card>
        </Animated.View>

        {/* Schedule Card */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <Card variant="secondary" className="p-5 mb-4 border border-default-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-default-100 items-center justify-center mr-3">
                <Ionicons name="calendar-outline" size={20} color={foreground} />
              </View>
              <View>
                <Text className="text-sm text-default-500">Schedule</Text>
                <Text className="text-base font-medium" style={{ color: foreground }}>
                  {habit.scheduleDays.length === 7
                    ? "Every day"
                    : habit.scheduleDays.length === 5 &&
                      !habit.scheduleDays.includes(0) &&
                      !habit.scheduleDays.includes(6)
                    ? "Weekdays"
                    : habit.scheduleDays.length === 2 &&
                      habit.scheduleDays.includes(0) &&
                      habit.scheduleDays.includes(6)
                    ? "Weekends"
                    : habit.scheduleDays
                        .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
                        .join(", ")}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          className="flex-row gap-3 pt-4"
        >
          <Pressable
            onPress={() => setIsEditing(true)}
            className="flex-1 flex-row items-center justify-center py-4 rounded-2xl bg-default-100"
          >
            <Ionicons name="pencil-outline" size={18} color={foreground} />
            <Text className="ml-2 font-semibold" style={{ color: foreground }}>
              Edit
            </Text>
          </Pressable>
          <Pressable
            onPress={handleArchive}
            className="flex-1 flex-row items-center justify-center py-4 rounded-2xl border-2 border-danger/30 bg-danger/5"
          >
            <Ionicons name="archive-outline" size={18} color="#ef4444" />
            <Text className="ml-2 font-semibold text-danger">Archive</Text>
          </Pressable>
        </Animated.View>
      </Container.Content>
    </Container>
  );
}

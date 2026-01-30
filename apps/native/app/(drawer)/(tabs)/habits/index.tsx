import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Card, useThemeColor } from "heroui-native";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import { AuthGuard } from "@/components/AuthGuard";
import { Container } from "@/components/container";
import {
  HABIT_COLORS,
  HABIT_ICONS,
  CompactWeekView,
} from "@/components/habits";
import { useHabits } from "@/hooks";

export default function HabitsListScreen() {
  return (
    <AuthGuard>
      <HabitsListContent />
    </AuthGuard>
  );
}

function HabitsListContent() {
  const router = useRouter();
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");
  const { habits, weekCompletions, isLoading } = useHabits();

  if (isLoading) {
    return (
      <Container safeAreaTop>
        <Container.Loading>
          <ActivityIndicator size="large" color={foreground} />
        </Container.Loading>
      </Container>
    );
  }

  const dates = weekCompletions?.dates ?? [];
  const completionsByHabit = weekCompletions?.completionsByHabit ?? {};

  return (
    <Container safeAreaTop>
      <Container.Header className="pb-2">
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text
            className="text-3xl font-bold tracking-tight mb-2"
            style={{ color: foreground }}
          >
            Habits
          </Text>
          <Text className="text-base text-default-500">
            Track your daily routines
          </Text>
        </Animated.View>
      </Container.Header>

      <Container.Content>
        {habits && habits.length > 0 ? (
          <Animated.View entering={FadeInUp.delay(200).duration(500)}>
            <Text className="text-sm font-semibold text-default-400 uppercase tracking-wider mb-4">
              {habits.length} Habit{habits.length !== 1 ? "s" : ""}
            </Text>
            {habits.map((habit, index) => {
              const habitColor = habit.color
                ? (HABIT_COLORS[habit.color] ?? habit.color)
                : foreground;
              const iconName = habit.icon
                ? (HABIT_ICONS[habit.icon] ?? "ellipse")
                : "ellipse";
              const completions = completionsByHabit[habit._id] ?? {};

              return (
                <Animated.View
                  key={habit._id}
                  entering={FadeInUp.delay(250 + index * 50).duration(400)}
                >
                  <Pressable
                    onPress={() => router.push(`/habits/${habit._id}`)}
                  >
                    <Card
                      variant="secondary"
                      className="p-4 mb-3 border border-default-100"
                    >
                      <View className="flex-row items-center mb-4">
                        <View
                          className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                          style={{ backgroundColor: habitColor + "15" }}
                        >
                          <Ionicons
                            name={iconName}
                            size={24}
                            color={habitColor}
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-base font-semibold tracking-tight"
                            style={{ color: foreground }}
                            numberOfLines={1}
                          >
                            {habit.name}
                          </Text>
                          <Text className="text-sm text-default-500">
                            {habit.scheduleDays.length === 7
                              ? "Every day"
                              : habit.scheduleDays.length === 5 &&
                                  !habit.scheduleDays.includes(0) &&
                                  !habit.scheduleDays.includes(6)
                                ? "Weekdays"
                                : `${habit.scheduleDays.length} days/week`}
                          </Text>
                        </View>
                        <View className="w-8 h-8 rounded-full bg-default-100 items-center justify-center">
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={foreground + "60"}
                          />
                        </View>
                      </View>
                      <CompactWeekView
                        dates={dates}
                        completions={completions}
                        color={habit.color}
                      />
                    </Card>
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>
        ) : (
          <Container.EmptyState
            icon={
              <Ionicons
                name="list-outline"
                size={36}
                color={foreground + "60"}
              />
            }
            title="No habits yet"
            description="Create your first habit to start tracking your progress"
          />
        )}
      </Container.Content>

      <Container.Footer>
        <Pressable
          onPress={() => router.push("/new-habit")}
          className="flex-row items-center justify-center py-4 rounded-2xl"
          style={{ backgroundColor: foreground }}
        >
          <Ionicons name="add" size={20} color={background} />
          <Text
            className="ml-2 text-base font-semibold"
            style={{ color: background }}
          >
            Create Habit
          </Text>
        </Pressable>
      </Container.Footer>
    </Container>
  );
}

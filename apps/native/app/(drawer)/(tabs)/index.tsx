import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Skeleton, SkeletonGroup, useThemeColor } from "heroui-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { AuthGuard } from "@/components/AuthGuard";
import { Container } from "@/components/container";
import { useHabits } from "@/hooks";
import { Id } from "@trakr/backend/convex/_generated/dataModel";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Animation config for smooth easing
const PROGRESS_ANIMATION_CONFIG = {
  duration: 400,
  easing: Easing.out(Easing.cubic),
};

// ============================================================================
// Animated Text Component - Displays smoothly animating numbers
// ============================================================================

type AnimatedCounterProps = {
  value: number;
  className?: string;
  style?: any;
};

function AnimatedCounter({ value, className, style }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const animatedValue = useSharedValue(value);

  // Animate to new value when it changes
  useEffect(() => {
    animatedValue.value = withTiming(value, PROGRESS_ANIMATION_CONFIG);
  }, [value, animatedValue]);

  // Update display value on the UI thread, then sync to JS
  useAnimatedReaction(
    () => Math.round(animatedValue.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplayValue)(current);
      }
    },
    [animatedValue],
  );

  return (
    <Text className={className} style={style}>
      {displayValue}
    </Text>
  );
}

// ============================================================================
// Types
// ============================================================================

type TodayHabit = {
  _id: Id<"habits">;
  name: string;
  icon?: string;
  color?: string;
  completedToday: boolean;
  streak: number;
};

// ============================================================================
// Constants
// ============================================================================

// Theme colors (matching global.css OKLCH values converted to hex)
const THEME_COLORS = {
  primary: "#7c3aed",
  success: "#22c55e",
  warning: "#f59e0b",
} as const;

const HABIT_COLORS: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  emerald: "#10b981",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",
};

const HABIT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  fitness: "fitness",
  book: "book",
  water: "water",
  bed: "bed",
  walk: "walk",
  bicycle: "bicycle",
  musical_notes: "musical-notes",
  code: "code-slash",
  heart: "heart",
  leaf: "leaf",
  moon: "moon",
  sunny: "sunny",
  cafe: "cafe",
  restaurant: "restaurant",
  medkit: "medkit",
  school: "school",
  brush: "brush",
  camera: "camera",
};

// ============================================================================
// Progress Ring Component
// ============================================================================

type ProgressRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
  allDone?: boolean;
};

function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  allDone,
}: ProgressRingProps) {
  const foreground = useThemeColor("foreground");
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Animated progress value
  const animatedProgress = useSharedValue(progress);
  const [displayPercent, setDisplayPercent] = useState(Math.round(progress));

  // Animate when progress changes
  useEffect(() => {
    animatedProgress.value = withTiming(progress, PROGRESS_ANIMATION_CONFIG);
  }, [progress, animatedProgress]);

  // Update display percentage on the UI thread
  useAnimatedReaction(
    () => Math.round(animatedProgress.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplayPercent)(current);
      }
    },
    [animatedProgress],
  );

  // Animated props for the stroke
  const animatedStrokeProps = useAnimatedProps(() => ({
    strokeDashoffset:
      circumference - (animatedProgress.value / 100) * circumference,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={foreground + "10"}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={allDone ? THEME_COLORS.success : THEME_COLORS.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedStrokeProps}
          strokeLinecap="round"
        />
      </Svg>
      {/* Center content */}
      <View className="absolute inset-0 items-center justify-center">
        {allDone ? (
          <Animated.View entering={FadeIn.duration(200)}>
            <Ionicons
              name="checkmark-circle"
              size={48}
              color={THEME_COLORS.success}
            />
          </Animated.View>
        ) : (
          <Text className="text-3xl font-bold" style={{ color: foreground }}>
            {displayPercent}%
          </Text>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// Quick Habit Tile - The main interaction element
// ============================================================================

type QuickHabitTileProps = {
  habit: TodayHabit;
  onToggle: () => void;
  onLongPress: () => void;
  index: number;
};

function QuickHabitTile({
  habit,
  onToggle,
  onLongPress,
  index,
}: QuickHabitTileProps) {
  const foreground = useThemeColor("foreground");
  const habitColor = habit.color
    ? (HABIT_COLORS[habit.color] ?? habit.color)
    : THEME_COLORS.primary;
  const iconName = habit.icon
    ? (HABIT_ICONS[habit.icon] ?? "ellipse")
    : "ellipse";

  const scale = useSharedValue(1);
  const completionProgress = useSharedValue(habit.completedToday ? 1 : 0);

  // Sync completion state when habit changes from server
  useEffect(() => {
    completionProgress.value = withTiming(habit.completedToday ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [habit.completedToday, completionProgress]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(
      habit.completedToday
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium,
    );

    scale.value = withSequence(
      withTiming(0.96, { duration: 60 }),
      withTiming(1, { duration: 120 }),
    );

    completionProgress.value = withTiming(habit.completedToday ? 0 : 1, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });

    onToggle();
  }, [habit.completedToday, onToggle, scale, completionProgress]);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onLongPress();
  }, [onLongPress]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: completionProgress.value }],
    opacity: completionProgress.value,
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      completionProgress.value,
      [0, 1],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          completionProgress.value,
          [0, 1],
          [1, 0.8],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const tileWidth = (SCREEN_WIDTH - 48 - 12) / 2; // 48 = padding, 12 = gap
  const isCompleted = habit.completedToday;

  return (
    <Animated.View
      entering={FadeInUp.delay(50 + index * 30).duration(250)}
      style={[animatedContainerStyle, { width: tileWidth }]}
    >
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={400}
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: isCompleted ? habitColor : foreground + "08",
          borderWidth: 1,
          borderColor: isCompleted ? habitColor : foreground + "12",
        }}
      >
        <View className="p-4">
          {/* Top row: Icon + Streak */}
          <View className="flex-row items-center justify-between mb-3">
            {/* Icon / Check Container */}
            <View
              className="w-11 h-11 rounded-xl items-center justify-center"
              style={{
                backgroundColor: isCompleted
                  ? "rgba(255,255,255,0.2)"
                  : foreground + "08",
              }}
            >
              {/* Checkmark (shows when completed) */}
              <Animated.View
                style={[animatedCheckStyle, { position: "absolute" }]}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
              </Animated.View>

              {/* Icon (shows when not completed) */}
              <Animated.View
                style={[animatedIconStyle, { position: "absolute" }]}
              >
                <Ionicons name={iconName} size={22} color={foreground + "70"} />
              </Animated.View>
            </View>

            {/* Streak - always rendered for consistent height */}
            <View
              className="flex-row items-center rounded-full px-2 py-1"
              style={{
                backgroundColor: isCompleted
                  ? "rgba(255,255,255,0.15)"
                  : foreground + "08",
                opacity: habit.streak > 0 ? 1 : 0,
              }}
            >
              <Ionicons
                name="flame"
                size={12}
                color={isCompleted ? "#fff" : foreground + "50"}
              />
              <Text
                className="text-xs font-semibold ml-0.5"
                style={{ color: isCompleted ? "#fff" : foreground + "50" }}
              >
                {habit.streak || 0}
              </Text>
            </View>
          </View>

          {/* Habit Name */}
          <Text
            className="text-base font-semibold leading-tight"
            style={{ color: isCompleted ? "#fff" : foreground }}
            numberOfLines={2}
          >
            {habit.name}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ============================================================================
// Celebration Banner
// ============================================================================

function CelebrationBanner() {
  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(300)}
      className="mx-6 mb-6"
    >
      <View className="bg-gradient-to-r from-success/20 to-emerald-500/20 rounded-3xl p-5 border border-success/30">
        <View className="flex-row items-center">
          <View className="w-14 h-14 bg-success/30 rounded-2xl items-center justify-center mr-4">
            <Ionicons name="trophy" size={28} color={THEME_COLORS.success} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-success mb-0.5">
              Perfect day!
            </Text>
            <Text className="text-sm text-success/80">
              All habits completed. Keep the momentum going!
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Empty State
// ============================================================================

type EmptyStateProps = {
  onCreateHabit: () => void;
};

function EmptyState({ onCreateHabit }: EmptyStateProps) {
  const foreground = useThemeColor("foreground");

  return (
    <Animated.View
      entering={FadeIn.delay(50).duration(300)}
      className="flex-1 justify-center items-center px-8"
    >
      <View className="w-24 h-24 bg-default-100 rounded-full items-center justify-center mb-6">
        <Ionicons name="sunny-outline" size={48} color={foreground + "40"} />
      </View>

      <Text
        className="text-2xl font-bold text-center mb-2"
        style={{ color: foreground }}
      >
        Start your day right
      </Text>

      <Text className="text-base text-default-500 text-center mb-8 leading-6">
        Create habits you want to build and track them effortlessly every day.
      </Text>

      <Pressable
        onPress={onCreateHabit}
        className="bg-primary rounded-2xl py-4 px-8 flex-row items-center active:opacity-90"
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text className="text-white font-semibold text-base ml-2">
          Create First Habit
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ============================================================================
// Loading State - Skeleton Layout
// ============================================================================

function LoadingState() {
  const tileWidth = (SCREEN_WIDTH - 48 - 12) / 2;

  return (
    <Container safeAreaTop>
      <SkeletonGroup>
        {/* Header skeleton */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="px-6 pt-4 pb-6"
        >
          <View className="flex-row items-start justify-between">
            {/* Left side */}
            <View className="flex-1 mr-4">
              <Skeleton className="h-4 w-20 rounded mb-2" />
              <Skeleton className="h-8 w-24 rounded mb-2" />
              <Skeleton className="h-4 w-16 rounded" />

              <View className="flex-row items-baseline mt-4">
                <Skeleton className="h-12 w-10 rounded" />
                <Skeleton className="h-6 w-8 rounded ml-1" />
                <Skeleton className="h-4 w-20 rounded ml-2" />
              </View>
            </View>

            {/* Progress ring skeleton */}
            <Skeleton className="h-[100px] w-[100px] rounded-full" />
          </View>
        </Animated.View>

        {/* Section label skeleton */}
        <Animated.View
          entering={FadeIn.delay(50).duration(300)}
          className="px-6 pb-4"
        >
          <Skeleton className="h-3 w-28 rounded" />
        </Animated.View>

        {/* Habit tiles skeleton */}
        <Animated.View
          entering={FadeIn.delay(100).duration(300)}
          className="px-6"
        >
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={{ width: tileWidth }}
                className="rounded-2xl overflow-hidden"
              >
                <Skeleton className="h-[120px] w-full rounded-2xl" />
              </View>
            ))}
          </View>
        </Animated.View>
      </SkeletonGroup>
    </Container>
  );
}

// ============================================================================
// Header Component
// ============================================================================

type HeaderProps = {
  completedCount: number;
  totalCount: number;
  allDone: boolean;
};

function Header({ completedCount, totalCount, allDone }: HeaderProps) {
  const foreground = useThemeColor("foreground");
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateString = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      className="px-6 pt-4 pb-6"
    >
      <View className="flex-row items-start justify-between">
        {/* Left side - Date and greeting */}
        <View className="flex-1 mr-4">
          <Text className="text-sm font-medium text-default-400 uppercase tracking-wider mb-1">
            {dayName}
          </Text>
          <Text
            className="text-3xl font-bold tracking-tight mb-1"
            style={{ color: foreground }}
          >
            Today
          </Text>
          <Text className="text-base text-default-500">{dateString}</Text>

          {totalCount > 0 && (
            <View className="flex-row items-baseline mt-3">
              <AnimatedCounter
                value={completedCount}
                className="text-5xl font-bold"
                style={{ color: foreground }}
              />
              <Text className="text-2xl text-default-400 ml-1">
                /{totalCount}
              </Text>
              <Text className="text-sm text-default-500 ml-2">completed</Text>
            </View>
          )}
        </View>

        {/* Right side - Progress Ring */}
        {totalCount > 0 && (
          <ProgressRing
            progress={progressPercentage}
            size={100}
            strokeWidth={6}
            allDone={allDone}
          />
        )}
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Main Today Content
// ============================================================================

function TodayContent() {
  const router = useRouter();
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");
  const { todaysHabits, toggleCompletion, isLoading } = useHabits();

  // Track if we've ever loaded data to avoid flash on tab switch
  const hasLoadedOnce = useRef(false);
  if (todaysHabits !== undefined) {
    hasLoadedOnce.current = true;
  }

  const handleToggle = useCallback(
    async (habitId: string) => {
      try {
        await toggleCompletion({ habitId: habitId as Id<"habits"> });
      } catch (error) {
        console.error("Failed to toggle habit:", error);
      }
    },
    [toggleCompletion],
  );

  const handleViewHabit = useCallback(
    (habitId: string) => {
      router.push(`/habits/${habitId}`);
    },
    [router],
  );

  const handleCreateHabit = useCallback(() => {
    router.push("/new-habit");
  }, [router]);

  // Memoized calculations
  const { completedCount, totalCount, allDone } = useMemo(() => {
    const habits = todaysHabits ?? [];
    const completed = habits.filter((h) => h.completedToday);

    return {
      completedCount: completed.length,
      totalCount: habits.length,
      allDone: habits.length > 0 && completed.length === habits.length,
    };
  }, [todaysHabits]);

  // Only show loading skeleton on initial load, not on tab switches
  if (isLoading && !hasLoadedOnce.current) {
    return <LoadingState />;
  }

  if (!todaysHabits || todaysHabits.length === 0) {
    return (
      <Container scrollable={false} safeAreaTop>
        <EmptyState onCreateHabit={handleCreateHabit} />
      </Container>
    );
  }

  return (
    <Container safeAreaTop>
      {/* Header with progress */}
      <Header
        completedCount={completedCount}
        totalCount={totalCount}
        allDone={allDone}
      />

      <Container.Content padded={false}>
        {/* All habits in a single grid - no separation */}
        <View className="px-6 pb-6">
          <Animated.Text
            entering={FadeIn.delay(30).duration(200)}
            className="text-xs font-semibold text-default-400 uppercase tracking-widest mb-4"
          >
            {allDone ? "All done!" : "Tap to complete"}
          </Animated.Text>

          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {todaysHabits.map((habit, index) => (
              <QuickHabitTile
                key={habit._id}
                habit={habit}
                onToggle={() => handleToggle(habit._id)}
                onLongPress={() => handleViewHabit(habit._id)}
                index={index}
              />
            ))}
          </View>
        </View>
      </Container.Content>

      {/* Floating Add Button */}
      <Animated.View
        entering={FadeInUp.delay(150).duration(250)}
        className="absolute bottom-6 right-6"
      >
        <Pressable
          onPress={handleCreateHabit}
          className="w-14 h-14 rounded-full bg-foreground items-center justify-center shadow-lg active:scale-95"
          style={{ backgroundColor: foreground }}
        >
          <Ionicons name="add" size={28} color={background} />
        </Pressable>
      </Animated.View>
    </Container>
  );
}

// ============================================================================
// Main Export
// ============================================================================

export default function TodayScreen() {
  return (
    <AuthGuard>
      <TodayContent />
    </AuthGuard>
  );
}

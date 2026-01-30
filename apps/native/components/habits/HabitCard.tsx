import { Ionicons } from "@expo/vector-icons";
import { Card, cn, useThemeColor } from "heroui-native";
import { Pressable, View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

type HabitCardProps = {
  name: string;
  icon?: string;
  color?: string;
  completed: boolean;
  streak: number;
  onToggle: () => void;
  onPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

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

export function HabitCard({
  name,
  icon,
  color,
  completed,
  streak,
  onToggle,
  onPress,
  onSwipeLeft,
  onSwipeRight,
}: HabitCardProps) {
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");
  const habitColor = color ? HABIT_COLORS[color] ?? color : foreground;
  const iconName = icon ? HABIT_ICONS[icon] ?? "ellipse" : "ellipse";

  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);
  const checkScale = useSharedValue(1);
  const cardScale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = contextX.value + event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -100 && onSwipeLeft) {
        onSwipeLeft();
      } else if (event.translationX > 100 && onSwipeRight) {
        onSwipeRight();
      }
      translateX.value = withSpring(0);
    });

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    checkScale.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
    onToggle();
  };

  const handlePress = () => {
    if (onPress) {
      cardScale.value = withSequence(
        withTiming(0.98, { duration: 100 }),
        withSpring(1, { damping: 15, stiffness: 400 })
      );
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle} entering={FadeIn.duration(400)}>
        <Animated.View style={cardAnimatedStyle}>
          <Pressable onPress={handlePress}>
            <Card
              variant="secondary"
              className={cn(
                "p-4 mb-3 border border-default-100",
                completed && "bg-default-50"
              )}
            >
              <View className="flex-row items-center">
                {/* Checkbox / Icon */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggle();
                  }}
                  className="mr-4"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Animated.View
                    style={[
                      checkAnimatedStyle,
                      {
                        borderColor: completed ? "transparent" : habitColor + "40",
                        backgroundColor: completed ? habitColor : habitColor + "10",
                        borderWidth: completed ? 0 : 2,
                      },
                    ]}
                    className={cn(
                      "w-12 h-12 rounded-2xl items-center justify-center",
                      completed && "shadow-sm"
                    )}
                  >
                    {completed ? (
                      <Ionicons name="checkmark" size={28} color={background} />
                    ) : (
                      <Ionicons name={iconName} size={22} color={habitColor} />
                    )}
                  </Animated.View>
                </Pressable>

                {/* Content */}
                <View className="flex-1 mr-3">
                  <Text
                    className={cn(
                      "text-base font-semibold tracking-tight",
                      completed && "line-through opacity-60"
                    )}
                    style={{ color: foreground }}
                    numberOfLines={1}
                  >
                    {name}
                  </Text>
                  {streak > 0 && (
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="flame" size={14} color="#f59e0b" />
                      <Text className="ml-1 text-sm font-medium text-amber-500">
                        {streak} day streak
                      </Text>
                    </View>
                  )}
                </View>

                {/* Chevron indicator */}
                {onPress && (
                  <View className="w-8 h-8 rounded-full bg-default-100 items-center justify-center">
                    <Ionicons name="chevron-forward" size={18} color={foreground + "60"} />
                  </View>
                )}
              </View>
            </Card>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

export { HABIT_COLORS, HABIT_ICONS };

import { View, Text } from "react-native";
import { cn, useThemeColor } from "heroui-native";

type WeekViewProps = {
  dates: string[];
  completions: Record<string, boolean>;
  scheduledDays?: number[];
  color?: string;
};

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const COLORS: Record<string, string> = {
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

function getDayOfWeek(dateStr: string): number {
  const date = new Date(dateStr + "T00:00:00");
  return date.getDay();
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
}

export function WeekView({ dates, completions, scheduledDays, color }: WeekViewProps) {
  const foreground = useThemeColor("foreground");
  const activeColor = color ? COLORS[color] ?? color : foreground;

  return (
    <View className="flex-row justify-between">
      {dates.map((date, index) => {
        const completed = completions[date] ?? false;
        const dow = getDayOfWeek(date);
        const isScheduled = scheduledDays ? scheduledDays.includes(dow) : true;
        const today = isToday(date);

        return (
          <View key={date} className="items-center">
            <Text
              className={cn(
                "text-xs mb-1",
                today ? "font-bold" : "font-normal"
              )}
              style={{ color: today ? activeColor : foreground }}
            >
              {DAY_LABELS[index]}
            </Text>
            <View
              className={cn(
                "w-8 h-8 rounded-full items-center justify-center",
                !isScheduled && "opacity-30"
              )}
              style={{
                backgroundColor: completed ? activeColor : "transparent",
                borderWidth: isScheduled ? 2 : 1,
                borderColor: completed ? activeColor : foreground + "40",
              }}
            >
              {completed && (
                <Text className="text-white text-xs font-bold">
                  ✓
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

type CompactWeekViewProps = {
  dates: string[];
  completions: Record<string, boolean>;
  color?: string;
};

export function CompactWeekView({ dates, completions, color }: CompactWeekViewProps) {
  const foreground = useThemeColor("foreground");
  const activeColor = color ? COLORS[color] ?? color : "#22c55e";

  return (
    <View className="flex-row gap-1">
      {dates.map((date) => {
        const completed = completions[date] ?? false;
        return (
          <View
            key={date}
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: completed ? activeColor : foreground + "30",
            }}
          />
        );
      })}
    </View>
  );
}

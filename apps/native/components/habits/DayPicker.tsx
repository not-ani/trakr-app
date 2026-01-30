import { Pressable, View, Text } from "react-native";
import { cn, useThemeColor } from "heroui-native";

const DAYS = [
  { label: "S", value: 0 },
  { label: "M", value: 1 },
  { label: "T", value: 2 },
  { label: "W", value: 3 },
  { label: "T", value: 4 },
  { label: "F", value: 5 },
  { label: "S", value: 6 },
];

const PRESETS = [
  { label: "Every day", days: [0, 1, 2, 3, 4, 5, 6] },
  { label: "Weekdays", days: [1, 2, 3, 4, 5] },
  { label: "Weekends", days: [0, 6] },
];

type DayPickerProps = {
  selectedDays: number[];
  onChange: (days: number[]) => void;
};

export function DayPicker({ selectedDays, onChange }: DayPickerProps) {
  const foreground = useThemeColor("foreground");

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day].sort());
    }
  };

  const applyPreset = (days: number[]) => {
    onChange(days);
  };

  return (
    <View>
      <View className="flex-row justify-between mb-4">
        {DAYS.map((day) => (
          <Pressable
            key={day.value}
            onPress={() => toggleDay(day.value)}
            className={cn(
              "w-10 h-10 rounded-full items-center justify-center",
              selectedDays.includes(day.value)
                ? "bg-primary"
                : "bg-default-100"
            )}
          >
            <Text
              className={cn(
                "font-semibold",
                selectedDays.includes(day.value)
                  ? "text-primary-foreground"
                  : "text-foreground"
              )}
              style={{
                color: selectedDays.includes(day.value) ? "#fff" : foreground,
              }}
            >
              {day.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row gap-2">
        {PRESETS.map((preset) => {
          const isActive =
            preset.days.length === selectedDays.length &&
            preset.days.every((d) => selectedDays.includes(d));

          return (
            <Pressable
              key={preset.label}
              onPress={() => applyPreset(preset.days)}
              className={cn(
                "px-3 py-1.5 rounded-full",
                isActive ? "bg-primary" : "bg-default-100"
              )}
            >
              <Text
                style={{
                  color: isActive ? "#fff" : foreground,
                }}
                className="text-sm"
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

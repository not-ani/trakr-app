import { Ionicons } from "@expo/vector-icons";
import { Pressable, View, ScrollView } from "react-native";
import { cn, useThemeColor } from "heroui-native";
import { HABIT_ICONS, HABIT_COLORS } from "./HabitCard";

type IconPickerProps = {
  selectedIcon?: string;
  selectedColor?: string;
  onChange: (icon: string) => void;
};

const ICONS = Object.entries(HABIT_ICONS);

export function IconPicker({ selectedIcon, selectedColor, onChange }: IconPickerProps) {
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");
  const activeColor = selectedColor ? HABIT_COLORS[selectedColor] ?? foreground : foreground;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2 py-2">
        {ICONS.map(([name, iconName]) => {
          const isSelected = selectedIcon === name;
          return (
            <Pressable
              key={name}
              onPress={() => onChange(name)}
              className={cn(
                "w-12 h-12 rounded-xl items-center justify-center",
                isSelected ? "bg-primary" : "bg-default-100"
              )}
              style={isSelected ? { backgroundColor: activeColor } : undefined}
            >
              <Ionicons
                name={iconName}
                size={24}
                color={isSelected ? background : foreground}
              />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

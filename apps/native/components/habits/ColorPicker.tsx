import { Ionicons } from "@expo/vector-icons";
import { Pressable, View, ScrollView } from "react-native";
import { cn, useThemeColor } from "heroui-native";
import { HABIT_COLORS } from "./HabitCard";

type ColorPickerProps = {
  selectedColor?: string;
  onChange: (color: string) => void;
};

const COLORS = Object.entries(HABIT_COLORS);

export function ColorPicker({ selectedColor, onChange }: ColorPickerProps) {
  const background = useThemeColor("background");

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2 py-2">
        {COLORS.map(([name, hex]) => (
          <Pressable
            key={name}
            onPress={() => onChange(name)}
            className={cn(
              "w-10 h-10 rounded-full items-center justify-center"
            )}
            style={{ backgroundColor: hex }}
          >
            {selectedColor === name && (
              <Ionicons name="checkmark" size={20} color={background} />
            )}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Card, useThemeColor } from "heroui-native";
import { DayPicker } from "./DayPicker";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";

export type HabitFormData = {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  scheduleDays: number[];
  reminderTime?: string;
  isPublic: boolean;
};

type HabitFormProps = {
  initialData?: Partial<HabitFormData>;
  onSubmit: (data: HabitFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
};

export function HabitForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  isLoading,
}: HabitFormProps) {
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [icon, setIcon] = useState(initialData?.icon ?? "fitness");
  const [color, setColor] = useState(initialData?.color ?? "blue");
  const [scheduleDays, setScheduleDays] = useState(
    initialData?.scheduleDays ?? [1, 2, 3, 4, 5],
  );
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true);

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (scheduleDays.length === 0) return;

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      scheduleDays,
      isPublic,
    });
  };

  const isValid = name.trim().length > 0 && scheduleDays.length > 0;

  return (
    <View className="gap-6 pt-6">
      <View>
        <Text className="text-sm font-semibold text-default-400 uppercase tracking-wider mb-3">
          Name
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g., Morning exercise"
          placeholderTextColor={foreground + "40"}
          className="bg-default-50 rounded-2xl px-4 text-base border border-default-100"
          style={{
            color: foreground,
            height: 56,
            textAlignVertical: "center",
          }}
        />
      </View>

      <View>
        <Text className="text-sm font-semibold text-default-400 uppercase tracking-wider mb-3">
          Description (optional)
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Add a description..."
          placeholderTextColor={foreground + "40"}
          multiline
          numberOfLines={2}
          className="bg-default-50 rounded-2xl px-4 py-4 text-base border border-default-100"
          style={{ color: foreground, textAlignVertical: "top", minHeight: 80 }}
        />
      </View>

      <View>
        <Text className="text-sm font-semibold text-default-400 uppercase tracking-wider mb-3">
          Icon
        </Text>
        <IconPicker
          selectedIcon={icon}
          selectedColor={color}
          onChange={setIcon}
        />
      </View>

      <View>
        <Text className="text-sm font-semibold text-default-400 uppercase tracking-wider mb-3">
          Color
        </Text>
        <ColorPicker selectedColor={color} onChange={setColor} />
      </View>

      <View>
        <Text className="text-sm font-semibold text-default-400 uppercase tracking-wider mb-3">
          Schedule
        </Text>
        <DayPicker selectedDays={scheduleDays} onChange={setScheduleDays} />
      </View>

      <View className="flex-row items-center justify-between py-4 px-4 bg-default-50 rounded-2xl border border-default-100">
        <View className="flex-1 mr-4">
          <Text
            className="text-base font-semibold"
            style={{ color: foreground }}
          >
            Visible to friends
          </Text>
          <Text className="text-sm text-default-500">
            Friends can see your progress
          </Text>
        </View>
        <Switch value={isPublic} onValueChange={setIsPublic} />
      </View>

      <View className="flex-row gap-3 pt-4">
        {onCancel && (
          <Pressable
            onPress={onCancel}
            className="flex-1 py-4 rounded-2xl bg-default-100"
          >
            <Text
              className="text-center font-semibold"
              style={{ color: foreground }}
            >
              Cancel
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleSubmit}
          disabled={!isValid || isLoading}
          className="flex-1 py-4 rounded-2xl flex-row items-center justify-center"
          style={{
            backgroundColor: foreground,
            opacity: !isValid || isLoading ? 0.5 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={background} />
          ) : (
            <Text
              className="text-center font-semibold"
              style={{ color: background }}
            >
              {submitLabel}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

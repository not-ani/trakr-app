import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function HabitsLayout() {
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: background,
        },
        headerTintColor: foreground,
        headerTitleStyle: {
          color: foreground,
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: "New Habit",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Edit Habit",
        }}
      />
    </Stack>
  );
}

import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function ProfileLayout() {
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
    </Stack>
  );
}

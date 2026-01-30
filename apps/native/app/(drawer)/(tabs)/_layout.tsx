import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";
import { View, Platform } from "react-native";

export default function TabLayout() {
  const themeColorForeground = useThemeColor("foreground");
  const themeColorBackground = useThemeColor("background");

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: themeColorBackground,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: themeColorForeground,
        headerTitleStyle: {
          color: themeColorForeground,
          fontWeight: "700",
          fontSize: 17,
        },
        tabBarStyle: {
          backgroundColor: themeColorBackground,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 12,
        },
        tabBarActiveTintColor: themeColorForeground,
        tabBarInactiveTintColor: themeColorForeground + "50",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 6,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`w-10 h-10 rounded-xl items-center justify-center ${focused ? "bg-foreground/10" : ""}`}
            >
              <Ionicons
                name={focused ? "today" : "today-outline"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: "Habits",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`w-10 h-10 rounded-xl items-center justify-center ${focused ? "bg-foreground/10" : ""}`}
            >
              <Ionicons
                name={focused ? "checkmark-circle" : "checkmark-circle-outline"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`w-10 h-10 rounded-xl items-center justify-center ${focused ? "bg-foreground/10" : ""}`}
            >
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`w-10 h-10 rounded-xl items-center justify-center ${focused ? "bg-foreground/10" : ""}`}
            >
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

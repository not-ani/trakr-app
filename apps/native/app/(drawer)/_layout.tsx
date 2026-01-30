import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import { useThemeColor } from "heroui-native";
import React, { useCallback } from "react";
import { View } from "react-native";

import { NotificationBadge } from "@/components/NotificationBadge";

function DrawerLayout() {
  const themeColorForeground = useThemeColor("foreground");
  const themeColorBackground = useThemeColor("background");

  const renderHeaderRight = useCallback(
    () => (
      <View className="mr-2">
        <NotificationBadge />
      </View>
    ),
    []
  );

  return (
    <Drawer
      screenOptions={{
        headerTintColor: themeColorForeground,
        headerStyle: { backgroundColor: themeColorBackground },
        headerTitleStyle: {
          fontWeight: "600",
          color: themeColorForeground,
        },
        headerRight: renderHeaderRight,
        drawerStyle: { backgroundColor: themeColorBackground },
        drawerActiveTintColor: themeColorForeground,
        drawerInactiveTintColor: themeColorForeground + "80",
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          drawerLabel: "Home",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="index"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer>
  );
}

export default DrawerLayout;

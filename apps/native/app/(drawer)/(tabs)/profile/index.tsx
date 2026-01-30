import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import { useState } from "react";
import { View, Text, Image, TextInput, Alert, ActivityIndicator, Pressable } from "react-native";
import { Button, Card, useThemeColor } from "heroui-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { api } from "@trakr/backend/convex/_generated/api";

import { AuthGuard } from "@/components/AuthGuard";
import { Container } from "@/components/container";
import { useCurrentUser, useHabits } from "@/hooks";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ProfileScreen() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const { signOut } = useAuth();
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");
  const { user, clerkUser, isLoading } = useCurrentUser();
  const { habits } = useHabits();

  const setUsername = useMutation(api.users.setUsername);

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSetUsername = async () => {
    if (!newUsername.trim()) return;

    setIsSubmitting(true);
    try {
      await setUsername({ username: newUsername.trim() });
      setIsEditingUsername(false);
      setNewUsername("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to set username");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  if (isLoading) {
    return (
      <Container safeAreaTop>
        <Container.Loading>
          <ActivityIndicator size="large" color={foreground} />
        </Container.Loading>
      </Container>
    );
  }

  const totalHabits = habits?.length ?? 0;
  const activeHabits = habits?.filter((h) => !h.isArchived).length ?? 0;

  return (
    <Container safeAreaTop>
      <Container.Content>
        {/* Profile Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          className="items-center pt-8 pb-6"
        >
          <View className="relative mb-4">
            <View className="w-28 h-28 rounded-full bg-default-100 items-center justify-center overflow-hidden border-4 border-background shadow-lg">
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={56} color={foreground + "40"} />
              )}
            </View>
            <View className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-primary items-center justify-center border-4 border-background">
              <Ionicons name="checkmark-done" size={18} color="#fff" />
            </View>
          </View>

          <Text
            className="text-2xl font-bold tracking-tight mb-1"
            style={{ color: foreground }}
          >
            {user?.displayName || clerkUser?.firstName || "User"}
          </Text>
          
          {user?.username ? (
            <Text className="text-base text-default-500">@{user.username}</Text>
          ) : (
            <Pressable
              onPress={() => setIsEditingUsername(true)}
              className="bg-default-100 rounded-full px-4 py-2 mt-1"
            >
              <Text className="text-sm text-default-500">+ Add username</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Username Editor */}
        {isEditingUsername && (
          <Animated.View
            entering={FadeIn.duration(300)}
            className="mx-6 mb-6"
          >
            <Card variant="secondary" className="p-5 border border-default-100">
              <Text
                className="text-base font-semibold mb-3"
                style={{ color: foreground }}
              >
                Choose a username
              </Text>
              <TextInput
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder="username"
                placeholderTextColor={foreground + "40"}
                className="bg-default-100 rounded-xl px-4 py-3.5 text-base mb-2"
                style={{ color: foreground }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text className="text-xs text-default-400 mb-4">
                3-20 characters, letters, numbers, and underscores only
              </Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setIsEditingUsername(false);
                    setNewUsername("");
                  }}
                  className="flex-1 py-3 rounded-xl bg-default-100"
                >
                  <Text
                    className="text-center font-semibold"
                    style={{ color: foreground }}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSetUsername}
                  disabled={!newUsername.trim() || isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-foreground"
                  style={{
                    backgroundColor: foreground,
                    opacity: !newUsername.trim() || isSubmitting ? 0.5 : 1,
                  }}
                >
                  <Text className="text-center font-semibold" style={{ color: background }}>
                    {isSubmitting ? "Saving..." : "Save"}
                  </Text>
                </Pressable>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Stats Cards */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          className="px-6 mb-6"
        >
          <View className="flex-row gap-3">
            <View className="flex-1 bg-default-50 rounded-2xl p-4 border border-default-100">
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mb-3">
                <Ionicons name="checkmark-circle" size={22} color="#6366f1" />
              </View>
              <Text
                className="text-2xl font-bold tracking-tight"
                style={{ color: foreground }}
              >
                {activeHabits}
              </Text>
              <Text className="text-sm text-default-500">Active Habits</Text>
            </View>
            <View className="flex-1 bg-default-50 rounded-2xl p-4 border border-default-100">
              <View className="w-10 h-10 rounded-xl bg-amber-500/10 items-center justify-center mb-3">
                <Ionicons name="list" size={22} color="#f59e0b" />
              </View>
              <Text
                className="text-2xl font-bold tracking-tight"
                style={{ color: foreground }}
              >
                {totalHabits}
              </Text>
              <Text className="text-sm text-default-500">Total Habits</Text>
            </View>
          </View>
        </Animated.View>

        {/* Settings Section */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500)}
          className="px-6"
        >
          <Text className="text-sm font-semibold text-default-400 uppercase tracking-wider mb-3">
            Settings
          </Text>

          {/* Theme Toggle */}
          <Card variant="secondary" className="mb-3 border border-default-100">
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-xl bg-default-100 items-center justify-center mr-3">
                  <Ionicons name="moon" size={20} color={foreground} />
                </View>
                <View>
                  <Text
                    className="text-base font-medium"
                    style={{ color: foreground }}
                  >
                    Dark Mode
                  </Text>
                  <Text className="text-sm text-default-500">
                    Toggle app theme
                  </Text>
                </View>
              </View>
              <ThemeToggle />
            </View>
          </Card>

          {/* Email Info */}
          <Card variant="secondary" className="mb-3 border border-default-100">
            <View className="flex-row items-center p-4">
              <View className="w-10 h-10 rounded-xl bg-default-100 items-center justify-center mr-3">
                <Ionicons name="mail" size={20} color={foreground} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-default-500">Email</Text>
                <Text
                  className="text-base font-medium"
                  style={{ color: foreground }}
                  numberOfLines={1}
                >
                  {user?.email}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Sign Out */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          className="px-6 pt-6 pb-8"
        >
          <Pressable
            onPress={handleSignOut}
            className="flex-row items-center justify-center py-4 rounded-2xl border-2 border-danger/30 bg-danger/5"
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="ml-2 text-base font-semibold text-danger">
              Sign Out
            </Text>
          </Pressable>
        </Animated.View>
      </Container.Content>
    </Container>
  );
}

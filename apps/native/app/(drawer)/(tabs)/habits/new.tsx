import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { Container } from "@/components/container";
import { HabitForm, type HabitFormData } from "@/components/habits";
import { useHabits } from "@/hooks";

export default function NewHabitScreen() {
  const router = useRouter();
  const { createHabit } = useHabits();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: HabitFormData) => {
    setIsLoading(true);
    try {
      await createHabit({
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        scheduleDays: data.scheduleDays,
        reminderTime: data.reminderTime,
        isPublic: data.isPublic,
      });
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to create habit. Please try again.");
      console.error("Failed to create habit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="p-6" safeAreaTop>
      <HabitForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel="Create Habit"
        isLoading={isLoading}
      />
    </Container>
  );
}

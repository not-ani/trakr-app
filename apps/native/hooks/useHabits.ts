import { useMutation, useQuery } from "convex/react";
import { api } from "@trakr/backend/convex/_generated/api";
import { Id } from "@trakr/backend/convex/_generated/dataModel";

// Note: These hooks should only be used inside <Authenticated> or <AuthGuard>
// The parent component guarantees the user is authenticated

export function useHabits() {
  const habits = useQuery(api.habits.list, { includeArchived: false });
  const todaysHabits = useQuery(api.habits.getTodaysHabits);
  const weekCompletions = useQuery(api.habits.getWeekCompletions, {});

  const createHabit = useMutation(api.habits.create);
  const updateHabit = useMutation(api.habits.update);
  const archiveHabit = useMutation(api.habits.archive);
  const toggleCompletion = useMutation(api.habits.toggleCompletion);

  return {
    habits,
    todaysHabits,
    weekCompletions,
    createHabit,
    updateHabit,
    archiveHabit,
    toggleCompletion,
    isLoading: habits === undefined || todaysHabits === undefined,
  };
}

export function useHabit(habitId: Id<"habits"> | undefined) {
  const habit = useQuery(
    api.habits.get,
    habitId ? { id: habitId } : "skip"
  );
  const streak = useQuery(
    api.habits.getStreak,
    habitId ? { habitId } : "skip"
  );
  const weekCompletions = useQuery(
    api.habits.getWeekCompletions,
    habitId ? { habitId } : "skip"
  );

  const updateHabit = useMutation(api.habits.update);
  const archiveHabit = useMutation(api.habits.archive);
  const toggleCompletion = useMutation(api.habits.toggleCompletion);

  return {
    habit,
    streak,
    weekCompletions,
    updateHabit,
    archiveHabit,
    toggleCompletion,
    isLoading: habit === undefined,
  };
}

export function useHabitCompletions(
  habitId: Id<"habits"> | undefined,
  startDate: string,
  endDate: string
) {
  const completions = useQuery(
    api.habits.getCompletionsForRange,
    habitId ? { habitId, startDate, endDate } : "skip"
  );

  return {
    completions,
    isLoading: completions === undefined,
  };
}

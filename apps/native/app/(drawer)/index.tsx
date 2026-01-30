import { Redirect } from "expo-router";

export default function DrawerIndex() {
  // Redirect to tabs
  return <Redirect href="/(drawer)/(tabs)" />;
}

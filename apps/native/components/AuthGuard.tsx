import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Redirect } from "expo-router";
import { useThemeColor } from "heroui-native";
import { type ReactNode } from "react";
import { View, ActivityIndicator } from "react-native";

import { Container } from "./container";

type AuthGuardProps = {
  children: ReactNode;
};

function LoadingScreen() {
  const foreground = useThemeColor("foreground");
  return (
    <Container className="p-6">
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={foreground} />
      </View>
    </Container>
  );
}

function UnauthenticatedRedirect() {
  return <Redirect href="/(auth)/sign-in" />;
}

export function AuthGuard({ children }: AuthGuardProps) {
  return (
    <>
      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
      <Authenticated>
        {children}
      </Authenticated>
    </>
  );
}

import { useSignIn, useSSO } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useThemeColor } from "heroui-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Warm up browser on Android for faster auth
const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Handle pending auth sessions
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  useWarmUpBrowser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");

  const { startSSOFlow } = useSSO();
  const { signIn, setActive, isLoaded } = useSignIn();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err: any) {
      console.error("Google sign in error:", JSON.stringify(err, null, 2));
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [startSSOFlow, router]);

  const handleEmailSignIn = useCallback(async () => {
    if (!isLoaded) return;
    if (!identifier.trim() || !password) {
      setError("Please enter your email/username and password");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const signInAttempt = await signIn.create({
        identifier: identifier,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        // Handle additional verification steps if needed
        console.log("Sign in status:", signInAttempt.status);
        setError("Additional verification may be required");
      }
    } catch (err: any) {
      console.error("Email sign in error:", JSON.stringify(err, null, 2));
      const errorMessage =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Invalid email or password";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signIn, setActive, identifier, password, router]);

  if (showEmailForm) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {/* Decorative background elements */}
        <View className="absolute inset-0 overflow-hidden">
          <View className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/5" />
          <View className="absolute top-48 -left-24 w-48 h-48 rounded-full bg-secondary/5" />
        </View>

        <View className="flex-1 px-8 justify-between">
          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(500).springify()}
            className="pt-6"
          >
            <Pressable
              onPress={() => {
                setShowEmailForm(false);
                setError(null);
              }}
              className="flex-row items-center mb-8"
            >
              <Ionicons name="arrow-back" size={24} color={foreground} />
              <Text
                className="text-base ml-2"
                style={{ color: foreground }}
              >
                Back
              </Text>
            </Pressable>

            <Text
              className="text-3xl font-bold tracking-tight mb-2"
              style={{ color: foreground }}
            >
              Welcome back
            </Text>
            <Text className="text-base text-default-500">
              Sign in to continue building habits
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.delay(100).duration(500).springify()}
            className="gap-4"
          >
            {error && (
              <Animated.View
                entering={FadeIn.duration(300)}
                className="bg-danger/10 border border-danger/20 rounded-2xl px-4 py-3"
              >
                <Text className="text-danger text-sm">{error}</Text>
              </Animated.View>
            )}

            <View>
              <Text className="text-sm font-semibold text-default-400 uppercase tracking-wider mb-2">
                Email or Username
              </Text>
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Enter your email or username"
                placeholderTextColor={foreground + "40"}
                autoCapitalize="none"
                className="bg-default-50 rounded-2xl px-4 text-base border border-default-100"
                style={{
                  color: foreground,
                  height: 56,
                  textAlignVertical: "center",
                }}
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-default-400 uppercase tracking-wider mb-2">
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={foreground + "40"}
                secureTextEntry
                autoComplete="password"
                className="bg-default-50 rounded-2xl px-4 text-base border border-default-100"
                style={{
                  color: foreground,
                  height: 56,
                  textAlignVertical: "center",
                }}
              />
            </View>
          </Animated.View>

          {/* Bottom Actions */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(500).springify()}
            className="pb-8 gap-4"
          >
            <Pressable
              onPress={handleEmailSignIn}
              disabled={isLoading}
              className="bg-foreground rounded-2xl py-4 px-6 items-center justify-center active:opacity-90"
              style={{
                backgroundColor: foreground,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={background} />
              ) : (
                <Text
                  className="text-lg font-semibold"
                  style={{ color: background }}
                >
                  Sign In
                </Text>
              )}
            </Pressable>

            <View className="flex-row items-center justify-center gap-1">
              <Text className="text-default-500">Don't have an account?</Text>
              <Link href="/(auth)/sign-up" asChild>
                <Pressable>
                  <Text className="text-primary font-semibold">Sign up</Text>
                </Pressable>
              </Link>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Decorative background elements */}
      <View className="absolute inset-0 overflow-hidden">
        <Animated.View
          entering={FadeIn.delay(200).duration(1000)}
          className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/5"
        />
        <Animated.View
          entering={FadeIn.delay(400).duration(1000)}
          className="absolute top-48 -left-24 w-48 h-48 rounded-full bg-secondary/5"
        />
        <Animated.View
          entering={FadeIn.delay(600).duration(1000)}
          className="absolute bottom-32 -right-16 w-40 h-40 rounded-full bg-success/5"
        />
      </View>

      <View className="flex-1 px-8 justify-between">
        {/* Top section with logo and branding */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(700).springify()}
          className="items-center pt-16"
        >
          <View className="w-20 h-20 rounded-3xl bg-primary items-center justify-center mb-6 shadow-lg">
            <Ionicons name="checkmark-done" size={40} color="#fff" />
          </View>
          <Text
            className="text-4xl font-bold tracking-tight mb-2"
            style={{ color: foreground }}
          >
            trakr
          </Text>
          <Text className="text-lg text-default-500 text-center">
            Build habits that stick
          </Text>
        </Animated.View>

        {/* Middle section with features */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(700).springify()}
          className="py-8"
        >
          <FeatureRow
            icon="trending-up"
            title="Track Progress"
            description="Monitor your daily habits and watch yourself improve"
            delay={400}
          />
          <FeatureRow
            icon="people"
            title="Stay Accountable"
            description="Connect with friends to keep each other motivated"
            delay={500}
          />
          <FeatureRow
            icon="flame"
            title="Build Streaks"
            description="Maintain consistency and celebrate your wins"
            delay={600}
          />
        </Animated.View>

        {/* Bottom section with sign in options */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(700).springify()}
          className="pb-8"
        >
          {error && (
            <Animated.View
              entering={FadeIn.duration(300)}
              className="bg-danger/10 border border-danger/20 rounded-2xl px-4 py-3 mb-4"
            >
              <Text className="text-danger text-sm text-center">{error}</Text>
            </Animated.View>
          )}

         

          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-default-200" />
            <Text className="px-4 text-default-400 text-sm">or</Text>
            <View className="flex-1 h-px bg-default-200" />
          </View>

          <Pressable
            onPress={() => setShowEmailForm(true)}
            className="rounded-2xl py-4 px-6 flex-row items-center justify-center border border-default-200 active:bg-default-50"
          >
            <Ionicons name="mail-outline" size={22} color={foreground} />
            <Text
              className="text-lg font-semibold ml-3"
              style={{ color: foreground }}
            >
              Continue with Email
            </Text>
          </Pressable>

          <View className="flex-row items-center justify-center gap-1 mt-4">
            <Text className="text-default-500">Don't have an account?</Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <Text className="text-primary font-semibold">Sign up</Text>
              </Pressable>
            </Link>
          </View>

          <Text className="text-center text-sm text-default-400 px-4 mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

function FeatureRow({
  icon,
  title,
  description,
  delay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  delay: number;
}) {
  const foreground = useThemeColor("foreground");

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(500)}
      className="flex-row items-start mb-6"
    >
      <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-4">
        <Ionicons name={icon} size={24} color={foreground} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold mb-1" style={{ color: foreground }}>
          {title}
        </Text>
        <Text className="text-sm text-default-500 leading-5">{description}</Text>
      </View>
    </Animated.View>
  );
}

function GoogleIcon() {
  return (
    <View className="w-6 h-6 items-center justify-center">
      <View className="w-5 h-5 items-center justify-center">
        <Text style={{ fontSize: 18 }}>G</Text>
      </View>
    </View>
  );
}

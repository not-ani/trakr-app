import { useSignUp, useSSO } from "@clerk/clerk-expo";
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

export default function SignUpScreen() {
  useWarmUpBrowser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");

  const { startSSOFlow } = useSSO();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignUp = useCallback(async () => {
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
      console.error("Google sign up error:", JSON.stringify(err, null, 2));
      setError("Failed to sign up with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [startSSOFlow, router]);

  const handleEmailSignUp = useCallback(async () => {
    if (!isLoaded) return;
    if (!emailAddress.trim()) {
      setError("Please enter your email");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await signUp.create({
        emailAddress,
        password,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      console.error("Email sign up error:", JSON.stringify(err, null, 2));
      const errorMessage =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Failed to create account";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signUp, emailAddress, password]);

  const handleVerifyEmail = useCallback(async () => {
    if (!isLoaded) return;
    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/");
      } else {
        console.log("Verification status:", signUpAttempt.status);
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification error:", JSON.stringify(err, null, 2));
      const errorMessage =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Invalid verification code";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signUp, setActive, code, router]);

  const [resendSuccess, setResendSuccess] = useState(false);

  const resendCode = useCallback(async () => {
    if (!isLoaded || !signUp) return;

    // Check if there's an active sign-up attempt
    if (!signUp.status) {
      setError("Session expired. Please start over.");
      setPendingVerification(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResendSuccess(false);
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err: any) {
      console.error("Resend code error:", JSON.stringify(err, null, 2));
      const errorMessage =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Failed to resend code. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signUp]);

  // Verification code screen
  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {/* Decorative background elements */}
        <View className="absolute inset-0 overflow-hidden">
          <View className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/5" />
          <View className="absolute top-48 -left-24 w-48 h-48 rounded-full bg-success/5" />
        </View>

        <View className="flex-1 px-8 justify-between">
          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(500).springify()}
            className="pt-6"
          >
            <Pressable
              onPress={() => {
                setPendingVerification(false);
                setCode("");
                setError(null);
              }}
              className="flex-row items-center mb-8"
            >
              <Ionicons name="arrow-back" size={24} color={foreground} />
              <Text className="text-base ml-2" style={{ color: foreground }}>
                Back
              </Text>
            </Pressable>

            <View className="w-16 h-16 rounded-2xl bg-success/10 items-center justify-center mb-6">
              <Ionicons name="mail" size={32} color={foreground} />
            </View>

            <Text
              className="text-3xl font-bold tracking-tight mb-2"
              style={{ color: foreground }}
            >
              Verify your email
            </Text>
            <Text className="text-base text-default-500">
              We sent a verification code to{"\n"}
              <Text className="font-semibold" style={{ color: foreground }}>
                {emailAddress}
              </Text>
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
                Verification Code
              </Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="Enter 6-digit code"
                placeholderTextColor={foreground + "40"}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                maxLength={6}
                className="bg-default-50 rounded-2xl px-4 text-base border border-default-100 text-center tracking-widest"
                style={{
                  color: foreground,
                  height: 56,
                  textAlignVertical: "center",
                  fontSize: 24,
                  letterSpacing: 8,
                }}
              />
            </View>

            {resendSuccess ? (
              <Animated.View entering={FadeIn.duration(300)}>
                <Text className="text-success text-center font-medium">
                  Verification code sent!
                </Text>
              </Animated.View>
            ) : (
              <Pressable onPress={resendCode} disabled={isLoading}>
                <Text className="text-primary text-center">
                  Didn't receive the code?{" "}
                  <Text className="font-semibold">Resend</Text>
                </Text>
              </Pressable>
            )}
          </Animated.View>

          {/* Bottom Actions */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(500).springify()}
            className="pb-8"
          >
            <Pressable
              onPress={handleVerifyEmail}
              disabled={isLoading || code.length < 6}
              className="bg-foreground rounded-2xl py-4 px-6 items-center justify-center active:opacity-90"
              style={{
                backgroundColor: foreground,
                opacity: isLoading || code.length < 6 ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={background} />
              ) : (
                <Text
                  className="text-lg font-semibold"
                  style={{ color: background }}
                >
                  Verify Email
                </Text>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Email form screen
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
              <Text className="text-base ml-2" style={{ color: foreground }}>
                Back
              </Text>
            </Pressable>

            <Text
              className="text-3xl font-bold tracking-tight mb-2"
              style={{ color: foreground }}
            >
              Create account
            </Text>
            <Text className="text-base text-default-500">
              Start your habit tracking journey
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
                Email
              </Text>
              <TextInput
                value={emailAddress}
                onChangeText={setEmailAddress}
                placeholder="Enter your email"
                placeholderTextColor={foreground + "40"}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
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
                placeholder="Create a password (min 8 characters)"
                placeholderTextColor={foreground + "40"}
                secureTextEntry
                autoComplete="new-password"
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
              onPress={handleEmailSignUp}
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
                  Create Account
                </Text>
              )}
            </Pressable>

            <View className="flex-row items-center justify-center gap-1">
              <Text className="text-default-500">Already have an account?</Text>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable>
                  <Text className="text-primary font-semibold">Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Main sign up screen
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
            Join trakr
          </Text>
          <Text className="text-lg text-default-500 text-center">
            Start building habits today
          </Text>
        </Animated.View>

        {/* Middle section with benefits */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(700).springify()}
          className="py-8"
        >
          <BenefitRow
            icon="checkmark-circle"
            text="Free to use, no credit card required"
            delay={400}
          />
          <BenefitRow
            icon="shield-checkmark"
            text="Your data is private and secure"
            delay={500}
          />
          <BenefitRow
            icon="sync"
            text="Sync across all your devices"
            delay={600}
          />
        </Animated.View>

        {/* Bottom section with sign up options */}
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

          <Pressable
            onPress={handleGoogleSignUp}
            disabled={isLoading}
            className="bg-foreground rounded-2xl py-4 px-6 flex-row items-center justify-center mb-3 active:opacity-90"
            style={{ backgroundColor: foreground, opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={background} />
            ) : (
              <>
                <View className="w-6 h-6 mr-3">
                  <GoogleIcon />
                </View>
                <Text
                  className="text-lg font-semibold"
                  style={{ color: background }}
                >
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

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
              Sign up with Email
            </Text>
          </Pressable>

          <View className="flex-row items-center justify-center gap-1 mt-4">
            <Text className="text-default-500">Already have an account?</Text>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable>
                <Text className="text-primary font-semibold">Sign in</Text>
              </Pressable>
            </Link>
          </View>

          <Text className="text-center text-sm text-default-400 px-4 mt-4">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

function BenefitRow({
  icon,
  text,
  delay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  delay: number;
}) {
  const foreground = useThemeColor("foreground");

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(500)}
      className="flex-row items-center mb-4"
    >
      <View className="w-8 h-8 rounded-full bg-success/10 items-center justify-center mr-3">
        <Ionicons name={icon} size={18} color="#22c55e" />
      </View>
      <Text className="text-base text-default-600" style={{ color: foreground }}>
        {text}
      </Text>
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

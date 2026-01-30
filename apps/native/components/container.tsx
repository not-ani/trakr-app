import { cn } from "heroui-native";
import { type PropsWithChildren, type ReactNode } from "react";
import { ScrollView, View, type ViewProps, type ScrollViewProps } from "react-native";
import Animated, { type AnimatedProps, FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedView = Animated.createAnimatedComponent(View);

// ============================================================================
// Container Root - Main wrapper with safe area handling
// ============================================================================

type ContainerRootProps = AnimatedProps<ViewProps> & {
  className?: string;
  /** Whether to use scroll view for content */
  scrollable?: boolean;
  /** Props passed to the internal ScrollView when scrollable is true */
  scrollViewProps?: Omit<ScrollViewProps, "children">;
  /** Whether to add bottom safe area padding */
  safeAreaBottom?: boolean;
  /** Whether to add top safe area padding */
  safeAreaTop?: boolean;
};

function ContainerRoot({
  children,
  className,
  scrollable = true,
  scrollViewProps,
  safeAreaBottom = true,
  safeAreaTop = false,
  ...props
}: PropsWithChildren<ContainerRootProps>) {
  const insets = useSafeAreaInsets();

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <AnimatedView
      entering={FadeIn.duration(300)}
      className={cn("flex-1 bg-background", className)}
      style={{
        paddingBottom: safeAreaBottom ? insets.bottom : 0,
        paddingTop: safeAreaTop ? insets.top : 0,
      }}
      {...props}
    >
      {content}
    </AnimatedView>
  );
}

// ============================================================================
// Container Header - Top section for titles and actions
// ============================================================================

type ContainerHeaderProps = {
  children: ReactNode;
  className?: string;
};

function ContainerHeader({ children, className }: ContainerHeaderProps) {
  return (
    <Animated.View
      entering={FadeIn.delay(100).duration(400)}
      className={cn("px-6 pt-6 pb-4", className)}
    >
      {children}
    </Animated.View>
  );
}

// ============================================================================
// Container Content - Main content area with consistent padding
// ============================================================================

type ContainerContentProps = {
  children: ReactNode;
  className?: string;
  /** Add horizontal padding */
  padded?: boolean;
};

function ContainerContent({ children, className, padded = true }: ContainerContentProps) {
  return (
    <Animated.View
      entering={FadeIn.delay(150).duration(400)}
      className={cn("flex-1", padded && "px-6", className)}
    >
      {children}
    </Animated.View>
  );
}

// ============================================================================
// Container Footer - Bottom section for actions
// ============================================================================

type ContainerFooterProps = {
  children: ReactNode;
  className?: string;
};

function ContainerFooter({ children, className }: ContainerFooterProps) {
  return (
    <Animated.View
      entering={FadeIn.delay(200).duration(400)}
      className={cn("px-6 pb-6 pt-4", className)}
    >
      {children}
    </Animated.View>
  );
}

// ============================================================================
// Container Empty State - Consistent empty state display
// ============================================================================

type ContainerEmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

function ContainerEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: ContainerEmptyStateProps) {
  return (
    <Animated.View
      entering={FadeIn.delay(200).duration(500)}
      className={cn("flex-1 justify-center items-center py-12 px-6", className)}
    >
      <View className="w-20 h-20 bg-default-100 rounded-3xl items-center justify-center mb-6">
        {icon}
      </View>
      <Animated.Text
        entering={FadeIn.delay(300).duration(400)}
        className="text-xl font-semibold text-foreground mb-2 text-center"
      >
        {title}
      </Animated.Text>
      <Animated.Text
        entering={FadeIn.delay(350).duration(400)}
        className="text-base text-default-500 text-center mb-8 leading-6"
      >
        {description}
      </Animated.Text>
      {action && (
        <Animated.View entering={FadeIn.delay(400).duration(400)}>{action}</Animated.View>
      )}
    </Animated.View>
  );
}

// ============================================================================
// Container Loading - Consistent loading state
// ============================================================================

type ContainerLoadingProps = {
  children: ReactNode;
  className?: string;
};

function ContainerLoading({ children, className }: ContainerLoadingProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className={cn("flex-1 justify-center items-center", className)}
    >
      {children}
    </Animated.View>
  );
}

// ============================================================================
// Compound Component Export
// ============================================================================

export const Container = Object.assign(ContainerRoot, {
  Header: ContainerHeader,
  Content: ContainerContent,
  Footer: ContainerFooter,
  EmptyState: ContainerEmptyState,
  Loading: ContainerLoading,
});

// Legacy export for backward compatibility
export { ContainerRoot as LegacyContainer };

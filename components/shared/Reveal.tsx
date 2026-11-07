import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useReducedMotion,
} from "react-native-reanimated";
import { duration, ease, stagger } from "@/constants/motion";

// Section entrance for non-virtualized screens: opacity + a short rise, 40ms
// apart and capped, so the page assembles top-down without ever making the
// bottom wait. Plays once on mount; never wrap rows of a virtualized list.
export function Reveal({
  index = 0,
  children,
  style,
}: {
  index?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReducedMotion();
  const delay = Math.min(index, stagger.max) * stagger.step;
  return (
    <Animated.View
      entering={
        reduce
          ? FadeIn.duration(duration.small)
          : FadeInDown.delay(delay).duration(duration.enter).easing(ease.out)
      }
      style={style}
    >
      {children}
    </Animated.View>
  );
}

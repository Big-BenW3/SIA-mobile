import { useState, type Ref } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from "react-native";
import Animated, {
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { theme } from "@/constants/theme";
import { duration, ease } from "@/constants/motion";
import { themedStyles } from "@/components/themedStyles";
import { EyeIcon, EyeOffIcon } from "./Icons";

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  revealable,
  multiline,
  error,
  hint,
  inputRef,
  ...input
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  /** With `secureTextEntry`: adds a show/hide toggle. */
  revealable?: boolean;
  multiline?: boolean;
  error?: string;
  /** Helper copy under the input; hidden while an error is showing. */
  hint?: string;
  /** Lets a form focus the next field on "next". */
  inputRef?: Ref<TextInputInstance>;
} & Pick<
  TextInputProps,
  | "keyboardType"
  | "autoCapitalize"
  | "autoComplete"
  | "autoCorrect"
  | "returnKeyType"
  | "onSubmitEditing"
  | "maxLength"
  | "editable"
  | "textContentType"
  | "submitBehavior"
>) {
  const reduce = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  const f = useSharedValue(0);

  const ring = useAnimatedStyle(() => ({
    borderColor: error
      ? theme.colors.danger
      : interpolateColor(
          f.get(),
          [0, 1],
          [theme.colors.border, theme.colors.primary],
        ),
  }));

  const setFocus = (on: boolean) => {
    setFocused(on);
    f.set(
      withTiming(on ? 1 : 0, { duration: duration.small, easing: ease.out }),
    );
  };

  const hidden = !!secureTextEntry && !shown;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View
        style={[styles.ring, ring, focused && !error && styles.ringFocused]}
      >
        <TextInput
          {...input}
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.secondary}
          secureTextEntry={hidden}
          multiline={multiline}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          accessibilityLabel={label}
          style={[
            styles.input,
            revealable && styles.inputWithToggle,
            multiline && { minHeight: 96, textAlignVertical: "top" },
          ]}
        />
        {revealable && secureTextEntry ? (
          <Pressable
            onPress={() => setShown((s) => !s)}
            hitSlop={8}
            style={styles.toggle}
            accessibilityRole="button"
            accessibilityLabel={shown ? "Hide password" : "Show password"}
          >
            {shown ? (
              <EyeOffIcon color={theme.colors.secondary} />
            ) : (
              <EyeIcon color={theme.colors.secondary} />
            )}
          </Pressable>
        ) : null}
      </Animated.View>
      {!!error ? (
        <Animated.Text
          entering={reduce ? undefined : FadeIn.duration(duration.small)}
          style={styles.error}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Animated.Text>
      ) : !!hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = themedStyles(() =>
  StyleSheet.create({
    wrap: { marginBottom: theme.spacing.sm },
    label: {
      ...theme.type.caption,
      fontWeight: "700",
      fontFamily: theme.font.bold,
      color: theme.colors.text,
      marginBottom: 8,
    },
    ring: {
      borderWidth: 1,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.input,
      flexDirection: "row",
      alignItems: "center",
    },
    ringFocused: { backgroundColor: theme.colors.surface },
    input: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
      minHeight: 48,
      ...theme.type.body,
      // 16px floor: smaller inputs make iOS zoom the page on focus (web)
      fontSize: 16,
      color: theme.colors.text,
    },
    inputWithToggle: { paddingRight: 0 },
    toggle: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    error: { ...theme.type.caption, color: theme.colors.danger, marginTop: 4 },
    hint: {
      ...theme.type.caption,
      color: theme.colors.secondary,
      marginTop: 4,
    },
  }),
);

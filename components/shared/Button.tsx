import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';
import { themedStyles } from '@/components/themedStyles';

export function Button({
  title,
  onPress,
  variant = 'primary',
  style,
  disabled = false,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        disabled && { opacity: 0.4 },
        pressed && !disabled && { opacity: 0.85 },
        style,
      ]}>
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.labelPrimary,
          variant === 'secondary' && styles.labelSecondary,
          variant === 'danger' && styles.labelDanger,
          variant === 'ghost' && styles.labelGhost,
        ]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = themedStyles(() => StyleSheet.create({
  base: {
    minHeight: 48, // 44pt+ tap target
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.softBlue, borderWidth: 1, borderColor: theme.colors.border },
  danger: { backgroundColor: theme.colors.danger },
  ghost: { backgroundColor: 'transparent' },
  label: { ...theme.type.body, fontWeight: '700', fontFamily: theme.font.bold, color: theme.colors.text },
  labelPrimary: { color: theme.colors.onPrimary },
  labelSecondary: { color: theme.colors.accent },
  labelDanger: { color: theme.colors.onPrimary },
  labelGhost: { color: theme.colors.accent },
}));

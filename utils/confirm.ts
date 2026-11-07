import { Alert, Platform } from "react-native";

// Confirmation that works everywhere. React Native's Alert.alert is a silent
// no-op on web, which would make every "are you sure?" button do nothing
// there. Native gets the system alert; web gets window.confirm.
export function confirmAction({
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
}: {
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
}): Promise<boolean> {
  if (Platform.OS === "web") {
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(
      typeof window !== "undefined" && typeof window.confirm === "function"
        ? window.confirm(text)
        : false,
    );
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

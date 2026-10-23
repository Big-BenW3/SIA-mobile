import {
  StyleSheet,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from "react-native";

// ─── Themed styles ─────────────────────────────────────────────────
// Screens build their StyleSheet at module scope from the design tokens:
//
//   const styles = themedStyles(() => StyleSheet.create({ … theme.colors.… }));
//
// The factory runs once, lazily, on first property access and the result is
// memoised for the lifetime of the module. Tokens no longer change at runtime
// (the app is light-only), so nothing needs to re-render when the theme does —
// which is why there is no provider and no subscription hook.

export function themedStyles<T extends object>(factory: () => T): T {
  let sheet: T | undefined;

  const resolve = (): T => {
    if (!sheet) {
      sheet = StyleSheet.create(
        factory() as Record<string, ViewStyle | TextStyle | ImageStyle>,
      ) as unknown as T;
    }
    return sheet;
  };

  return new Proxy({} as T, {
    get: (_target, prop) =>
      (resolve() as Record<string | symbol, unknown>)[prop],
    has: (_target, prop) => Reflect.has(resolve() as object, prop),
    ownKeys: () => Reflect.ownKeys(resolve() as object),
    getOwnPropertyDescriptor: (_target, prop) =>
      Reflect.getOwnPropertyDescriptor(resolve() as object, prop) ?? {
        configurable: true,
        enumerable: true,
        value: (resolve() as Record<string | symbol, unknown>)[prop],
      },
  });
}

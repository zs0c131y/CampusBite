# CampusBite Development Rules

## Check related items for consistency
When fixing or changing something (font, image URL, color, layout), always scan for other components/screens that render the same kind of data and apply the same fix there too. Example: if StoreCard has a broken image URL, MenuItemCard likely has the same bug. Never leave outliers.

## Font in React Native
- Never use `fontWeight` to get bold/semibold text — on Android this falls back to the system font. Always use the explicit Inter variant: `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`.
- React Native Paper `Searchbar`'s `inputStyle` does not reliably apply `fontFamily` to placeholder text on Android. Replace it with a plain RN `TextInput` + icon wrapper when font consistency is needed.
- Avoid `new URL()` at module level in React Native — Hermes can fail silently. Use regex (`BASE_URL.match(/^https?:\/\/[^/]*/)?.[0]`) to extract the server origin.

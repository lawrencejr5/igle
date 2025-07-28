import { View, StatusBar, Platform, useColorScheme } from "react-native";
import React from "react";

import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SafeArea({ children }: any) {
  const insets = useSafeAreaInsets();

  const colorScheme = useColorScheme();

  return (
    <View
      style={{
        paddingTop: 50,
        paddingBottom: 5,
        flex: 1,
      }}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />
      {children}
    </View>
  );
}

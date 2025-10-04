import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";

const DriverTabsLayout = () => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#121212",
        paddingBottom: insets.bottom,
      }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
};

export default DriverTabsLayout;

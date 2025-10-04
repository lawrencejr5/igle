import React from "react";

import { Stack } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DriverAuthLayout = () => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#121212",
        paddingBottom: insets.bottom,
      }}
    >
      <Stack
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      />
    </View>
  );
};

export default DriverAuthLayout;

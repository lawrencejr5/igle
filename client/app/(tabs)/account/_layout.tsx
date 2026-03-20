import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

const AccountLayout = () => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#121212",
      }}
    >
      <Stack
        screenOptions={{ headerShown: false, animation: "ios_from_right" }}
      />
    </View>
  );
};

export default AccountLayout;

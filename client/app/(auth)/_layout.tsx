import { StyleSheet, Text, View } from "react-native";
import React from "react";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Stack } from "expo-router";

const AuthLayout = () => {
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
        screenOptions={{
          headerShown: false,
        }}
      />
    </View>
  );
};

export default AuthLayout;

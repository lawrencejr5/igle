import { StyleSheet, Text, View } from "react-native";
import React from "react";

import { Stack } from "expo-router";

const AuthLayout = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </View>
  );
};

export default AuthLayout;

import { View, useColorScheme } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const RideLayout = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "ios_from_right",
        }}
      />
    </View>
  );
};

export default RideLayout;

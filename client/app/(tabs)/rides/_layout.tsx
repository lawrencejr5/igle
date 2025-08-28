import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { NavigationContainer } from "@react-navigation/native";

const RideLayout = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: {
            backgroundColor: "#121212",
          },
        }}
      />
    </View>
  );
};

export default RideLayout;

import { View } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const RestaurantAuthLayout = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "ios_from_right",
          contentStyle: { backgroundColor: "#121212" },
        }}
      />
    </View>
  );
};

export default RestaurantAuthLayout;

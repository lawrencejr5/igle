import { View } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const HomeLayout = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </View>
  );
};

export default HomeLayout;

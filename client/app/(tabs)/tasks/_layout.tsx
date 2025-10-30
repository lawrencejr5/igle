import { View, useColorScheme } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const TasksLayout = () => {
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

export default TasksLayout;

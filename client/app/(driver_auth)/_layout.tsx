import React from "react";

import { Stack } from "expo-router";

const DriverAuthLayout = () => {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    />
  );
};

export default DriverAuthLayout;

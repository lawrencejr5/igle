import React, { useState } from "react";
import { Stack } from "expo-router";
import SafeArea from "../components/SafeArea";

import * as SystemUI from "expo-system-ui";

const RootLayout = () => {
  const [theme, setTheme] = useState("dark");
  SystemUI.setBackgroundColorAsync(theme === "dark" ? "#121212" : "#fff");
  return (
    <SafeArea>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeArea>
  );
};

export default RootLayout;

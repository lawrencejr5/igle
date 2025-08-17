import React, { useState } from "react";
import { Stack } from "expo-router";
import SafeArea from "../components/SafeArea";

import * as SystemUI from "expo-system-ui";
import { useFonts } from "expo-font";

import SplashScreen from "./splash_screen";

import AuthProvider from "../context/AuthContext";
import NotificationProvider from "../context/NotificationContext";
import DriverAuthProvider from "../context/DriverAuthContext";
import RideContextProvider from "../context/RideContext";
import MapContextProvider from "../context/MapContext";
import WalletProvider from "../context/WalletContext";

const RootLayout = () => {
  const [theme, setTheme] = useState("dark");
  SystemUI.setBackgroundColorAsync(theme === "dark" ? "#121212" : "#fff");

  const [fontsLoaded] = useFonts({
    "raleway-bold": require("../assets/fonts/raleway/Raleway-Bold.ttf"),
    "raleway-regular": require("../assets/fonts/raleway/Raleway-Regular.ttf"),
    "raleway-semibold": require("../assets/fonts/raleway/Raleway-SemiBold.ttf"),
    "raleway-black": require("../assets/fonts/raleway/Raleway-Black.ttf"),
    "poppins-regular": require("../assets/fonts/poppins/Poppins-Regular.ttf"),
    "poppins-bold": require("../assets/fonts/poppins/Poppins-Bold.ttf"),
    "poppins-black": require("../assets/fonts/poppins/Poppins-Black.ttf"),
  });

  if (!fontsLoaded) {
    return <SplashScreen />;
  }

  return (
    <NotificationProvider>
      <WalletProvider>
        <AuthProvider>
          <DriverAuthProvider>
            <MapContextProvider>
              <RideContextProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                  }}
                />
              </RideContextProvider>
            </MapContextProvider>
          </DriverAuthProvider>
        </AuthProvider>
      </WalletProvider>
    </NotificationProvider>
  );
};

export default RootLayout;

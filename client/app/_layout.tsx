import React, { useState, useEffect } from "react";
import { Stack } from "expo-router";
import SafeArea from "../components/SafeArea";

import * as SystemUI from "expo-system-ui";
import { useFonts } from "expo-font";

import SplashScreen from "./splash_screen";

import LoadingProvider from "../context/LoadingContext";
import AuthProvider from "../context/AuthContext";
import NotificationProvider from "../context/NotificationContext";
import DriverAuthProvider from "../context/DriverAuthContext";
import RideContextProvider from "../context/RideContext";
import MapContextProvider from "../context/MapContext";
import WalletProvider from "../context/WalletContext";
import DriverContextPrvider from "../context/DriverContext";

import { GestureHandlerRootView } from "react-native-gesture-handler";

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LoadingProvider>
        <NotificationProvider>
          <WalletProvider>
            <MapContextProvider>
              <DriverAuthProvider>
                <AuthProvider>
                  <DriverContextPrvider>
                    <RideContextProvider>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                        }}
                      />
                    </RideContextProvider>
                  </DriverContextPrvider>
                </AuthProvider>
              </DriverAuthProvider>
            </MapContextProvider>
          </WalletProvider>
        </NotificationProvider>
      </LoadingProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;

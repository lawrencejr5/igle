import React, { useState, useEffect } from "react";
import { Stack } from "expo-router";
import SafeArea from "../components/SafeArea";

import axios from "axios";

import * as SystemUI from "expo-system-ui";
import { useFonts } from "expo-font";

import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";

import SplashScreen from "./splash_screen";

import AuthProvider from "../context/AuthContext";
import NotificationProvider from "../context/NotificationContext";
import DriverAuthProvider from "../context/DriverAuthContext";
import RideContextProvider from "../context/RideContext";
import MapContextProvider from "../context/MapContext";
import WalletProvider, { useWalletContext } from "../context/WalletContext";
import DriverContextPrvider from "../context/DriverContext";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URLS } from "../data/constants";

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
        <DriverAuthProvider>
          <AuthProvider>
            <MapContextProvider>
              <DriverContextPrvider>
                <RideContextProvider>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                    }}
                  />
                </RideContextProvider>
              </DriverContextPrvider>
            </MapContextProvider>
          </AuthProvider>
        </DriverAuthProvider>
      </WalletProvider>
    </NotificationProvider>
  );
};

export default RootLayout;

import React, { useEffect, useState } from "react";

import SplashScreen from "./splash_screen";
import { router } from "expo-router";

import { useAuthContext } from "../context/AuthContext";
import { useOnboardingContext } from "../context/OnboardingContext";
import * as WebBrowser from "expo-web-browser";

// Important for web and to stabilize redirect completion
WebBrowser.maybeCompleteAuthSession();

const StartScreen = () => {
  const { isAuthenticated, signedIn, googleLogin } = useAuthContext()!;
  const { hasCompletedOnboarding, isLoading: onboardingLoading } =
    useOnboardingContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimeout = setTimeout(() => {
      setLoading(false);

      // Check onboarding first for non-authenticated users
      if (!isAuthenticated && !onboardingLoading) {
        if (!hasCompletedOnboarding) {
          router.replace("/onboarding");
          return;
        } else {
          router.replace("/get_started");
          return;
        }
      }

      // Then check authentication
      if (isAuthenticated) {
        if (signedIn?.is_driver) {
          router.replace("/(driver)/home");
        } else {
          router.replace("/(tabs)/home");
        }
      }
    }, 2000);

    return () => clearTimeout(loadTimeout);
  }, [isAuthenticated, signedIn, hasCompletedOnboarding, onboardingLoading]);

  if (loading) {
    return <SplashScreen />;
  }

  return <></>;
};

export default StartScreen;

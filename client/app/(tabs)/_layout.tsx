import { Image, View, Animated } from "react-native";
import React, { useMemo } from "react";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSegments } from "expo-router";

import { Tabs } from "expo-router";

const TabsLayout = () => {
  const insets = useSafeAreaInsets();

  const segments = useSegments() as string[];

  const hideTabs =
    (segments[1] === "rides" && segments[2] === "ride_detail") ||
    (segments[1] === "account" && segments[2] === "personal_details") ||
    (segments[1] === "account" && segments[2] === "saved_places") ||
    (segments[1] === "account" && segments[2] === "notifications") ||
    (segments[1] === "account" && segments[2] === "security");

  // animated value for smooth transitions
  const tabOpacity = useMemo(() => new Animated.Value(1), []);

  React.useEffect(() => {
    Animated.timing(tabOpacity, {
      toValue: hideTabs ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [hideTabs]);

  return (
    <View
      style={{
        backgroundColor: "#121212",
        flex: 1,
        paddingBottom: insets.bottom,
      }}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: 70,
            borderTopWidth: 0,
            elevation: 0,
            display: hideTabs ? "none" : undefined,
            opacity: tabOpacity as unknown as number, // RN style wants number, Animated works fine
            transform: [
              {
                translateY: tabOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [80, 0], // slide down when hiding
                }),
              },
            ],
          },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#606060",
          tabBarLabelStyle: { fontFamily: "raleway-semibold", fontSize: 10 },
          tabBarBackground: () => (
            <View
              style={{
                flex: 1,
                overflow: "hidden",
                backgroundColor: "#121212",
              }}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => (
              <Image
                source={
                  focused
                    ? require("../../assets/images/icons/home-fill.png")
                    : require("../../assets/images/icons/home-fill-grey.png")
                }
                style={{ height: 25, width: 25 }}
                resizeMode="contain"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="rides"
          options={{
            title: "Rides",
            tabBarIcon: ({ focused }) => (
              <Image
                source={
                  focused
                    ? require("../../assets/images/icons/schedule-fill.png")
                    : require("../../assets/images/icons/schedule-fill-grey.png")
                }
                style={{ height: 25, width: 25 }}
                resizeMode="contain"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: "Account",
            tabBarIcon: ({ focused }) => (
              <Image
                source={
                  focused
                    ? require("../../assets/images/icons/user-fill.png")
                    : require("../../assets/images/icons/user-fill-grey.png")
                }
                style={{ height: 25, width: 25 }}
                resizeMode="contain"
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
};

export default TabsLayout;

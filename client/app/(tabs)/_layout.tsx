import { Image, View, Animated } from "react-native";
import React, { useMemo } from "react";

import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useSegments } from "expo-router";

import { Tabs } from "expo-router";

const TabsLayout = () => {
  const segments = useSegments() as string[];

  const hideTabs = segments[1] === "rides" && segments[2] === "ride_detail";

  return (
    <GestureHandlerRootView>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            paddingTop: 10,
            height: 80,
            borderTopWidth: 0,
            elevation: 0,
            display: hideTabs ? "none" : undefined,
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
    </GestureHandlerRootView>
  );
};

export default TabsLayout;

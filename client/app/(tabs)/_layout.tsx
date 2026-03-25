import { Image, View, Animated } from "react-native";
import React, { useMemo } from "react";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSegments } from "expo-router";

import * as Haptics from "expo-haptics";

import { Tabs } from "expo-router";

const TabsLayout = () => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: "#121212",
        flex: 1,
        paddingBottom: insets.bottom - 10,
      }}
    >
      <Tabs
        screenListeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        }}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: 70,
            borderTopWidth: 0,
            elevation: 0,
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
                source={require("../../assets/images/icons/home-fill-grey.png")}
                style={{
                  height: 22,
                  width: 22,
                  tintColor: focused ? "#fff" : "#797979",
                }}
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
                source={require("../../assets/images/icons/schedule-fill.png")}
                style={{
                  height: 25,
                  width: 25,
                  tintColor: focused ? "#fff" : "#797979",
                }}
                resizeMode="contain"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="delivery"
          options={{
            title: "Deliveries",
            tabBarIcon: ({ focused }) => (
              <Image
                source={require("../../assets/images/icons/delivery-tab-icon.png")}
                style={{
                  height: 25,
                  width: 25,
                  tintColor: focused ? "#fff" : "#797979",
                }}
                resizeMode="contain"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: "Tasks",
            tabBarIcon: ({ focused }) => (
              <Image
                source={require("../../assets/images/icons/task-icon.png")}
                style={{
                  height: 22,
                  width: 22,
                  tintColor: focused ? "#fff" : "#797979",
                }}
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
                source={require("../../assets/images/icons/user-fill.png")}
                style={{
                  height: 22,
                  width: 22,
                  tintColor: focused ? "#fff" : "#797979",
                }}
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

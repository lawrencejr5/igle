import { Image, StyleSheet, View } from "react-native";
import React from "react";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import { BlurView } from "expo-blur";

import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          marginBottom: 5,
          marginHorizontal: 15,
          borderRadius: 20,
          paddingTop: 10,
          height: 70,
          backgroundColor: "transparent", // Key: make it transparent
          borderTopWidth: 0, // Hide default border
          elevation: 0, // Remove Android shadow
        },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#121212",
        tabBarLabelStyle: { fontFamily: "raleway-semibold", fontSize: 10 },
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              borderRadius: 20,
              overflow: "hidden",
              backgroundColor: "#ffffff50",
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
                  : require("../../assets/images/icons/home-regular-black.png")
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
                  : require("../../assets/images/icons/schedule-regular-black.png")
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
                  : require("../../assets/images/icons/user-regular-black.png")
              }
              style={{ height: 25, width: 25 }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;

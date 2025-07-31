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
          paddingTop: 10,
          height: 80,
          borderTopWidth: 0, // Hide default border
          elevation: 0, // Remove Android shadow
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
  );
};

export default TabsLayout;

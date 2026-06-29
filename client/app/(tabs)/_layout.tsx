import { Image, View, Platform } from "react-native";
import React from "react";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";

// ─── Tab definitions ─────────────────────────────────────────────────────────
const TABS = [
  {
    name: "home",
    label: "Home",
    sf: "house.fill",
    icon: require("../../assets/images/icons/home-fill-grey.png"),
  },
  {
    name: "rides",
    label: "Rides",
    sf: "car",
    icon: require("../../assets/images/icons/schedule-fill.png"),
  },
  {
    name: "delivery",
    label: "Deliveries",
    sf: "shippingbox.fill",
    icon: require("../../assets/images/icons/delivery-tab-icon.png"),
  },
  {
    name: "tasks",
    label: "Tasks",
    sf: "checkmark.square.fill",
    icon: require("../../assets/images/icons/task-icon.png"),
  },
  {
    name: "account",
    label: "Account",
    sf: "person.fill",
    icon: require("../../assets/images/icons/user-fill.png"),
  },
];

// ─── iOS Layout ───────────────────────────────────────────────────────────────
const IOSTabsLayout = () => {
  return (
    <View style={{ backgroundColor: "#121212", flex: 1 }}>
      <NativeTabs
        screenListeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        }}
        tintColor="#fff"
        iconColor={{ default: "#555555", selected: "#fff" }}
        labelStyle={{
          default: {
            color: "#555555",
            fontFamily: "raleway-semibold",
            fontSize: 10,
          },
          selected: {
            color: "#fff",
            fontFamily: "raleway-semibold",
            fontSize: 10,
          },
        }}
        backgroundColor="#1a1a1a"
        blurEffect="systemChromeMaterialDark"
        shadowColor="transparent"
      >
        {TABS.map((tab) => (
          <NativeTabs.Trigger
            key={tab.name}
            name={tab.name}
            disableAutomaticContentInsets={true}
          >
            <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              sf={tab.sf as any}
              src={tab.icon}
              renderingMode="template"
            />
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    </View>
  );
};

// ─── Android Layout ───────────────────────────────────────────────────────────
const AndroidTabsLayout = () => {
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

// ─── Root Layout ──────────────────────────────────────────────────────────────
const TabsLayout = () => {
  if (Platform.OS === "ios") {
    return <IOSTabsLayout />;
  }
  return <AndroidTabsLayout />;
};

export default TabsLayout;


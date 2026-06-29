import { Image, View, Animated } from "react-native";
import React, { useMemo } from "react";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSegments } from "expo-router";

import * as Haptics from "expo-haptics";

import { NativeTabs } from "expo-router/unstable-native-tabs";

const TabsLayout = () => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: "#121212",
        flex: 1,
      }}
    >
      <NativeTabs
        screenListeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        }}
        tintColor="#fff"
        iconColor={{ default: "#797979", selected: "#fff" }}
        labelStyle={{
          default: {
            color: "#797979",
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
        <NativeTabs.Trigger name="home" disableAutomaticContentInsets={true}>
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf="house.fill"
            src={require("../../assets/images/icons/home-fill-grey.png")}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="rides" disableAutomaticContentInsets={true}>
          <NativeTabs.Trigger.Label>Rides</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf="car"
            src={require("../../assets/images/icons/schedule-fill.png")}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger
          name="delivery"
          disableAutomaticContentInsets={true}
        >
          <NativeTabs.Trigger.Label>Deliveries</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf="box.truck.fill"
            src={require("../../assets/images/icons/delivery-tab-icon.png")}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="tasks" disableAutomaticContentInsets={true}>
          <NativeTabs.Trigger.Label>Tasks</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf="checkmark.square.fill"
            src={require("../../assets/images/icons/task-icon.png")}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="account" disableAutomaticContentInsets={true}>
          <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf="person.fill"
            src={require("../../assets/images/icons/user-fill.png")}
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </View>
  );
};

export default TabsLayout;

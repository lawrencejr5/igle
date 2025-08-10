import { StyleSheet, Text, View, Animated } from "react-native";
import React from "react";

import AntDesign from "@expo/vector-icons/AntDesign";

import {
  NotificationType,
  useNotificationContext,
  NotificationContextType,
} from "../context/NotificationContext";

const Notification = ({ notification }: { notification: NotificationType }) => {
  const { position, scale } =
    useNotificationContext() as NotificationContextType;

  const styles = create_styles();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: position }, { scale: scale }],
        },
      ]}
    >
      <View style={styles.notification}>
        <Text
          style={[
            styles.notiText,
            {
              color: notification?.status == "error" ? "#ff0000" : "#4dc900",
            },
          ]}
        >
          {notification?.message}
        </Text>
        <AntDesign
          name="exclamationcircle"
          size={16}
          color={notification?.status == "error" ? "#ff0000" : "#4dc900"}
        />
      </View>
    </Animated.View>
  );
};

export default Notification;

const create_styles = () =>
  StyleSheet.create({
    container: {
      position: "absolute",
      top: 40,
      zIndex: 2,
      width: "100%",
      flexDirection: "row",
      justifyContent: "center",
      padding: 10,
    },
    notification: {
      width: 300,
      backgroundColor: "#121212",
      borderWidth: 1,
      borderColor: "#575757",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      elevation: 5,
      padding: 10,
      borderRadius: 10,
    },
    notiText: {
      fontFamily: "raleway-bold",
    },
  });

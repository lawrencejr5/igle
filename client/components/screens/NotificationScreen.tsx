import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Feather from "@expo/vector-icons/Feather";

const NotificationScreen: React.FC<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ open, setOpen }) => {
  const window_height = Dimensions.get("window").height;
  const notiTranslate = useRef(new Animated.Value(window_height)).current;

  useEffect(() => {
    if (open)
      Animated.timing(notiTranslate, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
  }, [open]);

  const close = () => {
    Animated.timing(notiTranslate, {
      toValue: window_height,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setOpen(false));
  };
  return (
    <Animated.View
      style={{
        backgroundColor: "#121212",
        height: "100%",
        width: "100%",
        position: "absolute",
        bottom: -100,
        zIndex: 2,
        paddingTop: 50,
        paddingHorizontal: 20,
        transform: [{ translateY: notiTranslate }],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontFamily: "raleway-bold",
            fontSize: 25,
          }}
        >
          Notifications
        </Text>
        <TouchableWithoutFeedback onPress={close} style={{ padding: 10 }}>
          <FontAwesome5 name="times" size={24} color="#fff" />
        </TouchableWithoutFeedback>
      </View>
      {/* ...Notification content... */}
      <View style={{ marginTop: 15 }}>
        <View
          style={{
            marginTop: 20,
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <View
            style={{
              backgroundColor: "#5f5d5d",
              padding: 10,
              borderRadius: "50%",
            }}
          >
            <Feather name="bell" size={20} color={"#fff"} />
          </View>
          <View style={{ paddingRight: 25 }}>
            <Text
              numberOfLines={1}
              style={{
                color: "#fff",
                fontFamily: "raleway-semibold",
                paddingRight: 25,
              }}
            >
              Your ride to okpanam rd was accepted by so so time
            </Text>
            <Text
              style={{
                color: "#c9c9c9ff",
                fontFamily: "raleway-regular",
                fontSize: 12,
              }}
            >
              2 hrs ago
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({});

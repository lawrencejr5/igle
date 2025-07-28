import { StyleSheet, Text, View, Image } from "react-native";
import React from "react";

const SplashScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Image
        source={require("../assets/splash-screen.png")}
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({});

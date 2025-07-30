import { StyleSheet, Text, View, Image } from "react-native";
import { BlurView } from "expo-blur";
import React from "react";

const Rides = () => {
  return (
    <View style={{ flex: 1 }}>
      <Image
        source={require("../../assets/images/bgtest.jpg")}
        style={{ height: "100%", width: "100%" }}
        blurRadius={0}
      />

      <BlurView
        intensity={80}
        tint="light"
        style={{
          flex: 1,
          height: 300,
          width: 300,
          position: "absolute",
          zIndex: 1,
          top: 0,
          left: 0,
        }}
        experimentalBlurMethod="dimezisBlurView"
      >
        <View style={{ padding: 20 }}>
          <Text style={{ color: "white" }}>This should be frosty</Text>
        </View>
      </BlurView>
    </View>
  );
};

export default Rides;

const styles = StyleSheet.create({
  blurBox: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    height: 500,
    overflow: "hidden",
  },
});

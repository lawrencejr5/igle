import { StyleSheet, Text, View, Image } from "react-native";
import React from "react";

const Rides = () => {
  return <View style={{ flex: 1, backgroundColor: "#121212" }}></View>;
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

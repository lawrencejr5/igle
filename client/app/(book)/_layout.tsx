import { StyleSheet, View } from "react-native";
import React from "react";

import { Stack } from "expo-router";

const BookLayout = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <Stack
        screenOptions={{ headerShown: false, animation: "ios_from_right" }}
      />
    </View>
  );
};

export default BookLayout;

const styles = StyleSheet.create({});

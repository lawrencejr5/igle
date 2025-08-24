import { ActivityIndicator, StyleSheet, View } from "react-native";
import React from "react";

const AppLoading = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={"large"}
        color={"#fff"}
        style={{ transform: [{ scale: 1.5 }] }}
      />
    </View>
  );
};

export default AppLoading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});

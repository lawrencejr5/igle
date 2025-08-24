import { ActivityIndicator, StyleSheet, View } from "react-native";
import React from "react";

const RideLoading = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={"large"} color={"#fff"} />
    </View>
  );
};

export default RideLoading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});

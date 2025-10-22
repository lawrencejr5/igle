import { StyleSheet, Text, View } from "react-native";
import React from "react";

const RewardRoot = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header_text}>Rewards</Text>
    </View>
  );
};

export default RewardRoot;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header_text: {
    color: "#fff",
    marginTop: 10,
    fontFamily: "raleway-bold",
    fontSize: 30,
  },
});

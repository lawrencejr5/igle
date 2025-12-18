import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";

const { width, height } = Dimensions.get("window");

const OnboardingScreen2 = () => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require("../../assets/illustrations/delivery.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Fast Delivery</Text>
        <Text style={styles.description}>
          Send packages quickly and securely and track your deliveries in
          real-time.
        </Text>
      </View>
    </View>
  );
};

export default OnboardingScreen2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  image: {
    width: width * 0.9,
    height: height * 0.3,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: "raleway-black",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    fontFamily: "raleway-regular",
    color: "#b0b0b0",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 10,
  },
});

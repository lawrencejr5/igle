import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useEffect, useState } from "react";

import SplashScreen from "./splash_screen";
import { router } from "expo-router";

const StartScreen = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(loadTimeout);
  }, []);

  return (
    <>
      {loading ? (
        <SplashScreen />
      ) : (
        <View
          style={{
            backgroundColor: "#121212",
            flex: 1,
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              height: "auto",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 80,
            }}
          >
            <Image
              source={require("../assets/images/logo.png")}
              style={{ height: 300, width: 300 }}
            />
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-black",
                fontSize: 25,
                textAlign: "center",
                lineHeight: 35,
              }}
            >
              Let's get you started with Igle...
            </Text>
          </View>
          <View
            style={{
              justifyContent: "flex-end",
              flex: 1,
              alignItems: "center",
              marginBottom: 40,
            }}
          >
            <View style={styles.sign_btn}>
              <Image
                source={require("../assets/images/icons/apple-logo.png")}
                style={styles.sign_image}
              />
              <Text style={styles.sign_text}>Continue with Apple</Text>
            </View>
            <View style={styles.sign_btn}>
              <Image
                source={require("../assets/images/icons/google-logo.png")}
                style={styles.sign_image}
              />
              <Text style={styles.sign_text}>Continue with Google</Text>
            </View>
            <TouchableWithoutFeedback
              onPress={() => router.push("/(auth)/signin")}
            >
              <View style={styles.sign_btn}>
                <Image
                  source={require("../assets/images/icons/mail.png")}
                  style={styles.sign_image}
                />
                <Text style={styles.sign_text}>Continue with Email</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      )}
    </>
  );
};

export default StartScreen;

const styles = StyleSheet.create({
  sign_btn: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    width: 300,
    height: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    marginVertical: 10,
  },
  sign_image: {
    width: 24,
    height: 24,
  },
  sign_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
});

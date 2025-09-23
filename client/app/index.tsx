import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useEffect, useState } from "react";

import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URLS } from "../data/constants";

import SplashScreen from "./splash_screen";
import { router } from "expo-router";

import { useAuthContext } from "../context/AuthContext";

const StartScreen = () => {
  const { isAuthenticated, signedIn } = useAuthContext()!;

  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   console.log("use effect is working");

  //   const subscription = Linking.addEventListener("url", async (event) => {
  //     const url = event.url;
  //     const { path, queryParams } = Linking.parse(url); // Destructure 'path' as well

  //     // Check if the URL's path is 'payment-status'
  //     if (path === "paystack-redirect") {
  //       console.log("reached paystack redirect");

  //       // queryParams.reference comes from Paystack redirect
  //       if (queryParams?.reference) {
  //         console.log("Payment reference:", queryParams.reference);
  //         // Call your backend to verify
  //         const verify_payment = async (): Promise<void> => {
  //           const token = await AsyncStorage.getItem("token");
  //           try {
  //             const { data } = await axios.post(
  //               `${API_URLS.wallet}/verify?reference=${queryParams.reference}`,
  //               {},
  //               { headers: { Authorization: `Bearer ${token}` } }
  //             );
  //             console.log(data.msg, "success");
  //             router.push("/tabs/account");
  //           } catch (error: any) {
  //             const errMsg = error.response.data.message;
  //             console.log(errMsg, "error");
  //           }
  //         };
  //         verify_payment();
  //       }
  //     }
  //   });

  //   return () => subscription.remove();
  // }, []);

  useEffect(() => {
    const loadTimeout = setTimeout(() => {
      setLoading(false);
      if (isAuthenticated) {
        if (signedIn?.is_driver) {
          router.replace("/(driver)/home");
        } else {
          router.replace("/(tabs)/home");
        }
      }
    }, 2000);

    return () => clearTimeout(loadTimeout);
  }, [isAuthenticated, signedIn]);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <View
      style={{
        backgroundColor: "#121212",
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 10,
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
        <TouchableWithoutFeedback onPress={() => router.push("/(driver)/maps")}>
          <View style={styles.sign_btn}>
            <Image
              source={require("../assets/images/icons/apple-logo.png")}
              style={styles.sign_image}
            />
            <Text style={styles.sign_text}>Continue with Apple</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => router.push("/(tabs)/home")}>
          <View style={styles.sign_btn}>
            <Image
              source={require("../assets/images/icons/google-logo.png")}
              style={styles.sign_image}
            />
            <Text style={styles.sign_text}>Continue with Google</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => router.push("/(auth)/signin")}>
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

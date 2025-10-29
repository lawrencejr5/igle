// moved global auth session completion to root layout

import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";

import SplashScreen from "./splash_screen";
import { router } from "expo-router";

import { useAuthContext } from "../context/AuthContext";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";

import { useNotificationContext } from "../context/NotificationContext";

// Important for web and to stabilize redirect completion
WebBrowser.maybeCompleteAuthSession();

const StartScreen = () => {
  const { isAuthenticated, signedIn, googleLogin } = useAuthContext()!;
  const { showNotification } = useNotificationContext();
  const [loading, setLoading] = useState(true);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId:
      "560986315925-9qjotrnukbgrjgr38tov6qlnnnb22e9l.apps.googleusercontent.com",
    androidClientId:
      "560986315925-jp1mifmadqaali679m5kjvca78i4k4im.apps.googleusercontent.com",
    iosClientId:
      "560986315925-l1fa67ik629n47t903oaaiogta3us7nt.apps.googleusercontent.com",
    scopes: ["profile", "email"],
    redirectUri: makeRedirectUri({ path: "", scheme: "com.lawrencejr.igle" }),
  });

  const [googleAuthLoading, setGoogleAuthLoading] = useState<boolean>(false);

  React.useEffect(() => {
    if (!response) return;

    if (response.type === "success") {
      // Prefer authentication.idToken on native, fallback to params for web
      const idToken =
        (response as any).authentication?.idToken || response.params?.id_token;

      if (!idToken) {
        setGoogleAuthLoading(false);
        showNotification("Google sign-in failed: missing id token", "error");
        return;
      }
      setGoogleAuthLoading(true);
      googleLogin(idToken)
        .catch(() => showNotification("Signin failed, try again", "error"))
        .finally(() => setGoogleAuthLoading(false));
    } else if (response.type === "dismiss" || response.type === "cancel") {
      // Clear loading if user canceled/closes the tab
      setGoogleAuthLoading(false);
    }
  }, [response]);

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
        <TouchableOpacity activeOpacity={0.7}>
          <View style={styles.sign_btn}>
            <Image
              source={require("../assets/images/icons/apple-logo.png")}
              style={styles.sign_image}
            />
            <Text style={styles.sign_text}>Continue with Apple</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!request || googleAuthLoading}
          style={[styles.sign_btn, { opacity: googleAuthLoading ? 0.8 : 1 }]}
          onPress={async () => {
            try {
              setGoogleAuthLoading(true);
              promptAsync();
            } catch (err) {
              console.log("promptAsync error", err);
              setGoogleAuthLoading(false);
              showNotification("Google sign-in failed to start", "error");
            }
          }}
        >
          <Image
            source={require("../assets/images/icons/google-logo.png")}
            style={styles.sign_image}
          />
          <Text style={styles.sign_text}>
            {googleAuthLoading
              ? "Signing with google..."
              : "Continue with Google"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.sign_btn}
          onPress={() => router.push("/(auth)/signin")}
        >
          <Image
            source={require("../assets/images/icons/mail.png")}
            style={styles.sign_image}
          />
          <Text style={styles.sign_text}>Continue with Email</Text>
        </TouchableOpacity>
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

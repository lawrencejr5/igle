// moved global auth session completion to root layout

import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import React, { useState } from "react";

import { useAuthContext } from "../context/AuthContext";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as AppleAuthentication from "expo-apple-authentication";

import { useNotificationContext } from "../context/NotificationContext";

// Important for web and to stabilize redirect completion
WebBrowser.maybeCompleteAuthSession();

const StartScreen = () => {
  const { googleLogin, appleLogin } = useAuthContext()!;
  const { showNotification } = useNotificationContext();

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: ["profile", "email"],
    redirectUri: makeRedirectUri({
      path: "/get_started",
      scheme: "com.lawrencejr.igle",
    }),
  });

  const [googleAuthLoading, setGoogleAuthLoading] = useState<boolean>(false);
  const [appleAuthLoading, setAppleAuthLoading] = useState<boolean>(false);

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

  const handleAppleSignIn = async () => {
    console.log("[AppleAuth] handleAppleSignIn started");
    try {
      setAppleAuthLoading(true);
      console.log("[AppleAuth] Calling AppleAuthentication.signInAsync...");
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log("[AppleAuth] signInAsync returned credential:", {
        hasIdentityToken: !!credential.identityToken,
        hasFullName: !!credential.fullName,
        email: credential.email,
        user: credential.user,
        fullName: credential.fullName,
        identityTokenLength: credential.identityToken?.length,
      });

      if (!credential.identityToken) {
        console.log("[AppleAuth] No identity token in credential!");
        showNotification(
          "Apple sign-in failed: missing identity token",
          "error",
        );
        return;
      }

      console.log("[AppleAuth] Calling appleLogin with token...");
      await appleLogin(credential.identityToken, credential.fullName);
      console.log("[AppleAuth] appleLogin completed successfully");
    } catch (err: any) {
      console.log("[AppleAuth] Error caught:", {
        code: err.code,
        message: err.message,
        response: err?.response?.data,
        fullError: err,
      });
      if (err.code === "ERR_CANCELED") {
        console.log("[AppleAuth] User cancelled sign-in");
        // User cancelled — do nothing
      } else {
        showNotification("Apple sign-in failed", "error");
      }
    } finally {
      console.log("[AppleAuth] finally block, resetting loading");
      setAppleAuthLoading(false);
    }
  };

  return (
    <View
      style={{
        backgroundColor: "#121212",
        flex: 1,
        paddingHorizontal: 30,
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
          allowFontScaling={false}
          style={{
            color: "#fff",
            fontFamily: "raleway-black",
            fontSize: 30,
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
        {/* Google Sign In */}
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
          <Text style={styles.sign_text} allowFontScaling={false}>
            {googleAuthLoading
              ? "Signing with google..."
              : "Continue with Google"}
          </Text>
        </TouchableOpacity>

        {/* Apple Sign In */}
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={appleAuthLoading}
          style={[styles.sign_btn, { opacity: appleAuthLoading ? 0.8 : 1 }]}
          onPress={handleAppleSignIn}
        >
          <Image
            source={require("../assets/images/icons/apple-logo.png")}
            style={{ height: 25, width: 24 }}
          />
          <Text style={styles.sign_text} allowFontScaling={false}>
            {appleAuthLoading
              ? "Signing in with Apple..."
              : "Continue with Apple"}
          </Text>
        </TouchableOpacity>

        {/* Legal consent notice */}
        <Text
          allowFontScaling={false}
          style={{
            color: "#8b8b8b",
            fontFamily: "raleway-regular",
            fontSize: 12,
            textAlign: "center",
            marginTop: 20,
            lineHeight: 24,
            paddingHorizontal: 10,
          }}
        >
          By signing up, you agree to our{" "}
          <Text
            allowFontScaling={false}
            style={{ color: "#fff", fontFamily: "raleway-bold" }}
            onPress={() =>
              WebBrowser.openBrowserAsync(
                "https://igle-landing.web.app/terms-and-conditions",
              )
            }
          >
            Terms & Conditions
          </Text>{" "}
          and{" "}
          <Text
            allowFontScaling={false}
            style={{ color: "#fff", fontFamily: "raleway-bold" }}
            onPress={() =>
              WebBrowser.openBrowserAsync(
                "https://igle-landing.web.app/privacy-policy",
              )
            }
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </View>
  );
};

export default StartScreen;

const styles = StyleSheet.create({
  sign_btn: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 30,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    marginVertical: 10,
  },
  sign_image: {
    width: 22,
    height: 22,
  },
  sign_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 17,
  },
});

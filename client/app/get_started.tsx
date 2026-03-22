// moved global auth session completion to root layout

import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import React, { useState } from "react";

import { router } from "expo-router";

import { useAuthContext } from "../context/AuthContext";
import { useOnboardingContext } from "../context/OnboardingContext";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as AppleAuthentication from "expo-apple-authentication";

import { useNotificationContext } from "../context/NotificationContext";

// Important for web and to stabilize redirect completion
WebBrowser.maybeCompleteAuthSession();

const StartScreen = () => {
  const { googleLogin, appleLogin } = useAuthContext()!;
  const {} = useOnboardingContext();
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
          marginTop: 120,
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
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.sign_btn}
          onPress={() => router.replace("/(auth)/signin")}
        >
          <Image
            source={require("../assets/images/icons/mail.png")}
            style={styles.sign_image}
          />
          <Text style={styles.sign_text}>Continue with Email</Text>
        </TouchableOpacity>

        {/* Apple Sign In — only available on iOS */}
        {Platform.OS === "ios" ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            }
            cornerRadius={30}
            style={{
              width: "95%",
              height: 54,
              marginVertical: 10,
              opacity: appleAuthLoading ? 0.8 : 1,
            }}
            onPress={handleAppleSignIn}
          />
        ) : (
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
        )}
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
    width: "95%",
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

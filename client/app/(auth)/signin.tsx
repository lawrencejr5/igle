import {
  ScrollView,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";

import React, { useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";

import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Checkbox } from "react-native-paper";
import { Link, router } from "expo-router";

import { auth_styles } from "../../styles/auth.styles";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useNotificationContext } from "../../context/NotificationContext";
import { useAuthContext } from "../../context/AuthContext";

const Signin = () => {
  const styles = auth_styles();

  const { showNotification, notification } = useNotificationContext()!;
  const { login, signedIn, googleLogin } = useAuthContext();

  const [checked, setChecked] = useState<boolean>(true);
  const [passwordShow, setPasswordShow] = useState<boolean>(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  React.useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.params?.id_token;
      if (idToken) {
        googleLoading && setGoogleLoading(false);
        googleLogin(idToken).catch((e: unknown) =>
          showNotification("Signin failed, try again", "error"),
        );
      }
    }
  }, [response]);

  const handleLogin = async (): Promise<void> => {
    if (!email.trim() || !password) {
      showNotification("All fields are required", "error");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 10 }}>
          <Feather name="chevron-left" size={40} color="#d3d0d0" />
        </TouchableOpacity>

        {/* Header texts... */}
        <View style={{ marginTop: 10, paddingHorizontal: 10 }}>
          <Text style={styles.header_text}>Welcome back</Text>
          {/* Sub header texts */}
          <Text style={styles.sub_header_text}>Login with your email...</Text>
        </View>

        {/* Form start here */}
        <View style={{ marginTop: 20, paddingHorizontal: 10, flex: 1 }}>
          {/* Email input */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Email</Text>
            <View style={styles.inp_holder}>
              <FontAwesome name="envelope-o" size={20} color="white" />
              <TextInput
                style={styles.text_input}
                value={email}
                onChangeText={setEmail}
                placeholder="Input your email"
                placeholderTextColor={"#c5c5c5ff"}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Passsord input */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Password</Text>
            <View style={styles.inp_holder}>
              <Feather name="lock" size={20} color="white" />
              <TextInput
                style={styles.text_input}
                value={password}
                onChangeText={setPassword}
                placeholder="Input your password"
                placeholderTextColor={"#c5c5c5ff"}
                secureTextEntry={passwordShow}
                autoCapitalize="none"
              />
              {passwordShow ? (
                <Feather
                  name="eye-off"
                  size={20}
                  color="white"
                  onPress={() => setPasswordShow(!passwordShow)}
                />
              ) : (
                <Feather
                  name="eye"
                  size={20}
                  color="white"
                  onPress={() => setPasswordShow(!passwordShow)}
                />
              )}
            </View>
          </View>

          {/* Remember me checkbox */}
          <View style={{ marginTop: 15 }}>
            <View style={styles.check_container}>
              <Checkbox
                status={checked ? "checked" : "unchecked"}
                onPress={() => setChecked(!checked)}
                color="#fff"
              />
              <Text style={{ color: "#fff", fontFamily: "raleway-semibold" }}>
                Remember me
              </Text>
            </View>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLogin}
            disabled={loading}
            style={[styles.sign_btn, { opacity: loading ? 0.5 : 1 }]}
          >
            <Text style={styles.sign_btn_text}>
              {loading ? "Signing in..." : "Sign in"}
            </Text>
          </TouchableOpacity>

          {/* ----- OR ----- */}
          <View style={styles.or_container}>
            <View
              style={{ flex: 1, height: 1, backgroundColor: "#8b8b8bff" }}
            />
            <Text style={styles.or_text}>Or Continue With</Text>
            <View
              style={{ flex: 1, height: 1, backgroundColor: "#8b8b8bff" }}
            />
          </View>

          {/* 0auth buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 30,
            }}
          >
            {/* Sign with google */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.oauth_btn, { opacity: googleLoading ? 0.7 : 1 }]}
              disabled={!request}
              onPress={() => {
                try {
                  setGoogleLoading(true);
                  promptAsync();
                } catch (err) {
                  console.log("promptAsync error", err);
                  setGoogleLoading(false);
                }
              }}
            >
              <Image
                source={require("../../assets/images/icons/google-logo.png")}
                style={styles.oauth_img}
              />
              <Text style={styles.oauth_text}>
                {googleLoading ? "Signing in..." : "Continue with Google"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Don't or already have an account */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 5,
              marginVertical: 40,
            }}
          >
            <Text style={{ color: "#fff", fontFamily: "raleway-regular" }}>
              Don't have an account?
            </Text>

            {/* Link... */}
            <Link
              href={"/(auth)/signup"}
              style={{ color: "#fff", fontFamily: "raleway-bold" }}
            >
              Signup
            </Link>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

export default Signin;

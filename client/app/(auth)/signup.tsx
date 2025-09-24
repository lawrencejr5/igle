import {
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Image,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";

import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Link, router } from "expo-router";

import { auth_styles } from "../../styles/auth.styles";
import { useAuthContext } from "../../context/AuthContext";
import Notification from "../../components/Notification";
import { useNotificationContext } from "../../context/NotificationContext";

const Signup = () => {
  const styles = auth_styles();

  const { register } = useAuthContext()!;
  const { showNotification, notification } = useNotificationContext();

  const [checked, setChecked] = useState(false);
  const [passwordShow, setPasswordShow] = useState<boolean>(true);

  // Add state for form fields
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle registration
  const handleRegister = async () => {
    if (!fullname.trim() || !email.trim() || !password || !confirmPassword) {
      showNotification("All fields are required.", "error");
      return;
    }
    setLoading(true);
    try {
      await register(fullname.trim(), email.trim(), password, confirmPassword);
      setTimeout(() => {
        router.push("/(auth)/phone");
      }, 1500);
    } catch (err: any) {
      showNotification(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Notification notification={notification} />
      <ScrollView>
        {/* Back button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={{ padding: 10 }}
        >
          <Feather name="chevron-left" size={40} color="#d3d0d0ff" />
        </TouchableOpacity>

        {/* Header texts... */}
        <View style={{ marginTop: 5, paddingHorizontal: 10 }}>
          <Text style={styles.header_text}>Create account</Text>
          {/* Sub header texts */}
          <Text style={styles.sub_header_text}>
            Register with your email...
          </Text>
        </View>

        {/* Form start here */}
        <View style={{ marginTop: 10, paddingHorizontal: 10, flex: 1 }}>
          {/* Fullname input */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Fullname</Text>
            <View style={styles.inp_holder}>
              <FontAwesome name="user-o" size={20} color="white" />
              <TextInput
                style={styles.text_input}
                placeholder="Input your full name"
                placeholderTextColor={"#c5c5c5ff"}
                autoCapitalize="words"
                value={fullname}
                onChangeText={setFullname}
              />
            </View>
          </View>

          {/* Email input */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Email</Text>
            <View style={styles.inp_holder}>
              <FontAwesome name="envelope-o" size={20} color="white" />
              <TextInput
                style={styles.text_input}
                placeholder="Input your email"
                placeholderTextColor={"#c5c5c5"}
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password input */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Password</Text>
            <View style={styles.inp_holder}>
              <Feather name="lock" size={20} color="white" />
              <TextInput
                style={styles.text_input}
                placeholder="Input your password"
                placeholderTextColor={"#c5c5c5ff"}
                secureTextEntry={passwordShow}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
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

          {/* Confirm password input */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Confirm Password</Text>
            <View style={styles.inp_holder}>
              <Feather name="lock" size={20} color="white" />
              <TextInput
                style={styles.text_input}
                placeholder="Confirm your password"
                placeholderTextColor={"#c5c5c5ff"}
                secureTextEntry={passwordShow}
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
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

          {/* Submit button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.sign_btn, { opacity: loading ? 0.5 : 1 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.sign_btn_text}>
              {loading ? "Saving..." : "Save"}
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
              justifyContent: "space-between",
              marginTop: 20,
            }}
          >
            {/* Sign with google */}
            <TouchableOpacity activeOpacity={0.7} style={styles.oauth_btn}>
              <Image
                source={require("../../assets/images/icons/google-logo.png")}
                style={styles.oauth_img}
              />
              <Text style={styles.oauth_text}>Google</Text>
            </TouchableOpacity>

            {/* Sign with apple */}
            <TouchableOpacity activeOpacity={0.7} style={styles.oauth_btn}>
              <Image
                source={require("../../assets/images/icons/apple-logo-white.png")}
                style={styles.oauth_img}
              />
              <Text style={styles.oauth_text}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Don't or already have an account */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 5,
              marginVertical: 40,
              height: 50,
            }}
          >
            <Text style={{ color: "#fff", fontFamily: "raleway-regular" }}>
              Already have an account?
            </Text>

            {/* Link... */}
            <Link
              href={"/(auth)/signin"}
              style={{ color: "#fff", fontFamily: "raleway-bold" }}
            >
              Signin
            </Link>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Signup;

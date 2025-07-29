import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Image,
} from "react-native";
import React, { useState } from "react";

import Feather from "@expo/vector-icons/Feather";

import { Checkbox } from "react-native-paper";
import { Link, router } from "expo-router";
const Signin = () => {
  const [checked, setChecked] = useState(false);
  const [passwordShow, setPasswordShow] = useState(false);

  return (
    <ScrollView style={styles.container}>
      {/* Back button */}
      <TouchableWithoutFeedback
        onPress={() => router.back()}
        style={{ padding: 10 }}
      >
        <Feather name="chevron-left" size={40} color="#d3d0d0ff" />
      </TouchableWithoutFeedback>

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
          <Text style={styles.inp_text}>Email</Text>
          <TextInput style={styles.text_input} autoCapitalize="none" />
        </View>

        {/* Passsord input */}
        <View style={styles.inp_container}>
          <Text style={styles.inp_text}>Password</Text>
          <View style={styles.password_input}>
            <TextInput
              style={styles.text_input}
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
        <View style={styles.sign_btn}>
          <Text style={styles.sign_btn_text}>Sign in</Text>
        </View>

        {/* ----- OR ----- */}
        <View style={styles.or_container}>
          <View style={{ flex: 1, height: 1, backgroundColor: "#8b8b8bff" }} />
          <Text style={styles.or_text}>OR</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: "#8b8b8bff" }} />
        </View>

        {/* 0auth buttons */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {/* Sign with google */}
          <View style={styles.oauth_btn}>
            <Image
              source={require("../../assets/images/icons/google-logo.png")}
              style={styles.oauth_img}
            />
            <Text style={styles.oauth_text}>Signin with Google</Text>
          </View>

          {/* Sign with apple */}
          <View style={styles.oauth_btn}>
            <Image
              source={require("../../assets/images/icons/apple-logo-white.png")}
              style={styles.oauth_img}
            />
            <Text style={styles.oauth_text}>Signin with Apple</Text>
          </View>
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
  );
};

export default Signin;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  header_text: {
    fontFamily: "raleway-bold",
    color: "#fff",
    fontSize: 27,
  },
  sub_header_text: {
    fontFamily: "raleway-semibold",
    color: "#bfbabaff",
    fontSize: 12,
    marginTop: 5,
  },
  inp_container: {
    backgroundColor: "#ffffff60",
    paddingHorizontal: 15,
    paddingTop: 10,
    borderRadius: 12,
    marginTop: 25,
  },
  inp_text: {
    fontFamily: "raleway-semibold",
    color: "#e2e1e1ff",
    fontSize: 10,
    marginLeft: 3,
  },
  text_input: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 14,
    paddingBottom: 15,
    paddingTop: 5,
    width: "90%",
  },
  password_input: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 10,
  },
  check_container: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  sign_btn: {
    backgroundColor: "#fff",
    width: "100%",
    padding: 12,
    borderRadius: 30,
    marginTop: 20,
    alignItems: "center",
  },
  sign_btn_text: {
    color: "#000",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  or_container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  or_text: {
    marginHorizontal: 10,
    color: "#fff",
    fontFamily: "raleway-semibold",
  },
  oauth_btn: {
    backgroundColor: "#ffffff50",
    width: 160,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 30,
  },
  oauth_img: {
    width: 15,
    height: 15,
  },
  oauth_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 10,
  },
});

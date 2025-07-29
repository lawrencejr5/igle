import {
  ScrollView,
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

import { auth_styles } from "../../styles/auth.styles";

const Signin = () => {
  const styles = auth_styles();

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

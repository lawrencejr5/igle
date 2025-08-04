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
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Checkbox } from "react-native-paper";
import { Link, router } from "expo-router";

import { auth_styles } from "../../styles/auth.styles";

const Signup = () => {
  const styles = auth_styles();

  const [checked, setChecked] = useState(false);
  const [passwordShow, setPasswordShow] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Back button */}
        <TouchableWithoutFeedback
          onPress={() => router.back()}
          style={{ padding: 10 }}
        >
          <Feather name="chevron-left" size={40} color="#d3d0d0ff" />
        </TouchableWithoutFeedback>

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
                placeholder="Input your password"
                placeholderTextColor={"#c5c5c5ff"}
                secureTextEntry={passwordShow}
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
          <TouchableWithoutFeedback
            onPress={() => router.push("/(auth)/phone")}
          >
            <View style={styles.sign_btn}>
              <Text style={styles.sign_btn_text}>Save</Text>
            </View>
          </TouchableWithoutFeedback>

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
            <View style={styles.oauth_btn}>
              <Image
                source={require("../../assets/images/icons/google-logo.png")}
                style={styles.oauth_img}
              />
              <Text style={styles.oauth_text}>Google</Text>
            </View>

            {/* Sign with apple */}
            <View style={styles.oauth_btn}>
              <Image
                source={require("../../assets/images/icons/apple-logo-white.png")}
                style={styles.oauth_img}
              />
              <Text style={styles.oauth_text}>Apple</Text>
            </View>
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

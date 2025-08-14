import {
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useState } from "react";

import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Link, router } from "expo-router";

import { useNotificationContext } from "../../context/NotificationContext";
import { useAuthContext } from "../../context/AuthContext";

import Notification from "../../components/Notification";

import { auth_styles } from "../../styles/auth.styles";

const AddPhone = () => {
  const styles = auth_styles();

  const { showNotification, notification } = useNotificationContext()!;
  const { updatePhone } = useAuthContext()!;

  const [verifyShow, setVerifyShow] = useState(false);

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const save_phone = async () => {
    if (!phone.trim()) {
      showNotification("Phone field is required.", "error");
      return;
    }
    setLoading(true);
    try {
      await updatePhone(phone.trim());
      setTimeout(() => {
        router.push("/(tabs)/home");
      }, 1500);
    } catch (err: any) {
      showNotification(err.message || "An error occured", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Notification notification={notification} />
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
          <Text style={styles.header_text}>Add Phone number</Text>
          {/* Sub header texts */}
          <Text style={styles.sub_header_text}>
            Let us verify your phone number...
          </Text>
        </View>

        {/* Form start here */}
        <View style={{ marginTop: 20, paddingHorizontal: 10, flex: 1 }}>
          {/* Phone input */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Phone</Text>
            <View style={styles.inp_holder}>
              <Feather name="phone" size={20} color="white" />
              <TextInput
                style={[styles.text_input, { fontFamily: "poppins-regular" }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Input your phone number"
                placeholderTextColor={"#c5c5c5"}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Send code button */}
          <TouchableWithoutFeedback onPress={save_phone}>
            <View style={styles.sign_btn}>
              <Text style={styles.sign_btn_text}>
                {loading ? "Adding..." : "Add"}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>

        {/* Verify Form start here */}
        {verifyShow && (
          <View style={{ marginTop: 50, paddingHorizontal: 10, flex: 1 }}>
            {/* Verfication code input */}
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Verification code</Text>
              <View style={styles.inp_holder}>
                <Feather name="lock" size={20} color="white" />
                <TextInput
                  style={[styles.text_input, { fontFamily: "poppins-regular" }]}
                  placeholder="verification code"
                  placeholderTextColor={"#c5c5c5"}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Verify button */}
            <View style={styles.sign_btn}>
              <Text style={styles.sign_btn_text}>Verify code</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
};

export default AddPhone;

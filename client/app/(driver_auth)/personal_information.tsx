import {
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
  TextInput,
} from "react-native";
import React, { useState } from "react";

import Feather from "@expo/vector-icons/Feather";
import { FontAwesome } from "@expo/vector-icons";

import { router } from "expo-router";

import { driver_reg_styles } from "../../styles/driver_reg_styles";
import Header from "../../components/driver_reg/Header";

import { useDriverAuthContext } from "../../context/DriverAuthContext";
import { useNotificationContext } from "../../context/NotificationContext";
import Notification from "../../components/Notification";

const PersonalInformation = () => {
  const styles = driver_reg_styles();
  const { showNotification, notification } = useNotificationContext()!;
  const { updateDriverInfo } = useDriverAuthContext();

  const [imageUri, setImageUri] = useState<string>("");
  const [fullName, setFullName] = useState<string>("Oputa Lawrence");
  const [email, setEmail] = useState<string>("oputalawrence@gmail.com");
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // For now, just set placeholder image
    setImageUri("image.png");
  };

  const handleNext = async (): Promise<void> => {
    if (!imageUri) {
      showNotification("Please upload your profile image", "error");
      return;
    }

    if (!dateOfBirth.trim()) {
      showNotification("Please enter your date of birth", "error");
      return;
    }

    setLoading(true);
    try {
      await updateDriverInfo({
        date_of_birth: dateOfBirth,
      });
      setTimeout(() => {
        router.push("/driver_identification");
      }, 1500);
    } catch (err: any) {
      showNotification(
        err.message || "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Notification notification={notification} />
      <View style={{ flex: 1, backgroundColor: "#121212" }}>
        <Header />
        <ScrollView style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ marginTop: 25 }}>
              <Text style={styles.form_header_text}>Personal Information</Text>
              <Text style={styles.form_subheader_text}>
                Complete your personal details
              </Text>
            </View>

            <View style={{ marginTop: 20 }}>
              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>Profile Picture</Text>
                <TouchableWithoutFeedback onPress={pickImage}>
                  <View
                    style={[
                      styles.img_input,
                      imageUri && { borderColor: "#4CAF50", borderWidth: 2 },
                    ]}
                  >
                    {imageUri ? (
                      <Feather name="check" color={"#4CAF50"} size={30} />
                    ) : (
                      <Feather name="camera" color={"#fff"} size={30} />
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </View>

              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>Fullname</Text>
                <View style={styles.inp_holder}>
                  <FontAwesome name="user-o" size={20} color="white" />
                  <TextInput
                    style={styles.text_input}
                    autoCapitalize="words"
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#c5c5c5"
                    editable={false}
                  />
                </View>
              </View>

              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>Email</Text>
                <View style={styles.inp_holder}>
                  <FontAwesome name="envelope-o" size={20} color="white" />
                  <TextInput
                    style={styles.text_input}
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#c5c5c5"
                    keyboardType="email-address"
                    editable={false}
                  />
                </View>
              </View>

              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>Date of birth</Text>
                <View style={styles.inp_holder}>
                  <FontAwesome name="calendar-o" size={20} color="white" />
                  <TextInput
                    style={styles.text_input}
                    placeholder="Date of birth (YYYY-MM-DD)"
                    placeholderTextColor="#c5c5c5"
                    value={dateOfBirth}
                    onChangeText={setDateOfBirth}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableWithoutFeedback onPress={handleNext} disabled={loading}>
                <View style={[styles.sign_btn, loading && { opacity: 0.6 }]}>
                  <Text style={styles.sign_btn_text}>
                    {loading ? "Processing..." : "Next"}
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

export default PersonalInformation;

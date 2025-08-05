import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
} from "react-native";
import React, { useState } from "react";

import { router } from "expo-router";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";

import { driver_reg_styles } from "../../styles/driver_reg_styles";
import Header from "../../components/driver_reg/Header";

const DriverIdentification = () => {
  const styles = driver_reg_styles();

  const [imageUri, setImageUri] = useState<string>("");
  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission required", "Camera access is needed.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [15, 10],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#121212",
      }}
    >
      {/* Header component obviously */}
      <Header />

      {/* Registration progress bar */}
      <View style={styles.progress_bar_container}>
        <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
        <View style={[styles.progress_bar, { backgroundColor: "#999999" }]} />
        <View style={styles.progress_bar} />
      </View>

      <ScrollView style={{ paddingHorizontal: 20 }}>
        {/* Form Header */}
        <View style={{ marginTop: 20 }}>
          <Text style={styles.form_header_text}>Driver Identification</Text>
          <Text style={styles.form_subheader_text}>
            Just fill in your driver identification details
          </Text>
        </View>

        {/* Form */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Driver's License Number</Text>
            <View style={styles.inp_holder}>
              <FontAwesome name="id-card-o" size={20} color="white" />
              <TextInput
                style={styles.text_input}
                autoCapitalize="words"
                placeholder="Input license number"
                placeholderTextColor={"#c5c5c5"}
              />
            </View>
          </View>
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>
              Driver's License expiration date
            </Text>
            <View style={styles.inp_holder}>
              <FontAwesome name="calendar-o" size={20} color="white" />
              <TextInput
                style={styles.text_input}
                placeholder="License card expiration date"
                placeholderTextColor={"#c5c5c5"}
                autoCapitalize="none"
              />
            </View>
          </View>
          <View style={styles.two_column_conatainer}>
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Driver's Licence front</Text>
              <TouchableWithoutFeedback onPress={pickImage}>
                <View style={styles.img_input}>
                  <Feather name="camera" color={"#fff"} size={30} />
                </View>
              </TouchableWithoutFeedback>
            </View>
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Driver's Licence front</Text>
              <TouchableWithoutFeedback onPress={pickImage}>
                <View style={styles.img_input}>
                  <Feather name="camera" color={"#fff"} size={30} />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Selfie with Driver's License</Text>
            <TouchableWithoutFeedback onPress={pickImage}>
              <View style={styles.img_input}>
                <Feather name="camera" color={"#fff"} size={30} />
              </View>
            </TouchableWithoutFeedback>
          </View>
          <TouchableWithoutFeedback
            onPress={() => router.push("/vehicle_information")}
          >
            <View style={styles.sign_btn}>
              <Text style={styles.sign_btn_text}>Next</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </ScrollView>
    </View>
  );
};

export default DriverIdentification;

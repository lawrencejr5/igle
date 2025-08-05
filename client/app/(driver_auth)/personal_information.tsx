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

const PersonalInformation = () => {
  const styles = driver_reg_styles();

  const [imageUri, setImageUri] = useState<string>("");
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, // for cropping
      aspect: [1, 1], // square crop
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
      <Header />

      <View style={styles.progress_bar_container}>
        <View style={[styles.progress_bar, { backgroundColor: "#999999" }]} />
        <View style={styles.progress_bar} />
        <View style={styles.progress_bar} />
      </View>

      <ScrollView style={{ paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ marginTop: 20 }}>
          <Text style={styles.form_header_text}>Personal Details</Text>
          <Text
            style={{
              color: "#dbdbdb",
              fontFamily: "raleway-regular",
              fontSize: 12,
            }}
          >
            Just fill in your personal details
          </Text>
        </View>

        {/* Form */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Profile Picture</Text>
            <TouchableWithoutFeedback onPress={pickImage}>
              <View style={styles.img_input}>
                <Feather name="camera" color={"#fff"} size={30} />
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
                value="Oputa Lawrence"
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
                value="oputalawrence@gmail.com"
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
                placeholder="Date of birth"
                placeholderTextColor={"#c5c5c5"}
              />
            </View>
          </View>
          <TouchableWithoutFeedback
            onPress={() => router.push("/driver_identification")}
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

export default PersonalInformation;

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

const VehicleInformation = () => {
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
        <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
        <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
        <View style={[styles.progress_bar, { backgroundColor: "#999999" }]} />
      </View>

      <ScrollView style={{ paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ marginTop: 20 }}>
          <Text style={styles.form_header_text}>Vehicle Information</Text>
          <Text style={styles.form_subheader_text}>
            We need to gatther some information about ur vehicle
          </Text>
        </View>

        {/* Form */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.two_column_conatainer}>
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Vehicle exterior image</Text>
              <TouchableWithoutFeedback onPress={pickImage}>
                <View style={styles.img_input}>
                  <Feather name="camera" color={"#fff"} size={30} />
                </View>
              </TouchableWithoutFeedback>
            </View>
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Vehicle interior image</Text>
              <TouchableWithoutFeedback onPress={pickImage}>
                <View style={styles.img_input}>
                  <Feather name="camera" color={"#fff"} size={30} />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Vehicle brand</Text>
            <View style={styles.inp_holder}>
              <FontAwesome name="car" size={20} color="white" />
              <TextInput
                style={styles.text_input}
                autoCapitalize="words"
                placeholder="e.g. Toyota"
                placeholderTextColor="#c5c5c5"
              />
            </View>
          </View>

          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Vehicle model</Text>
            <View style={styles.inp_holder}>
              <FontAwesome name="bookmark-o" size={20} color="white" />
              <TextInput
                style={styles.text_input}
                autoCapitalize="words"
                placeholder="e.g. Camry"
                placeholderTextColor="#c5c5c5"
              />
            </View>
          </View>

          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Vehicle color</Text>
            <View style={styles.inp_holder}>
              <FontAwesome name="paint-brush" size={20} color="white" />
              <TextInput
                style={styles.text_input}
                autoCapitalize="words"
                placeholder="e.g. Red"
                placeholderTextColor="#c5c5c5"
              />
            </View>
          </View>
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Vehicle year</Text>
            <View style={styles.inp_holder}>
              <FontAwesome name="calendar" size={20} color="white" />
              <TextInput
                style={styles.text_input}
                autoCapitalize="none"
                keyboardType="numeric"
                placeholder="e.g. 2018"
                placeholderTextColor="#c5c5c5"
              />
            </View>
          </View>
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Vehicle plate number</Text>
            <View style={styles.inp_holder}>
              <FontAwesome name="id-card-o" size={20} color="white" />
              <TextInput
                style={styles.text_input}
                autoCapitalize="characters"
                placeholder="e.g. ABC-123XYZ"
                placeholderTextColor="#c5c5c5"
              />
            </View>
          </View>

          <TouchableWithoutFeedback
            style={{ height: 200, marginBottom: 20 }}
            onPress={() => router.push("reviewing_message")}
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

export default VehicleInformation;

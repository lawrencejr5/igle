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

const VehicleInformation = () => {
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
        paddingTop: 60,
        paddingHorizontal: 20,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "raleway-semibold",
            color: "#fff",
            fontSize: 18,
          }}
        >
          Driver Registration
        </Text>
        <TouchableWithoutFeedback style={{ padding: 10 }}>
          <FontAwesome5 name="times" size={24} color="#fff" />
        </TouchableWithoutFeedback>
      </View>
      <View style={styles.progress_bar_container}>
        <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
        <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
        <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
      </View>

      <ScrollView>
        {/* Header */}
        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              color: "#dbdbdb",
              fontFamily: "raleway-bold",
              fontSize: 22,
            }}
          >
            Vehicle Information
          </Text>
          <Text
            style={{
              color: "#dbdbdb",
              fontFamily: "raleway-regular",
              fontSize: 12,
            }}
          >
            We need to gatther some information about ur vehicle
          </Text>
        </View>

        {/* Form */}
        <View style={{ marginTop: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 20,
            }}
          >
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Vehicle exterior image</Text>
              <TouchableWithoutFeedback onPress={pickImage}>
                <View
                  style={{
                    backgroundColor: "grey",
                    height: 100,
                    width: 150,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 10,
                    marginTop: 10,
                  }}
                >
                  <Feather name="camera" color={"#fff"} size={30} />
                </View>
              </TouchableWithoutFeedback>
            </View>
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Vehicle interior image</Text>
              <TouchableWithoutFeedback onPress={pickImage}>
                <View
                  style={{
                    backgroundColor: "grey",
                    height: 100,
                    width: 150,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 10,
                    marginTop: 10,
                  }}
                >
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
            onPress={() => router.push("/driver_identification")}
            style={{ height: 200, marginBottom: 20 }}
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

const styles = StyleSheet.create({
  progress_bar_container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 30,
  },
  progress_bar: {
    height: 3,
    width: 50,
    backgroundColor: "#9f9f9fff",
    borderRadius: 3,
  },
  inp_container: { marginTop: 15 },
  inp_label: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  inp_holder: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#757575ff",
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 7,
    marginTop: 10,
    borderRadius: 7,
  },
  inp_text: {
    fontFamily: "raleway-semibold",
    color: "#e2e1e1ff",
    fontSize: 10,
    marginLeft: 3,
  },
  text_input: {
    backgroundColor: "transparent",
    flex: 1,
    fontFamily: "raleway-semibold",
    color: "#fff",
    fontSize: 14,
  },
  sign_btn: {
    backgroundColor: "#fff",
    width: "100%",
    padding: 12,
    borderRadius: 30,
    marginTop: 40,
    alignItems: "center",
    marginBottom: 50,
  },
  sign_btn_text: {
    color: "#000",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
});

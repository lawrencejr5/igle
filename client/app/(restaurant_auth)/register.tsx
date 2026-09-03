import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Image } from "expo-image";
import React, { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const RegisterRestaurant = () => {
  const insets = useSafeAreaInsets();
  const [restaurantName, setRestaurantName] = useState("");
  const [cuisineType, setCuisineType] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [openingHours, setOpeningHours] = useState("8:00 AM - 10:00 PM");

  const handleRegister = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // UI-only navigation to Restaurant Dashboard
    router.replace("../(restaurant)/home");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View
        style={[
          styles.container,
          { paddingTop: Platform.OS === "ios" ? insets.top : insets.top + 10 },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.back_btn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
          >
            <Feather name="arrow-left" size={25} color="#fff" />
          </Pressable>
          <Text style={styles.header_title}>Partner as Restaurant</Text>
          <View style={{ width: 45 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll_content,
            { paddingBottom: Platform.OS === "ios" ? insets.bottom + 30 : 40 },
          ]}
        >
          {/* Banner Hero Card */}
          <View style={styles.hero_banner}>
            <Image
              source={require("../../assets/images/restaurants/ivan-torres-MQUqbmszGGM-unsplash.jpg")}
              style={styles.hero_bg}
              contentFit="cover"
            />
            <View style={styles.hero_overlay}>
              <View style={styles.hero_icon_badge}>
                <Image
                  source={require("../../assets/images/icons/food-icon-fill.png")}
                  style={{ width: 22, height: 22, tintColor: "#fff" }}
                  contentFit="contain"
                />
              </View>
              <Text style={styles.hero_title}>Grow Your Food Business</Text>
              <Text style={styles.hero_sub}>
                Reach thousands of hungry customers on Igle with fast local dispatch
              </Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.form_card}>
            <Text style={styles.form_section_title}>Restaurant Details</Text>

            {/* Restaurant Name */}
            <View style={styles.input_group}>
              <Text style={styles.input_label}>Restaurant Name</Text>
              <View style={styles.input_box}>
                <Feather name="shopping-bag" size={16} color="#777" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Mama's Kitchen & Grill"
                  placeholderTextColor="#555"
                  value={restaurantName}
                  onChangeText={setRestaurantName}
                />
              </View>
            </View>

            {/* Cuisine Category */}
            <View style={styles.input_group}>
              <Text style={styles.input_label}>Cuisine Type</Text>
              <View style={styles.input_box}>
                <Feather name="tag" size={16} color="#777" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Nigerian, Fast Food, Pizza, Asian"
                  placeholderTextColor="#555"
                  value={cuisineType}
                  onChangeText={setCuisineType}
                />
              </View>
            </View>

            {/* Address */}
            <View style={styles.input_group}>
              <Text style={styles.input_label}>Physical Store Address</Text>
              <View style={styles.input_box}>
                <Feather name="map-pin" size={16} color="#777" />
                <TextInput
                  style={styles.input}
                  placeholder="Street, City, Area"
                  placeholderTextColor="#555"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.input_group}>
              <Text style={styles.input_label}>Manager Contact Number</Text>
              <View style={styles.input_box}>
                <Feather name="phone" size={16} color="#777" />
                <TextInput
                  style={styles.input}
                  placeholder="+234 800 000 0000"
                  placeholderTextColor="#555"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* Hours */}
            <View style={styles.input_group}>
              <Text style={styles.input_label}>Operating Hours</Text>
              <View style={styles.input_box}>
                <Feather name="clock" size={16} color="#777" />
                <TextInput
                  style={styles.input}
                  placeholder="8:00 AM - 10:00 PM"
                  placeholderTextColor="#555"
                  value={openingHours}
                  onChangeText={setOpeningHours}
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submit_btn} onPress={handleRegister}>
            <Text style={styles.submit_btn_text}>Continue to Dashboard</Text>
            <Feather name="arrow-right" size={16} color="#121212" />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default RegisterRestaurant;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  back_btn: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  header_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  scroll_content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 16,
  },
  hero_banner: {
    height: 160,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  hero_bg: {
    width: "100%",
    height: "100%",
  },
  hero_overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#121212bb",
    padding: 16,
    justifyContent: "center",
  },
  hero_icon_badge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#ffffff22",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  hero_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
    marginBottom: 4,
  },
  hero_sub: {
    color: "#d1d5db",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  form_card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 14,
  },
  form_section_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
    marginBottom: 4,
  },
  input_group: {
    gap: 6,
  },
  input_label: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  input_box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121212",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    gap: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 14,
  },
  submit_btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 6,
  },
  submit_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
});

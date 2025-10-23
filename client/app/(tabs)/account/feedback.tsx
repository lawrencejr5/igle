import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";

const FEEDBACK_TYPES = [
  { key: "bug", label: "Bug report" },
  { key: "feature", label: "Feature request" },
  { key: "general", label: "General feedback" },
];

const Feedback = () => {
  const [type, setType] = useState<string>("bug");
  const [message, setMessage] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Permission to access photos is required."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.6,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length) {
        const uri = result.assets[0].uri;
        if (uri) setImages((prev) => [uri, ...prev].slice(0, 4));
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not pick image");
    }
  };

  const removeImage = (uri: string) => {
    setImages((prev) => prev.filter((i) => i !== uri));
  };

  const submit = async () => {
    if (!message.trim()) {
      Alert.alert(
        "Please write your feedback",
        "A short message helps us understand the issue."
      );
      return;
    }

    setSubmitting(true);
    try {
      // Placeholder: no network call by default. Replace with API call if needed.
      console.log({ type, message, images });
      setTimeout(() => {
        setSubmitting(false);
        Alert.alert("Thanks!", "Your feedback has been recorded.");
        router.back();
      }, 700);
    } catch (e) {
      console.log(e);
      setSubmitting(false);
      Alert.alert("Error", "Failed to submit feedback");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <AntDesign name="arrowleft" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Help & Feedback</Text>
        </View>

        <Text style={styles.label}>Type</Text>
        <View style={styles.dropdownContainer}>
          <Pressable
            style={styles.dropdownToggle}
            onPress={() => setShowDropdown((s) => !s)}
            android_ripple={{ color: "#2b2b2b" }}
          >
            <Text style={styles.dropdownText}>
              {FEEDBACK_TYPES.find((f) => f.key === type)?.label}
            </Text>
            <AntDesign name="down" size={14} color="#d7d7d7" />
          </Pressable>
          {showDropdown && (
            <View style={styles.dropdownList}>
              {FEEDBACK_TYPES.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => {
                    setType(f.key);
                    setShowDropdown(false);
                  }}
                  style={styles.dropdownItem}
                >
                  <Text style={styles.dropdownItemText}>{f.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.label}>Message</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Describe the issue or suggestion..."
          placeholderTextColor="#8a8a8a"
          style={[styles.textArea, styles.textAreaLarge]}
          multiline
          numberOfLines={12}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Screenshots (optional)</Text>
        <View style={styles.imagesRow}>
          <TouchableOpacity
            style={styles.addImageBtn}
            onPress={pickImage}
            activeOpacity={0.7}
          >
            <AntDesign name="plus" size={20} color="#fff" />
            <Text style={styles.addImageText}>Add</Text>
          </TouchableOpacity>
          {images.map((uri) => (
            <View key={uri} style={styles.imageWrap}>
              <Image source={{ uri }} style={styles.thumb} />
              <Pressable
                style={styles.removeBtn}
                onPress={() => removeImage(uri)}
              >
                <AntDesign name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, styles.submitBtnWhite]}
          onPress={submit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitText, styles.submitTextDark]}>
            {submitting ? "Sending..." : "Send feedback"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Feedback;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  content: { padding: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  backButton: { padding: 8 },
  title: { color: "#fff", fontFamily: "raleway-semibold", fontSize: 20 },
  label: {
    color: "#d7d7d7",
    marginTop: 12,
    marginBottom: 8,
    fontFamily: "poppins-regular",
  },
  pillRow: { flexDirection: "row", gap: 10 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#1f1f1f",
  },
  pillActive: { backgroundColor: "#fff" },
  pillText: { color: "#d7d7d7", fontFamily: "raleway-regular" },
  pillTextActive: { color: "#121212", fontFamily: "raleway-semibold" },
  dropdownContainer: { position: "relative" },
  dropdownToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#1f1f1f",
  },
  dropdownText: { color: "#fff", fontFamily: "raleway-regular" },
  dropdownList: {
    marginTop: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    overflow: "hidden",
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 14 },
  dropdownItemText: { color: "#d7d7d7", fontFamily: "raleway-regular" },
  textArea: {
    backgroundColor: "#1f1f1f",
    color: "#fff",
    borderRadius: 10,
    padding: 12,
    fontFamily: "poppins-regular",
  },
  textAreaLarge: { minHeight: 220 },
  imagesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  addImageBtn: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#1f1f1f",
    alignItems: "center",
    justifyContent: "center",
  },
  addImageText: {
    color: "#fff",
    fontSize: 11,
    marginTop: 6,
    fontFamily: "poppins-regular",
  },
  imageWrap: { position: "relative", marginLeft: 6 },
  thumb: { width: 72, height: 72, borderRadius: 10 },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 4,
    borderRadius: 10,
  },
  submitBtn: {
    marginTop: 24,
    backgroundColor: "#10b804",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitBtnWhite: { backgroundColor: "#fff" },
  submitText: { color: "#fff", fontFamily: "raleway-semibold" },
  submitTextDark: { color: "#121212" },
});

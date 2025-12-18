import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";

import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFeedbackContext } from "../../../context/FeedbackContext";
import { useNotificationContext } from "../../../context/NotificationContext";
import CustomDropdown from "../../../components/CustomDropdown";
import Notification from "../../../components/Notification";

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

  const { sendFeedback, sending } = useFeedbackContext();
  const { showNotification, notification } = useNotificationContext();

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showNotification("Permission to access photos is required.", "error");
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
      showNotification("Could not pick image", "error");
    }
  };

  const removeImage = (uri: string) => {
    setImages((prev) => prev.filter((i) => i !== uri));
  };

  const submit = async () => {
    if (!message.trim()) {
      showNotification("Please write your feedback.", "error");
      return;
    }
    setSubmitting(true);
    try {
      // convert image URIs to objects expected by context
      const imageObjects = images.map((uri) => ({ uri }));
      await sendFeedback({ type: type as any, message, images: imageObjects });
      setSubmitting(false);
      showNotification("Thanks for your feedback", "success");
      router.back();
    } catch (e) {
      console.log(e);
      setSubmitting(false);
      showNotification("Failed to submit feedback", "error");
    }
  };

  return (
    <>
      {notification.visible && <Notification notification={notification} />}
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.replace("/(tabs)/account")}
            >
              <AntDesign name="arrowleft" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.title}>Help & Feedback</Text>
          </View>

          <Text style={styles.label}>Type</Text>

          <View style={{ backgroundColor: "#1f1f1f", borderRadius: 7 }}>
            <CustomDropdown
              options={FEEDBACK_TYPES}
              value={type}
              onChange={(k) => setType(k)}
            />
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
            disabled={submitting || sending}
            activeOpacity={0.8}
          >
            <Text style={[styles.submitText, styles.submitTextDark]}>
              {submitting || sending ? "Sending..." : "Send feedback"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </>
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
  dropdownContainer: { position: "relative", zIndex: 1 },
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
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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

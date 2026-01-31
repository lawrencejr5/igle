import {
  Text,
  TouchableWithoutFeedback,
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StyleSheet,
} from "react-native";
import React, { useCallback, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";

import Feather from "@expo/vector-icons/Feather";
import { FontAwesome } from "@expo/vector-icons";

import { router } from "expo-router";

import { driver_reg_styles } from "../../styles/driver_reg_styles";
import Header from "../../components/driver_reg/Header";

import { useDriverAuthContext } from "../../context/DriverAuthContext";
import { useNotificationContext } from "../../context/NotificationContext";
import Notification from "../../components/Notification";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Image, Pressable } from "react-native";
import { useAuthContext } from "../../context/AuthContext";

const PersonalInformation = () => {
  const styles = driver_reg_styles();
  const { showNotification, notification } = useNotificationContext()!;
  const { updateDriverInfo, uploadProfilePic, uploadingPic, removeProfilePic } =
    useDriverAuthContext();
  const { signedIn } = useAuthContext();

  const [imageUri, setImageUri] = useState<string>("");
  const [fullName, setFullName] = useState<string>(signedIn?.name!);
  const [email, setEmail] = useState<string>(signedIn?.email!);
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [dateObj, setDateObj] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);

  const pickImage = async () => {
    setShowImageModal(true);
  };

  const openCamera = async () => {
    try {
      // Request camera permissions first
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera permissions to make this work!");
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true, // This is the key to enabling cropping
        aspect: [1, 1], // The aspect ratio for the crop
        quality: 1,
      });

      // Check if the user cancelled the action
      if (!result.canceled) {
        if (result.assets && result.assets.length > 0) {
          const asset = result.assets[0];

          // show preview immediately
          try {
            setImageUri(asset.uri);
          } catch (e) {
            console.warn("Failed to set image preview uri", e);
          }

          const formData = new FormData();
          formData.append("profile_img", {
            uri: asset.uri,
            type: asset.mimeType,
            name: asset.fileName,
          } as any);

          try {
            await uploadProfilePic(formData);
          } catch (uploadErr) {
            console.error("uploadProfilePic error:", uploadErr);
            // keep preview so user can retry or remove
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const openGallery = async () => {
    try {
      // Request media library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need media library permissions to make this work!");
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true, // This is the key to enabling cropping
        aspect: [1, 1], // The aspect ratio for the crop
        quality: 1,
      });

      // Check if the user cancelled the action
      if (!result.canceled) {
        if (result.assets && result.assets.length > 0) {
          const asset = result.assets[0];

          // show preview immediately
          try {
            setImageUri(asset.uri);
          } catch (e) {
            console.warn("Failed to set image preview uri", e);
          }

          const formData = new FormData();
          formData.append("profile_img", {
            uri: asset.uri,
            type: asset.mimeType,
            name: asset.fileName,
          } as any);

          try {
            await uploadProfilePic(formData);
          } catch (uploadErr) {
            console.error("uploadProfilePic error:", uploadErr);
            // keep preview so user can retry or remove
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const remove_profile_pic = async () => {
    try {
      await removeProfilePic();
      setImageUri("");
    } catch (err) {
      console.log(err);
    }
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
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = useCallback(
    (_: any, selectedDate?: Date) => {
      // Android: onChange is called once and we should hide the picker
      if (Platform.OS === "android") setShowDatePicker(false);
      if (selectedDate) {
        setDateObj(selectedDate);
        // format as YYYY-MM-DD using local date parts (avoid timezone shift)
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const d = String(selectedDate.getDate()).padStart(2, "0");
        setDateOfBirth(`${y}-${m}-${d}`);
      }
    },
    [dateObj],
  );

  const handleImageModalClose = () => {
    setShowImageModal(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      {notification.visible && <Notification notification={notification} />}

      {/* Image Selection Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="slide"
        onRequestClose={handleImageModalClose}
      >
        <View style={styles_modal.modalOverlay}>
          <TouchableWithoutFeedback onPress={handleImageModalClose}>
            <View style={styles_modal.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles_modal.modalContent}>
            <View style={styles_modal.modalHeader}>
              <Text style={styles_modal.modalTitle}>
                Select Profile Picture
              </Text>
            </View>

            <View style={styles_modal.optionsContainer}>
              <Pressable
                style={styles_modal.option}
                onPress={() => {
                  handleImageModalClose();
                  openCamera();
                }}
              >
                <View style={styles_modal.iconContainer}>
                  <Feather name="camera" color="#fff" size={30} />
                </View>
                <Text style={styles_modal.optionText}>Take Photo</Text>
              </Pressable>

              <Pressable
                style={styles_modal.option}
                onPress={() => {
                  handleImageModalClose();
                  openGallery();
                }}
              >
                <View style={styles_modal.iconContainer}>
                  <Feather name="image" color="#fff" size={30} />
                </View>
                <Text style={styles_modal.optionText}>Choose from Files</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#121212" }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <Header />
        <View style={styles.progress_bar_container}>
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={styles.progress_bar} />
          <View style={styles.progress_bar} />
          <View style={styles.progress_bar} />
        </View>
        <ScrollView
          style={{ flex: 1, backgroundColor: "#121212" }}
          contentContainerStyle={{
            backgroundColor: "#121212",
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingHorizontal: 20, backgroundColor: "#121212" }}>
            <View style={{ marginTop: 25 }}>
              <Text style={styles.form_header_text}>Personal Information</Text>
              <Text style={styles.form_subheader_text}>
                Complete your personal details
              </Text>
            </View>

            <View style={{ marginTop: 20 }}>
              <View style={styles.inp_container}>
                <Text style={styles.inp_label}>Profile Picture</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Pressable onPress={pickImage}>
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={{
                          height: 100,
                          width: 150,
                          marginTop: 10,
                          borderRadius: 10,
                        }}
                      />
                    ) : (
                      <View
                        style={[
                          styles.img_input,
                          imageUri && {
                            borderColor: "#4CAF50",
                            borderWidth: 2,
                          },
                        ]}
                      >
                        <Feather name="camera" color={"#fff"} size={30} />
                      </View>
                    )}
                  </Pressable>

                  <View style={{ marginLeft: 16 }}>
                    {uploadingPic ? (
                      <ActivityIndicator color="#fff" />
                    ) : imageUri ? (
                      <Pressable onPress={remove_profile_pic}>
                        <Text style={{ color: "#ff6666" }}>Remove</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
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
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    style={{ flex: 1 }}
                  >
                    <Text
                      style={[
                        styles.text_input,
                        {
                          paddingVertical: 10,
                          color: dateOfBirth ? "#fff" : "#c5c5c5",
                        },
                      ]}
                    >
                      {dateOfBirth || "Date of birth (YYYY-MM-DD)"}
                    </Text>
                  </Pressable>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={dateObj || new Date(1990, 0, 1)}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "calendar"}
                    maximumDate={new Date()}
                    onChange={onDateChange}
                  />
                )}
              </View>

              <TouchableWithoutFeedback
                onPress={handleNext}
                disabled={loading || uploadingPic}
              >
                <View
                  style={[
                    styles.sign_btn,
                    (loading || uploadingPic) && { opacity: 0.6 },
                  ]}
                >
                  <Text style={styles.sign_btn_text}>
                    {loading ? "Processing..." : "Next"}
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles_modal = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1E1E1E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 15,
    paddingTop: 15,
  },
  modalHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  option: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  optionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default PersonalInformation;

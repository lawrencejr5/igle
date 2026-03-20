import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Pressable,
} from "react-native";
import { Image } from "expo-image";

import { FontAwesome, MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useDriverAuthContext } from "../../context/DriverAuthContext";
import EditProfileModal from "./EditProfileModal";
import VehicleInformationModal from "./VehicleInformationModal";
import DocumentsModal from "./DocumentsModal";
import ImagePickerModal from "../ImagePickerModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type UserAccountModalProps = {
  visible: boolean;
  onClose: () => void;
};

const UserAccountModal: React.FC<UserAccountModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  const { driver, uploadProfilePic, uploadingPic } = useDriverAuthContext();
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [vehicleInfoVisible, setVehicleInfoVisible] = useState(false);
  const [documentsVisible, setDocumentsVisible] = useState(false);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);

  const pickImage = async () => {
    setShowImageModal(true);
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera permissions to make this work!");
        return;
      }
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
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
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need media library permissions to make this work!");
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
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
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleImageModalClose = () => {
    setShowImageModal(false);
  };

  return (
    <>
      <ImagePickerModal
        visible={showImageModal}
        onClose={handleImageModalClose}
        onCameraPress={openCamera}
        onGalleryPress={openGallery}
      />

    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Account</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{ padding: 10, paddingTop: 0 }}
              onPress={onClose}
            >
              <FontAwesome name="chevron-down" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
                <Image
                  source={
                    driver?.profile_img
                      ? { uri: driver.profile_img }
                      : require("../../assets/images/user.png")
                  }
                  style={styles.profileImage}
                />
                {uploadingPic && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
                <View style={styles.editIconContainer}>
                  <Feather name="edit-2" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.name}>{driver?.name}</Text>
              <Text style={styles.joinDate}>
                Member since{" "}
                {new Date(driver?.createdAt || Date.now()).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    year: "numeric",
                  },
                )}
              </Text>
            </View>

            {/* Stats Section */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {driver?.rating?.toFixed(1) || "0.0"}
                </Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{driver?.total_trips || 0}</Text>
                <Text style={styles.statLabel}>Rides</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Math.floor(
                    (Date.now() -
                      new Date(driver?.createdAt || Date.now()).getTime()) /
                      (365.25 * 24 * 60 * 60 * 1000),
                  )}{" "}
                  yrs
                </Text>
                <Text style={styles.statLabel}>Experience</Text>
              </View>
            </View>

            {/* Vehicle Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Details</Text>
              <View style={styles.vehicleDetails}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="directions-car" size={20} color="#fff" />
                  <Text style={styles.detailText}>
                    {`${driver?.vehicle_color} ${driver?.vehicle_brand} ${driver?.vehicle_model}`.toLowerCase()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <FontAwesome name="id-card" size={18} color="#fff" />
                  <Text style={styles.detailText}>
                    Plate: {driver?.plate_number}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <FontAwesome name="drivers-license" size={18} color="#fff" />
                  <Text style={styles.detailText}>
                    License: {driver?.driver_licence_number}
                  </Text>
                </View>
              </View>
            </View>

            {/* Account Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Settings</Text>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => setEditProfileVisible(true)}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="person-outline" size={20} color="#fff" />
                  <Text style={styles.settingText}>Edit Profile</Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => setVehicleInfoVisible(true)}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="car-outline" size={20} color="#fff" />
                  <Text style={styles.settingText}>Vehicle Information</Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => setDocumentsVisible(true)}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.settingText}>Documents</Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color="#666" />
              </TouchableOpacity>
              {/* <TouchableOpacity
                style={[styles.settingItem, styles.logoutButton]}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="log-out-outline" size={20} color="#ff4444" />
                  <Text style={[styles.settingText, { color: "#ff4444" }]}>
                    Logout
                  </Text>
                </View>
              </TouchableOpacity> */}
            </View>
          </ScrollView>
        </View>

        {/* Edit Modals */}
        <EditProfileModal
          visible={editProfileVisible}
          onClose={() => setEditProfileVisible(false)}
        />
        <VehicleInformationModal
          visible={vehicleInfoVisible}
          onClose={() => setVehicleInfoVisible(false)}
        />
        <DocumentsModal
          visible={documentsVisible}
          onClose={() => setDocumentsVisible(false)}
        />
      </View>
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 25,
    color: "#fff",
    fontFamily: "raleway-bold",
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#fff",
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 5,
    backgroundColor: '#333',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#121212',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "raleway-bold",
    marginBottom: 4,
  },
  joinDate: {
    color: "#666",
    fontFamily: "raleway-regular",
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    backgroundColor: "#333",
  },
  statValue: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "poppins-bold",
    marginBottom: 4,
  },
  statLabel: {
    color: "#666",
    fontSize: 12,
    fontFamily: "raleway-regular",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "raleway-bold",
    marginBottom: 16,
  },
  vehicleDetails: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  detailText: {
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 14,
    textTransform: "capitalize",
    width: "100%",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 14,
  },
  logoutButton: {
    marginTop: 8,
    backgroundColor: "#ff44441a",
  },
});

export default UserAccountModal;

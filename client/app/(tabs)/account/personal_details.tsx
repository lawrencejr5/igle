import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import React, { Dispatch, SetStateAction, FC, useState } from "react";

import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import * as ImagePicker from "expo-image-picker";

import { useAuthContext } from "../../../context/AuthContext";

import Notification from "../../../components/Notification";
import { useNotificationContext } from "../../../context/NotificationContext";

const PersonalDetails = () => {
  const [openNameModal, setOpenNameModal] = useState<boolean>(false);
  const [openEmailModal, setOpenEmailModal] = useState<boolean>(false);
  const [openPhoneModal, setOpenPhoneModal] = useState<boolean>(false);
  const [openProfilePicModal, setOpenProfilePicModal] =
    useState<boolean>(false);

  const { notification } = useNotificationContext();
  const { signedIn, uploadingPic, removingPic } = useAuthContext();
  return (
    <>
      {notification.visible && <Notification notification={notification} />}
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#121212", paddingHorizontal: 20 }}
      >
        <View>
          <Pressable
            style={{ paddingVertical: 15, paddingRight: 15 }}
            onPress={() => router.back()}
          >
            <AntDesign name="arrowleft" size={26} color={"#fff"} />
          </Pressable>
          <Text
            style={{
              fontFamily: "raleway-semibold",
              color: "#fff",
              fontSize: 22,
            }}
          >
            Personal details
          </Text>
        </View>
        <View style={{ marginTop: 50 }}>
          <View style={{ alignSelf: "center" }}>
            <Pressable
              onPress={() => setOpenProfilePicModal(true)}
              style={{ justifyContent: "center", alignItems: "center" }}
            >
              <Image
                source={
                  signedIn?.profile_pic
                    ? { uri: signedIn?.profile_pic }
                    : require("../../../assets/images/user.png")
                }
                style={{
                  height: 120,
                  width: 120,
                  borderRadius: 60,
                  opacity: uploadingPic ? 0.4 : 1,
                  borderWidth: 1,
                  borderColor: "#fff",
                }}
              />
              {(uploadingPic || removingPic) && (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: 120,
                    width: 120,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
            </Pressable>

            {/* Edit pencil button overlapping bottom-right */}
            <Pressable
              onPress={() => setOpenProfilePicModal(true)}
              style={{
                position: "absolute",
                right: 4,
                bottom: 4,
                width: 24,
                height: 24,
                borderRadius: 18,
                backgroundColor: "#fff",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#ccc",
              }}
            >
              <Feather name="edit-2" size={12} color="#121212" />
            </Pressable>
          </View>

          <View style={{ marginTop: 50 }}>
            <Pressable
              onPress={() => setOpenNameModal(true)}
              style={styles.item_container}
            >
              <View>
                <Text style={styles.item_header_text}>Fullname:</Text>
                <Text style={styles.item_sub_text}>
                  {signedIn && signedIn.name}
                </Text>
              </View>
              <Feather name="chevron-right" color={"#fff"} size={24} />
            </Pressable>
            <Pressable
              onPress={() => setOpenEmailModal(true)}
              style={styles.item_container}
            >
              <View>
                <Text style={styles.item_header_text}>Email:</Text>
                <Text style={styles.item_sub_text}>
                  {signedIn && signedIn.email}
                </Text>
              </View>
              <Feather name="chevron-right" color={"#fff"} size={24} />
            </Pressable>
            <Pressable
              onPress={() => setOpenPhoneModal(true)}
              style={styles.item_container}
            >
              <View>
                <Text style={styles.item_header_text}>Phone:</Text>
                <Text
                  style={[
                    styles.item_sub_text,
                    { fontFamily: "poppins-regular", marginTop: 3 },
                  ]}
                >
                  {signedIn && signedIn.phone}
                </Text>
              </View>
              <Feather name="chevron-right" color={"#fff"} size={24} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
      <EditNameModal open={openNameModal} setOpen={setOpenNameModal} />
      <EditEmailModal open={openEmailModal} setOpen={setOpenEmailModal} />
      <EditPhoneModal open={openPhoneModal} setOpen={setOpenPhoneModal} />
      <EditProfilePicModal
        open={openProfilePicModal}
        setOpen={setOpenProfilePicModal}
      />
    </>
  );
};

export default PersonalDetails;

const EditNameModal: FC<{
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}> = ({ open, setOpen }) => {
  const { updateName, signedIn } = useAuthContext();

  const [fullname, setFullname] = useState<string | null>(
    signedIn && signedIn.name
  );

  const [updating, setUpdating] = useState<boolean>(false);
  const update_name = async () => {
    setUpdating(true);
    try {
      await updateName(fullname!);
      setOpen(false);
    } catch (error) {
      console.log(error);
    } finally {
      setUpdating(false);
    }
  };
  return (
    <Modal
      animationType="slide"
      transparent
      visible={open}
      onRequestClose={() => setOpen(false)}
    >
      <Pressable onPress={() => setOpen(false)} style={styles.modal_overlay}>
        <Pressable onPress={() => {}} style={styles.modal}>
          <Text style={styles.modal_header}>Update fullname</Text>

          <TextInput
            value={fullname!}
            onChangeText={setFullname}
            style={styles.modal_text_input}
          />
          <Pressable
            style={[styles.modal_submit_btn, { opacity: updating ? 0.5 : 1 }]}
            disabled={updating}
            onPress={update_name}
          >
            <Text style={{ textAlign: "center", fontFamily: "raleway-bold" }}>
              {updating ? "Updating..." : "Update"}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const EditEmailModal: FC<{
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}> = ({ open, setOpen }) => {
  const { signedIn, updateEmail } = useAuthContext();
  const [email, setEmail] = useState<string | null>(
    signedIn && signedIn?.email
  );

  const [updating, setUpdating] = useState<boolean>(false);
  const update_email = async () => {
    setUpdating(true);
    try {
      await updateEmail(email!);
      setOpen(false);
    } catch (error) {
      console.log(error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={open}
      onRequestClose={() => setOpen(false)}
    >
      <Pressable onPress={() => setOpen(false)} style={styles.modal_overlay}>
        <Pressable onPress={() => {}} style={styles.modal}>
          <Text style={styles.modal_header}>Update email</Text>

          <TextInput
            value={email!}
            onChangeText={setEmail}
            style={styles.modal_text_input}
          />
          <Pressable
            style={[styles.modal_submit_btn, { opacity: updating ? 0.5 : 1 }]}
            onPress={update_email}
            disabled={updating}
          >
            <Text style={{ textAlign: "center", fontFamily: "raleway-bold" }}>
              {updating ? "Updating..." : "Update"}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const EditPhoneModal: FC<{
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}> = ({ open, setOpen }) => {
  const { signedIn, updatePhone } = useAuthContext();
  const [phone, setPhone] = useState<string | null>(signedIn && signedIn.phone);

  const [updating, setUpdating] = useState<boolean>(false);
  const update_phone = async () => {
    setUpdating(true);
    try {
      await updatePhone(phone!);
      setOpen(false);
    } catch (error) {
      console.log(error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={open}
      onRequestClose={() => setOpen(false)}
    >
      <Pressable onPress={() => setOpen(false)} style={styles.modal_overlay}>
        <Pressable onPress={() => {}} style={styles.modal}>
          <Text style={styles.modal_header}>Update phone</Text>

          <TextInput
            value={phone!}
            onChangeText={setPhone}
            style={styles.modal_text_input}
          />
          <Pressable
            style={[styles.modal_submit_btn, { opacity: updating ? 0.5 : 1 }]}
            onPress={update_phone}
            disabled={updating}
          >
            <Text style={{ textAlign: "center", fontFamily: "raleway-bold" }}>
              {updating ? "Updating..." : "Update"}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const EditProfilePicModal: FC<{
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}> = ({ open, setOpen }) => {
  const { uploadProfilePic, removeProfilePic, removingPic } = useAuthContext();

  const takePhotoAndCrop = async () => {
    setOpen(false);
    try {
      // Request camera permissions first
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera roll permissions to make this work!");
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
          const formData = new FormData();
          formData.append("profile_pic", {
            uri: asset.uri,
            type: asset.mimeType,
            name: asset.fileName,
          } as any);

          await uploadProfilePic(formData);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const remove_profile_pic = async () => {
    try {
      await removeProfilePic();
    } catch (err) {
      console.log(err);
    } finally {
      setOpen(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={open}
      onRequestClose={() => setOpen(false)}
    >
      <Pressable onPress={() => setOpen(false)} style={styles.modal_overlay}>
        <Pressable onPress={() => {}} style={styles.modal}>
          <Text style={styles.modal_header}>Update profile pic</Text>

          <View style={{ marginTop: 20 }}>
            <Pressable
              onPress={remove_profile_pic}
              disabled={removingPic}
              style={{
                width: "80%",
                backgroundColor: "#383838",
                paddingVertical: 15,
                borderRadius: 40,
                alignSelf: "center",
                marginVertical: 10,
                opacity: removingPic ? 0.5 : 1,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontFamily: "raleway-bold",
                  color: "#fff",
                }}
              >
                {removingPic ? "Removing..." : "Remove profile photo"}
              </Text>
            </Pressable>
            <Pressable
              onPress={takePhotoAndCrop}
              style={{
                width: "80%",
                backgroundColor: "#fff",
                paddingVertical: 15,
                borderRadius: 40,
                alignSelf: "center",
                marginVertical: 10,
              }}
            >
              <Text style={{ textAlign: "center", fontFamily: "raleway-bold" }}>
                Take new photo
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  item_container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#242424",
    borderRadius: 7,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  item_header_text: {
    fontFamily: "raleway-semibold",
    color: "#aaaaaa",
    fontSize: 12,
  },
  item_sub_text: {
    fontFamily: "raleway-semibold",
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
  },

  modal_overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modal_header: {
    fontFamily: "raleway-semibold",
    fontSize: 18,
    color: "#fff",
  },
  modal_text_input: {
    width: "100%",
    backgroundColor: "#383838",
    borderRadius: 7,
    marginTop: 20,
    color: "#fff",
    paddingHorizontal: 15,
    fontFamily: "raleway-bold",
  },
  modal_submit_btn: {
    backgroundColor: "#fff",
    width: "100%",
    paddingVertical: 10,
    borderRadius: 7,
    marginTop: 20,
  },
});

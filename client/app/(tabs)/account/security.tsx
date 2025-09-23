import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
} from "react-native";
import React, { FC, Dispatch, SetStateAction, useState } from "react";

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { AntDesign, Feather } from "@expo/vector-icons";

import Notification from "../../../components/Notification";

import { useAuthContext } from "../../../context/AuthContext";
import { useNotificationContext } from "../../../context/NotificationContext";

const SecuritySettings = () => {
  const { notification } = useNotificationContext();
  const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);
  return (
    <>
      <Notification notification={notification} />
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
            Security
          </Text>
        </View>
        <Pressable
          onPress={() => setPasswordModalOpen(true)}
          style={{
            marginTop: 30,
            backgroundColor: "#242424",
            borderRadius: 10,
            paddingHorizontal: 15,
            paddingVertical: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text
              style={{
                color: "#aaa",
                fontFamily: "raleway-semibold",
                fontSize: 12,
              }}
            >
              Password
            </Text>
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-bold",
                marginTop: 10,
                fontSize: 16,
              }}
            >
              Change password
            </Text>
          </View>
          <Feather name="chevron-right" color={"#fff"} size={24} />
        </Pressable>
      </SafeAreaView>
      <ChangePasswordModal
        open={passwordModalOpen}
        setOpen={setPasswordModalOpen}
      />
    </>
  );
};

export default SecuritySettings;

const ChangePasswordModal: FC<{
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}> = ({ open, setOpen }) => {
  const { updatePassword } = useAuthContext();

  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [updating, setUpdating] = useState<boolean>(false);
  const update_password = async () => {
    setUpdating(true);
    try {
      await updatePassword(oldPassword, newPassword, confirmPassword);
      setOpen(false);
    } catch (error) {
      console.log(error);
    } finally {
      setUpdating(false);
      setConfirmPassword("");
      setNewPassword("");
      setOldPassword("");
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
          <Text style={styles.modal_header}>Change password</Text>
          <TextInput
            value={oldPassword}
            onChangeText={setOldPassword}
            placeholder="old password"
            secureTextEntry
            style={styles.modal_text_input}
          />
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="new password"
            secureTextEntry
            style={styles.modal_text_input}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="confirm password"
            secureTextEntry
            style={styles.modal_text_input}
          />
          <Pressable
            style={[styles.modal_submit_btn, { opacity: updating ? 0.5 : 1 }]}
            disabled={updating}
            onPress={update_password}
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

const styles = StyleSheet.create({
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

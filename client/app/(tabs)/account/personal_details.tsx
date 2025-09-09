import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  Modal,
  TextInput,
} from "react-native";
import React, { Dispatch, SetStateAction, FC, useState } from "react";

import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Feather } from "@expo/vector-icons";
import { router } from "expo-router";

const PersonalDetails = () => {
  const [openNameModal, setOpenNameModal] = useState<boolean>(false);
  const [openEmailModal, setOpenEmailModal] = useState<boolean>(false);
  const [openPhoneModal, setOpenPhoneModal] = useState<boolean>(false);
  const [openProfilePicModal, setOpenProfilePicModal] =
    useState<boolean>(false);
  return (
    <>
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
          <Pressable
            onPress={() => setOpenProfilePicModal(true)}
            style={{ alignSelf: "center" }}
          >
            <Image
              source={require("../../../assets/images/black-profile.jpeg")}
              style={{ height: 120, width: 120, borderRadius: 50 }}
            />
          </Pressable>

          <View style={{ marginTop: 50 }}>
            <Pressable
              onPress={() => setOpenNameModal(true)}
              style={styles.item_container}
            >
              <View>
                <Text style={styles.item_header_text}>Fullname:</Text>
                <Text style={styles.item_sub_text}>Bombom Nyash</Text>
              </View>
              <Feather name="chevron-right" color={"#fff"} size={24} />
            </Pressable>
            <Pressable
              onPress={() => setOpenEmailModal(true)}
              style={styles.item_container}
            >
              <View>
                <Text style={styles.item_header_text}>Email:</Text>
                <Text style={styles.item_sub_text}>bombomnyash@gmail.com</Text>
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
                  09025816161
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

          <TextInput value="Bombom Nyash" style={styles.modal_text_input} />
          <Pressable style={styles.modal_submit_btn}>
            <Text style={{ textAlign: "center", fontFamily: "raleway-bold" }}>
              Update
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
            value="bombomnyash@gmail.com"
            style={styles.modal_text_input}
          />
          <Pressable style={styles.modal_submit_btn}>
            <Text style={{ textAlign: "center", fontFamily: "raleway-bold" }}>
              Update
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

          <TextInput value="09025816161" style={styles.modal_text_input} />
          <Pressable style={styles.modal_submit_btn}>
            <Text style={{ textAlign: "center", fontFamily: "raleway-bold" }}>
              Update
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
              style={{
                width: "80%",
                backgroundColor: "#383838",
                paddingVertical: 10,
                borderRadius: 20,
                alignSelf: "center",
                marginVertical: 10,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontFamily: "raleway-bold",
                  color: "#fff",
                }}
              >
                Delete profile photo
              </Text>
            </Pressable>
            <Pressable
              style={{
                width: "80%",
                backgroundColor: "#fff",
                paddingVertical: 10,
                borderRadius: 20,
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
    borderColor: "#656565ff",
    borderWidth: 0.5,
    borderRadius: 5,
    padding: 10,
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

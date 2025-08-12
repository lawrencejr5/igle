import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState } from "react";

import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import WalletScreen from "../../../components/screens/Wallet";

import { useAuthContext } from "../../../context/AuthContext";

const Account = () => {
  const [walletOpen, setWalletOpen] = useState<boolean>(false);
  const { logout, signedIn } = useAuthContext();

  return (
    <>
      <ScrollView
        style={{
          backgroundColor: "#121212",
          flex: 1,
          paddingTop: 50,
          paddingBottom: 30,
          paddingHorizontal: 20,
        }}
      >
        {/* Account name */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: 15,
            marginTop: 20,
            padding: 10,
            borderRadius: 10,
            backgroundColor: "#2c2c2c",
          }}
        >
          <Image
            source={require("../../../assets/images/black-profile.jpeg")}
            style={{ height: 70, width: 70, borderRadius: 50 }}
          />
          <Text
            numberOfLines={2}
            style={{
              color: "#fff",
              fontFamily: "raleway-black",
              fontSize: 30,
              flexShrink: 1,
            }}
          >
            {signedIn?.name}
          </Text>
        </View>

        {/* Wallet */}
        <TouchableWithoutFeedback onPress={() => setWalletOpen(true)}>
          <View
            style={{
              backgroundColor: "#2c2c2c",
              paddingVertical: 15,
              paddingHorizontal: 20,
              marginTop: 20,
              borderRadius: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Entypo name="wallet" size={24} color="#c8c5c5" />
              <Text
                style={{
                  color: "#c8c5c5",
                  fontFamily: "raleway-bold",
                  fontSize: 16,
                }}
              >
                Wallet
              </Text>
            </View>
            <View>
              <Text style={{ fontFamily: "poppins-bold", color: "#fff" }}>
                12,000 NGN
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* Other settings */}
        <View
          style={{
            marginVertical: 30,
            marginBottom: 60,
            paddingHorizontal: 10,
          }}
        >
          <Text
            style={{ color: "#fff", fontFamily: "raleway-bold", fontSize: 20 }}
          >
            Account settings
          </Text>
          <View style={styles.setting_box}>
            <FontAwesome name="user" size={20} color="#c6c6c6" />
            <Text style={styles.setting_text}>Personal details</Text>
          </View>
          <View style={styles.setting_box}>
            <Feather name="bell" size={20} color="#c6c6c6" />
            <Text style={styles.setting_text}>Notifications</Text>
          </View>
          <View style={styles.setting_box}>
            <Feather name="settings" size={20} color="#c6c6c6" />
            <Text style={styles.setting_text}>App preferences</Text>
          </View>
          <View style={styles.setting_box}>
            <Feather name="lock" size={20} color="#c6c6c6" />
            <Text style={styles.setting_text}>Security</Text>
          </View>
          <View style={styles.setting_box}>
            <Entypo name="location-pin" size={20} color="#c6c6c6" />
            <Text style={styles.setting_text}>Saved places</Text>
          </View>
          <View style={styles.setting_box}>
            <Feather name="help-circle" size={20} color="#c6c6c6" />
            <Text style={styles.setting_text}>Help and support</Text>
          </View>
          <View style={styles.setting_box}>
            <FontAwesome name="star" size={20} color="#c6c6c6" />
            <Text style={styles.setting_text}>Rate us</Text>
          </View>
          <TouchableWithoutFeedback onPress={logout}>
            <View style={styles.setting_box}>
              <Feather name="log-out" size={20} color="#ca1d1d" />
              <Text style={[styles.setting_text, { color: "#ca1d1d" }]}>
                Logout
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </ScrollView>

      {/* Wallet screen */}
      <WalletScreen open={walletOpen} setOpen={setWalletOpen} />
    </>
  );
};

export default Account;

const styles = StyleSheet.create({
  setting_box: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
    borderStyle: "solid",
    borderColor: "#5f5f5fff",
    borderBottomWidth: 0.5,
    paddingBottom: 10,
  },
  setting_text: {
    color: "#c6c6c6",
    fontFamily: "raleway-semibold",
    fontSize: 16,
  },
});

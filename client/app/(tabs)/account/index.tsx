import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableWithoutFeedback,
  Pressable,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";

import React, { useState } from "react";

import * as Haptics from "expo-haptics";

import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import WalletScreen from "../../../components/screens/Wallet";

import Notification from "../../../components/Notification";

import { useAuthContext } from "../../../context/AuthContext";
import { useWalletContext } from "../../../context/WalletContext";
import { useNotificationContext } from "../../../context/NotificationContext";
import { useLoading } from "../../../context/LoadingContext";
import AppLoading from "../../../loadings/AppLoading";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { Alert } from "react-native";

const Account = () => {
  const [walletOpen, setWalletOpen] = useState<boolean>(false);

  const { logout, signedIn, getUserData } = useAuthContext();
  const { userWalletBal, walletLoading, getWalletBalance } = useWalletContext();
  const { notification, showNotification } = useNotificationContext();
  const { appLoading } = useLoading();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([getUserData(), getWalletBalance("User")]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRateUs = async () => {
    const url =
      "https://play.google.com/store/apps/details?id=com.lawrencejr.igle";
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      showNotification("Couldn't open playstore", "error");
    }
  };

  return (
    <>
      {appLoading ? (
        <AppLoading />
      ) : (
        <>
          {notification.visible && <Notification notification={notification} />}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{
              backgroundColor: "#121212",
              flex: 1,
              paddingTop: 50,
              paddingBottom: 30,
              paddingHorizontal: 20,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#121212"
                colors={["#121212"]}
              />
            }
          >
            {/* Account name */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("./account/personal_details");
              }}
              style={{
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 25,
                marginTop: 20,
                padding: 10,
                borderRadius: 10,
                backgroundColor: "#2c2c2c",
              }}
            >
              <Image
                source={
                  signedIn?.profile_pic
                    ? { uri: signedIn?.profile_pic } // remote image from backend
                    : require("../../../assets/images/user.png") // fallback local asset
                }
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
            </Pressable>

            {/* Wallet */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setWalletOpen((prev: any) => !prev);
              }}
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
                  {walletLoading
                    ? "----"
                    : `${userWalletBal.toLocaleString()} NGN`}
                </Text>
              </View>
            </Pressable>

            {/* Other settings */}
            <View
              style={{
                marginVertical: 30,
                marginBottom: 60,
                paddingHorizontal: 10,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "raleway-bold",
                  fontSize: 20,
                }}
              >
                Account settings
              </Text>
              <TouchableOpacity
                style={styles.setting_box}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                  router.push("./account/personal_details");
                }}
              >
                <FontAwesome name="user" size={20} color="#c6c6c6" />
                <Text style={styles.setting_text}>Personal details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("./account/notifications");
                }}
                style={styles.setting_box}
              >
                <Feather name="bell" size={20} color="#c6c6c6" />
                <Text style={styles.setting_text}>Notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("./account/security");
                }}
                style={styles.setting_box}
              >
                <Feather name="lock" size={20} color="#c6c6c6" />
                <Text style={styles.setting_text}>Security</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("./account/saved_places");
                }}
                style={styles.setting_box}
              >
                <Entypo name="location-pin" size={20} color="#c6c6c6" />
                <Text style={styles.setting_text}>Saved places</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("./account/feedback");
                }}
                style={styles.setting_box}
              >
                <Feather name="help-circle" size={20} color="#c6c6c6" />
                <Text style={styles.setting_text}>Help and Feedback</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRateUs}
                style={styles.setting_box}
              >
                <FontAwesome name="star" size={20} color="#c6c6c6" />
                <Text style={styles.setting_text}>Rate us</Text>
              </TouchableOpacity>
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
      )}
    </>
  );
};

export default Account;

const styles = StyleSheet.create({
  setting_box: {
    marginTop: 25,
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

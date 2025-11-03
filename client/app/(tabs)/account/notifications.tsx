import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import React, { useEffect } from "react";

import { useActivityContext } from "../../../context/ActivityContext";

import { FlatList } from "react-native-gesture-handler";
import { AntDesign } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { NotificationItem } from "../../../components/screens/NotificationScreen";

const AccountNotification = () => {
  const { activities, activityLoading, fetchActivities, formatTime } =
    useActivityContext();

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#121212", paddingHorizontal: 20 }}
    >
      <View>
        <Pressable
          style={{ paddingVertical: 15, paddingRight: 15 }}
          onPress={() => router.replace("/(tabs)/account")}
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
          Notifications
        </Text>
      </View>
      {/* ...Notification content... */}
      {activityLoading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator
            color={"#fff"}
            style={{ transform: [{ scale: 3 }] }}
          />
        </View>
      ) : activities?.length! > 0 ? (
        <View style={{ marginTop: 25 }}>
          <FlatList
            data={activities}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              const { createdAt } = item;
              const formattedTime = formatTime(createdAt);
              return (
                <NotificationItem
                  type={item.type}
                  title={item.title}
                  message={item.message}
                  createdAt={formattedTime}
                />
              );
            }}
          />
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Image
            source={require("../../../assets/images/empty_inbox-nobg.png")}
            style={{ width: 200, height: 200, borderRadius: 20 }}
          />
          <Text
            style={{
              fontFamily: "raleway-semibold",
              color: "#fff",
              fontSize: 18,
              textAlign: "center",
              marginTop: 20,
              flexShrink: 1,
            }}
          >
            No notifications for you at this point...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default AccountNotification;

const styles = StyleSheet.create({});

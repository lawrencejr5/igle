import { StyleSheet, Text, View, Pressable } from "react-native";
import React, { FC } from "react";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Feather from "@expo/vector-icons/Feather";

import {
  useActivityContext,
  ActivityType,
} from "../../../context/ActivityContext";
import { FlatList } from "react-native-gesture-handler";
import { Entypo, MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const AccountNotification = () => {
  const { activities, formatTime } = useActivityContext();

  return (
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
          Notifications
        </Text>
      </View>
      {/* ...Notification content... */}
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
    </SafeAreaView>
  );
};

const NotificationItem: FC<{
  type: ActivityType["type"];
  title: string;
  message: string;
  createdAt: string;
}> = ({ type, title, message, createdAt }) => {
  return (
    <View
      style={{
        marginBottom: 15,
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        gap: 10,
        width: "100%",
      }}
    >
      <View
        style={{
          backgroundColor: "#5f5d5d",
          padding: 10,
          borderRadius: "50%",
        }}
      >
        {type === "security" ? (
          <Feather name="lock" size={20} color={"#fff"} />
        ) : type === "email_update" ? (
          <MaterialCommunityIcons
            name="email-outline"
            size={20}
            color={"#fff"}
          />
        ) : type === "phone_update" ? (
          <Feather name="phone" size={20} color={"#fff"} />
        ) : type === "cancelled_ride" ? (
          <MaterialCommunityIcons name="car-off" size={20} color={"#fff"} />
        ) : type === "scheduled_ride" ? (
          <MaterialCommunityIcons name="car-clock" size={20} color={"#fff"} />
        ) : (
          <Feather name="bell" size={20} color={"#fff"} />
        )}
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            color: "#fff",
            fontFamily: "raleway-semibold",
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: "#c9c9c9ff",
            fontFamily: "raleway-regular",
            fontSize: 12,
            marginTop: 5,
          }}
          numberOfLines={2}
        >
          {message}
        </Text>
        <Text
          style={{
            color: "#838383ff",
            fontFamily: "raleway-regular",
            fontSize: 11,
            marginTop: 5,
          }}
        >
          {createdAt}
        </Text>
      </View>
    </View>
  );
};

export default AccountNotification;

const styles = StyleSheet.create({});

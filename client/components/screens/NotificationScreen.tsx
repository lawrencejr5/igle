import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Modal,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { FC } from "react";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Feather from "@expo/vector-icons/Feather";

import {
  useActivityContext,
  ActivityType,
} from "../../context/ActivityContext";
import { FlatList } from "react-native-gesture-handler";
import {
  Entypo,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";

const NotificationScreen: React.FC<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ open, setOpen }) => {
  const { activities, activityLoading, formatTime } = useActivityContext();

  return (
    <Modal
      animationType="slide"
      visible={open}
      transparent
      onRequestClose={() => setOpen(false)}
    >
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "#121212",
          width: "100%",
          zIndex: 5,
          paddingTop: 20,
          paddingHorizontal: 20,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontFamily: "raleway-bold",
              fontSize: 25,
            }}
          >
            Notifications
          </Text>
          <TouchableWithoutFeedback
            onPress={() => setOpen(false)}
            style={{ padding: 10 }}
          >
            <FontAwesome5 name="times" size={24} color="#fff" />
          </TouchableWithoutFeedback>
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
              source={require("../../assets/images/empty_inbox-nobg.png")}
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
      </View>
    </Modal>
  );
};

export const NotificationItem: FC<{
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
        ) : type === "ride" ? (
          <MaterialCommunityIcons name="car" size={20} color={"#fff"} />
        ) : type === "ride_payment" ? (
          <MaterialIcons name="payment" size={20} color={"#fff"} />
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

export default NotificationScreen;

const styles = StyleSheet.create({});

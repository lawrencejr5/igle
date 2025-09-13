import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import React, { FC } from "react";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Feather from "@expo/vector-icons/Feather";

import { useActivityContext } from "../../context/ActivityContext";
import { FlatList } from "react-native-gesture-handler";

const NotificationScreen: React.FC<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ open, setOpen }) => {
  const { activities, formatTime } = useActivityContext();

  return (
    <Modal
      animationType="slide"
      visible={open}
      transparent={false}
      onRequestClose={() => setOpen(false)}
    >
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "#121212",
          width: "100%",
          zIndex: 5,
          paddingTop: 10,
          paddingHorizontal: 20,
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
      </View>
    </Modal>
  );
};

const NotificationItem: FC<{
  type: string;
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
        <Feather name="bell" size={20} color={"#fff"} />
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

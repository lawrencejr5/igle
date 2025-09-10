import React, { FC, useMemo, useRef } from "react";

import { StyleSheet, Text, View, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AntDesign,
  Entypo,
  Feather,
  FontAwesome,
  MaterialIcons,
} from "@expo/vector-icons";

import { router } from "expo-router";

import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

import { useNotificationContext } from "../../../context/NotificationContext";
import Notification from "../../../components/Notification";

const SavedPlaces = () => {
  const { notification } = useNotificationContext();
  const bottomSheetRef = useRef<BottomSheet>(null);
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
            Saved places
          </Text>
        </View>
        <View style={{ marginTop: 10 }}>
          <Pressable
            onPress={() => bottomSheetRef.current?.snapToIndex(0)}
            style={{
              flexDirection: "row",
              gap: 10,
              marginTop: 10,
              paddingVertical: 15,
            }}
          >
            <Entypo name="home" color={"#fff"} size={22} />
            <Text
              style={{
                fontFamily: "raleway-regular",
                color: "#fff",
                fontSize: 16,
              }}
            >
              Add home location
            </Text>
          </Pressable>
          <Pressable
            style={{
              flexDirection: "row",
              gap: 10,
              marginTop: 10,
              paddingVertical: 15,
            }}
          >
            <FontAwesome name="briefcase" color={"#fff"} size={20} />
            <Text
              style={{
                fontFamily: "raleway-regular",
                color: "#fff",
                fontSize: 16,
              }}
            >
              Add office location
            </Text>
          </Pressable>
          <Pressable
            style={{
              flexDirection: "row",
              gap: 10,
              marginTop: 10,
              paddingVertical: 15,
            }}
          >
            <Feather name="plus" color={"#fff"} size={22} />
            <Text
              style={{
                fontFamily: "raleway-regular",
                color: "#fff",
                fontSize: 16,
              }}
            >
              Add place
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
      <PlaceModal ref={bottomSheetRef} />
    </>
  );
};

export default SavedPlaces;

const PlaceModal: FC<{ ref: any }> = ({ ref }) => {
  const snapPoints = useMemo(() => ["30%", "93%"], []);
  return (
    <BottomSheet
      snapPoints={snapPoints}
      index={-1}
      ref={ref}
      enableContentPanningGesture={true}
      enableHandlePanningGesture={true}
      enableDynamicSizing={false}
      enableOverDrag={false}
      enablePanDownToClose={true}
      backgroundStyle={{
        backgroundColor: "#2b2b2b",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
      handleIndicatorStyle={{
        width: 40,
        height: 5,
        backgroundColor: "grey",
        marginTop: 10,
        borderRadius: 10,
      }}
    >
      <BottomSheetView style={{ paddingHorizontal: 20 }}>
        <Text
          style={{ color: "#fff", fontFamily: "raleway-bold", fontSize: 18 }}
        >
          Choose address
        </Text>
        <View style={{ marginTop: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              backgroundColor: "#484848",
              paddingHorizontal: 10,
              borderRadius: 7,
            }}
          >
            <MaterialIcons name="place" size={20} color={"#fff"} />
            <TextInput
              value="Home"
              style={{
                backgroundColor: "transparent",
                flex: 1,
                color: "#fff",
                fontFamily: "raleway-bold",
              }}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              backgroundColor: "#484848",
              paddingHorizontal: 10,
              borderRadius: 7,
              marginTop: 10,
            }}
          >
            <Feather name="search" size={20} color={"#fff"} />
            <TextInput
              value=""
              placeholder="Search address"
              style={{
                backgroundColor: "transparent",
                flex: 1,
                color: "#fff",
                fontFamily: "raleway-bold",
              }}
            />
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({});

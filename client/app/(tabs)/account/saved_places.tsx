import React, { FC, useEffect, useMemo, useRef, useState } from "react";

import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AntDesign,
  Entypo,
  Feather,
  FontAwesome,
  MaterialIcons,
  Ionicons,
} from "@expo/vector-icons";

import { router } from "expo-router";

import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

import { useNotificationContext } from "../../../context/NotificationContext";
import Notification from "../../../components/Notification";

import { useSavedPlaceContext } from "../../../context/SavedPlaceContext";
import { useMapContext } from "../../../context/MapContext";

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
  const { searchResults, searchPlace, savePlace } = useSavedPlaceContext();
  const { getPlaceCoords } = useMapContext();
  const [placeHeader, setPlaceheader] = useState<string>("home");
  const [place, setPlace] = useState<string>("");

  const save_place = async (
    place_id: string,
    place_name: string,
    place_sub_name: string
  ) => {
    try {
      ref.current.collapse();

      const coords: any = await getPlaceCoords(place_id);

      await savePlace(
        placeHeader,
        place_id,
        place_name,
        place_sub_name,
        coords
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    searchPlace(place);
  }, [place]);

  const snapPoints = useMemo(() => ["93%"], []);
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
              value={placeHeader}
              onChangeText={setPlaceheader}
              editable={false}
              style={{
                backgroundColor: "transparent",
                flex: 1,
                color: "#fff",
                fontFamily: "raleway-bold",
                textTransform: "capitalize",
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
              value={place}
              onChangeText={setPlace}
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
        <View style={[styles.suggestions_container]}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.suggestion_box}
                onPress={() =>
                  save_place(
                    item.place_id,
                    item.structured_formatting.main_text,
                    item.structured_formatting.secondary_text
                  )
                }
              >
                <Ionicons name="location" size={24} color="#b7b7b7" />
                <View>
                  <Text style={styles.suggestion_header_text} numberOfLines={1}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.suggestion_sub_text}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  suggestions_container: {
    flex: 1,
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: "#515151",
    borderStyle: "solid",
    paddingVertical: 10,
  },
  suggestion_box: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 10,
    paddingRight: 10,
  },
  suggestion_header_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 14,
  },
  suggestion_sub_text: {
    color: "#b0b0b0",
    fontFamily: "raleway-semibold",
    fontSize: 12,
    marginTop: 5,
  },
});

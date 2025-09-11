import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  FlatList,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AntDesign,
  Entypo,
  Feather,
  FontAwesome,
  MaterialIcons,
  Ionicons,
  FontAwesome6,
} from "@expo/vector-icons";

import { router } from "expo-router";

import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

import { useNotificationContext } from "../../../context/NotificationContext";
import Notification from "../../../components/Notification";

import { useSavedPlaceContext } from "../../../context/SavedPlaceContext";
import { useMapContext } from "../../../context/MapContext";

const SavedPlaces = () => {
  const { notification } = useNotificationContext();

  const { savedPlaces } = useSavedPlaceContext();
  const homePlace = savedPlaces.find((p) => p.place_header === "home");
  const officePlace = savedPlaces.find((p) => p.place_header === "office");
  const otherPlaces = savedPlaces.filter(
    (p) => p.place_header !== "home" && p.place_header !== "office"
  );

  const bottomSheetRef = useRef<BottomSheet>(null);

  const [editable, setEditable] = useState<boolean>(false);
  const [placeHeader, setPlaceHeader] = useState<string>("");

  const addPlace = (place: string, edit: boolean) => {
    bottomSheetRef.current?.snapToIndex(0);
    setPlaceHeader(place);
    setEditable(edit);
  };

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
        <View style={{ marginTop: 10, zIndex: 1000 }}>
          <Pressable
            onPress={() => addPlace("home", false)}
            style={styles.place_box}
          >
            <Entypo name="home" color={"#fff"} size={22} />
            {homePlace ? (
              <View style={styles.place_box_text_container}>
                <Text style={styles.place_box_header}>Home</Text>
                <Text style={styles.place_box_name}>
                  {`${homePlace.place_name}, ${homePlace.place_sub_name}`}
                </Text>
              </View>
            ) : (
              <Text style={styles.place_box_add}>Add home location</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => addPlace("office", false)}
            style={styles.place_box}
          >
            <FontAwesome name="briefcase" color={"#fff"} size={20} />
            {officePlace ? (
              <View style={styles.place_box_text_container}>
                <Text style={styles.place_box_header}>Office</Text>
                <Text style={styles.place_box_name}>
                  {`${officePlace.place_name}, ${officePlace.place_sub_name}`}
                </Text>
              </View>
            ) : (
              <Text style={styles.place_box_add}>Add office location</Text>
            )}
          </Pressable>

          {otherPlaces && (
            <FlatList
              data={otherPlaces}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => {
                return (
                  <View style={styles.place_box}>
                    <FontAwesome6
                      name="location-dot"
                      color={"#fff"}
                      size={20}
                    />
                    <View style={styles.place_box_text_container}>
                      <Text style={styles.place_box_header}>
                        {item.place_header}
                      </Text>
                      <Text style={styles.place_box_name}>
                        {`${item.place_name}, ${item.place_sub_name}`}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}

          <Pressable
            onPress={() => addPlace("", true)}
            style={styles.place_box}
          >
            <Feather name="plus" color={"#fff"} size={22} />
            <Text style={styles.place_box_add}>Add place</Text>
          </Pressable>
        </View>
      </SafeAreaView>
      <PlaceModal
        ref={bottomSheetRef}
        placeHeader={placeHeader}
        setPlaceHeader={setPlaceHeader}
        editable={editable}
      />
    </>
  );
};

export default SavedPlaces;

const PlaceModal: FC<{
  ref: any;
  placeHeader: string;
  setPlaceHeader: Dispatch<SetStateAction<string>>;
  editable: boolean;
}> = ({ ref, placeHeader, setPlaceHeader, editable }) => {
  const { searchResults, searchPlace, savePlace } = useSavedPlaceContext();

  const { getPlaceCoords } = useMapContext();
  const [place, setPlace] = useState<string>("");

  const handleSheetChange = (index: number) => {
    if (index === -1) {
      setPlaceHeader("");
      setPlace("");
      Keyboard.dismiss();
    }
  };

  const save_place = async (
    place_id: string,
    place_name: string,
    place_sub_name: string
  ) => {
    ref.current?.snapToIndex(-1);
    try {
      setPlace(place_name);

      const coords: any = await getPlaceCoords(place_id);

      await savePlace(
        placeHeader.toLocaleLowerCase(),
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
      onChange={handleSheetChange}
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
          <View style={styles.text_inp_holder}>
            <MaterialIcons name="place" size={20} color={"#fff"} />
            <TextInput
              value={placeHeader}
              onChangeText={setPlaceHeader}
              editable={editable}
              placeholder="Enter place eg. Hotel, School"
              style={styles.text_inp}
            />
          </View>
          <View style={styles.text_inp_holder}>
            <Feather name="search" size={20} color={"#fff"} />
            <TextInput
              value={place}
              onChangeText={setPlace}
              placeholder="Search address"
              style={styles.text_inp}
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
  place_box: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  place_box_text_container: { width: 300 },
  place_box_header: {
    fontFamily: "raleway-bold",
    color: "#fff",
    fontSize: 16,
    textTransform: "capitalize",
  },
  place_box_name: {
    fontFamily: "raleway-regular",
    color: "#fff",
    fontSize: 14,
    flexShrink: 1,
  },
  place_box_add: {
    fontFamily: "raleway-regular",
    color: "#fff",
    fontSize: 16,
  },

  text_inp_holder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#484848",
    paddingHorizontal: 10,
    borderRadius: 7,
    marginTop: 10,
  },
  text_inp: {
    backgroundColor: "transparent",
    flex: 1,
    color: "#fff",
    fontFamily: "raleway-bold",
    textTransform: "capitalize",
  },

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

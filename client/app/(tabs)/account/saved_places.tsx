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
  Modal,
  TouchableOpacity,
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
  const [placeModalOpen, setPlaceOpenModal] = useState<boolean>(false);

  useEffect(() => {
    if (placeModalOpen) bottomSheetRef.current?.snapToIndex(0);
    else bottomSheetRef.current?.close();
  }, [placeModalOpen]);

  const [editable, setEditable] = useState<boolean>(false);
  const [placeHeader, setPlaceHeader] = useState<string>("");
  const [placeName, setPlaceName] = useState<string>("");

  const addPlace = (
    place_header: string,
    edit: boolean,
    place_name?: string
  ) => {
    setPlaceOpenModal(true);
    setPlaceHeader(place_header);
    setPlaceName(place_name || "");
    setEditable(edit);
  };

  const [actionModalOpen, setActionModalOpen] = useState<boolean>(false);
  const [actionPlaceHeader, setActionPlaceHeader] = useState<string>("");
  const [actionPlaceName, setActionPlaceName] = useState<string>("");
  const [actionPlaceSubName, setActionPlaceSubName] = useState<string>("");

  const open_action = (
    place_header: string,
    place_name: string,
    place_sub_name: string
  ) => {
    setActionModalOpen(true);
    setActionPlaceHeader(place_header);
    setActionPlaceName(place_name);
    setActionPlaceSubName(place_sub_name);
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
            onPress={() => {
              homePlace
                ? open_action(
                    homePlace.place_header,
                    homePlace.place_name,
                    homePlace.place_sub_name
                  )
                : addPlace("home", false);
            }}
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
            onPress={() => {
              officePlace
                ? open_action(
                    officePlace.place_header,
                    officePlace.place_name,
                    officePlace.place_sub_name
                  )
                : addPlace("office", false);
            }}
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
                  <Pressable
                    onPress={() =>
                      open_action(
                        item.place_header,
                        item.place_name,
                        item.place_sub_name
                      )
                    }
                    style={styles.place_box}
                  >
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
                  </Pressable>
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
        open={placeModalOpen}
        setOpen={setPlaceOpenModal}
        placeHeader={placeHeader}
        setPlaceHeader={setPlaceHeader}
        place={placeName}
        setPlace={setPlaceName}
        editable={editable}
      />
      <ActionModal
        open={actionModalOpen}
        setOpen={setActionModalOpen}
        setEditModal={addPlace}
        place_name={actionPlaceName}
        place_header={actionPlaceHeader}
        place_sub_name={actionPlaceSubName}
      />
    </>
  );
};

export default SavedPlaces;

const PlaceModal: FC<{
  ref: any;
  placeHeader: string;
  place: string;
  setPlace: Dispatch<SetStateAction<string>>;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setPlaceHeader: Dispatch<SetStateAction<string>>;
  editable: boolean;
}> = ({
  ref,
  placeHeader,
  place,
  setPlace,
  setOpen,
  setPlaceHeader,
  editable,
}) => {
  const { searchResults, searchPlace, savePlace } = useSavedPlaceContext();

  const { getPlaceCoords } = useMapContext();

  const handleSheetChange = (index: number) => {
    if (index === -1) {
      setPlaceHeader("");
      setPlace("");
      setOpen(false);
      Keyboard.dismiss();
    }
  };

  const save_place = async (
    place_id: string,
    place_name: string,
    place_sub_name: string
  ) => {
    try {
      setPlace(place_name);

      const coords: any = await getPlaceCoords(place_id);

      await savePlace(
        placeHeader.toLocaleLowerCase().trim(),
        place_id,
        place_name,
        place_sub_name,
        coords
      );
      setOpen(false);
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

const ActionModal: FC<{
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setEditModal: (
    place_header: string,
    edit: boolean,
    place_name?: string
  ) => void;
  place_header: string;
  place_name: string;
  place_sub_name: string;
}> = ({
  open,
  setOpen,
  setEditModal,
  place_name,
  place_header,
  place_sub_name,
}) => {
  const { deleteSavedPlace } = useSavedPlaceContext();

  const delete_place = async () => {
    try {
      setOpen(false);
      await deleteSavedPlace(place_header);
    } catch (error) {
      console.log(error);
    }
  };

  const edit_place = async () => {
    try {
      setOpen(false);
      setEditModal(place_header, false, place_name);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={open}
      onRequestClose={() => setOpen(false)}
    >
      <Pressable
        onPress={() => setOpen(false)}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#2b2b2b",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
          }}
        >
          <View style={{ width: 300 }}>
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-bold",
                fontSize: 18,
                textTransform: "capitalize",
              }}
            >
              {place_header}
            </Text>
            <Text
              style={{
                color: "#aaa",
                fontFamily: "raleway-semibold",
                flexShrink: 1,
              }}
            >
              {`${place_name}, ${place_sub_name}`}
            </Text>
          </View>
          <View style={{ marginTop: 20 }}>
            <TouchableOpacity
              onPress={edit_place}
              style={{
                width: "100%",
                borderRadius: 7,
                padding: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Feather name="edit-3" size={18} color={"#fff"} />
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "raleway-semibold",
                  fontSize: 16,
                }}
              >
                Edit place
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={delete_place}
              style={{
                width: "100%",
                borderRadius: 7,
                padding: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginTop: 15,
              }}
            >
              <Feather name="trash" size={18} color={"#ff0000"} />
              <Text
                style={{
                  fontFamily: "raleway-semibold",
                  fontSize: 16,
                  color: "#ff0000",
                }}
              >
                Delete place
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
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

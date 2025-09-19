import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Image,
  TextInput,
  FlatList,
  Pressable,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, {
  useState,
  useEffect,
  FC,
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
} from "react";

import * as Linking from "expo-linking";

import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import { ScrollView } from "react-native-gesture-handler";

import RideRoute from "./RideRoute";

import {
  FontAwesome,
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
  Entypo,
  Feather,
  FontAwesome6,
} from "@expo/vector-icons";

import { useAuthContext } from "../context/AuthContext";
import { useMapContext } from "../context/MapContext";
import { useRideContext } from "../context/RideContext";
import { useNotificationContext } from "../context/NotificationContext";
import { useWalletContext } from "../context/WalletContext";
import { useHistoryContext } from "../context/HistoryContext";

import DateTimePicker from "@react-native-community/datetimepicker";

import { router, useNavigation } from "expo-router";
import { useSavedPlaceContext } from "../context/SavedPlaceContext";
import { useRatingContext } from "../context/RatingContext";
import DriverCard, { DriverDetailsModal } from "./DriverCard";

const RouteModal = () => {
  const {
    userAddress,
    getPickupSuggestions,
    setDestinationSuggestions,
    setPickupSuggestions,
    getDestinationSuggestions,
    destination,
    setDestination,
    setDestinationCoords,
    fetchRoute,
    setMapPadding,
  } = useMapContext();

  const {
    rideStatus,
    setRideStatus,
    ongoingRideData,
    routeModalRef,
    resetRide,
  } = useRideContext();

  const [activeSuggestion, setActiveSuggestion] = useState<
    "pickup" | "destination" | ""
  >("");

  const pickupFocus = () => {
    setActiveSuggestion("pickup");
    setPickupSuggestions(null);
    setDestinationSuggestions(null);
  };
  const destinationFocus = () => {
    setActiveSuggestion("");
    setPickupSuggestions(null);
    setDestinationSuggestions(null);
  };

  useEffect(() => {
    userAddress
      ? getPickupSuggestions(userAddress)
      : setPickupSuggestions(null);
  }, [userAddress]);

  useEffect(() => {
    setActiveSuggestion("destination");

    destination
      ? getDestinationSuggestions(destination)
      : (() => {
          setDestinationSuggestions(null);
          setActiveSuggestion("");
        })();
  }, [destination]);

  useEffect(() => {
    if (ongoingRideData) {
      setDestination(ongoingRideData.destination.address);
      setDestinationCoords(ongoingRideData.destination.coordinates);
      fetchRoute(ongoingRideData.destination.coordinates);
      if (
        ongoingRideData.status === "pending" ||
        ongoingRideData.status === "expired"
      ) {
        setRideStatus("searching");
      }
      if (ongoingRideData.status === "accepted") {
        setRideStatus("accepted");
      }
      if (ongoingRideData.status === "arrived") {
        if (ongoingRideData.payment_status === "paid") {
          setRideStatus("paid");
        } else {
          setRideStatus("pay");
        }
      }
      if (ongoingRideData.status === "ongoing") {
        setRideStatus("paid");
      }
    }
  }, [ongoingRideData]);

  const windowHeight = Dimensions.get("window").height;

  const snapPoints = useMemo(
    () => ["22%", "32%", "40%", "60%", "80%", "93%"],
    []
  );

  const handleSheetChange = (index: number) => {
    const snapValue = snapPoints[index];
    let sheetHeight = 0;

    if (typeof snapValue === "string" && snapValue.includes("%")) {
      const percent = parseFloat(snapValue) / 100;
      sheetHeight = windowHeight * percent;
    } else if (typeof snapValue === "number") {
      sheetHeight = snapValue;
    }

    // always update padding
    if (index < 4) setMapPadding((prev) => ({ ...prev, bottom: sheetHeight }));

    // your ride logic
    if ((index === 0 || index === 1) && rideStatus === "booking") {
      setRideStatus("");
      resetRide();
    }
    if (index === 5 && rideStatus === "") {
      setRideStatus("booking");
    }
  };

  return (
    <BottomSheet
      index={1}
      snapPoints={snapPoints}
      ref={routeModalRef}
      onChange={handleSheetChange}
      enableContentPanningGesture={true}
      enableHandlePanningGesture={true}
      enableDynamicSizing={false}
      enableOverDrag={false}
      keyboardBehavior="interactive"
      backgroundStyle={{
        backgroundColor: "#121212",
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
      <BottomSheetView
        key={rideStatus}
        pointerEvents="box-none"
        style={styles.modal}
      >
        {/* Form */}
        {rideStatus === "" && <StartModal />}
        {/*  */}
        {rideStatus === "booking" && (
          <BookingModal
            activeSuggestion={activeSuggestion}
            pickupFocus={pickupFocus}
            destinationFocus={destinationFocus}
          />
        )}
        {/*  */}
        {rideStatus === "choosing_car" && <ChooseRideModal />}
        {/*  */}
        {rideStatus === "searching" && <SearchingModal />}
        {/*  */}
        {rideStatus === "accepted" && <AcceptedModal key={"accepted"} />}
        {/*  */}
        {rideStatus === "track_driver" && <TrackDriver key={"track_driver"} />}
        {/*  */}
        {rideStatus === "pay" && <PayModal />}
        {/*  */}
        {rideStatus === "paying" && <PayingModal />}
        {/*  */}
        {rideStatus === "paid" && <PaidModal />}
        {/*  */}
        {rideStatus === "track_ride" && <TrackRide />}
        {/*  */}
        {rideStatus === "rating" && <RateModal />}
      </BottomSheetView>
    </BottomSheet>
  );
};

const StartModal = () => {
  const { signedIn } = useAuthContext();

  const { destination, destinationCoords } = useMapContext();
  const { rideHistory } = useHistoryContext();

  const { setRideStatus, setModalUp, set_destination_func, routeModalRef } =
    useRideContext();
  return (
    <>
      <Text style={styles.header_text}>
        {signedIn?.name.split(" ")[1] || signedIn?.name.split(" ")[0]}, let's
        hit the road...
      </Text>

      <Pressable
        onPress={() => {
          setRideStatus("booking");
          setModalUp(true);
          routeModalRef.current.snapToIndex(3);
        }}
        style={styles.form}
      >
        <View style={styles.text_inp_container}>
          <Image
            source={require("../assets/images/icons/car-icon.png")}
            style={{ height: 30, width: 30 }}
          />
          <TextInput
            placeholder="Where we dey go?"
            value={destinationCoords ? destination : ""}
            selection={{ start: 0, end: 0 }}
            placeholderTextColor={"#8d8d8d"}
            editable={false}
            style={[styles.text_input, { color: "#8d8d8d" }]}
          />
        </View>
      </Pressable>

      {/* Saved places scroll view */}
      <SavedPlaces />

      {rideHistory?.length && (
        <TouchableOpacity
          style={{
            flexDirection: "row",
            gap: 10,
            marginTop: 30,
            alignItems: "center",
          }}
          onPress={() =>
            set_destination_func(
              rideHistory[0].place_id,
              rideHistory[0].place_name,
              rideHistory[0].place_sub_name
            )
          }
        >
          <View
            style={{ backgroundColor: "grey", padding: 5, borderRadius: 5 }}
          >
            <MaterialCommunityIcons name="history" size={24} color="#d0d0d0" />
          </View>
          <View style={{ width: "80%" }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "raleway-bold",
                fontSize: 16,
                color: "#8d8d8d",
              }}
            >
              {rideHistory && rideHistory[0].place_name}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "raleway-regular",
                fontSize: 12,
                color: "#8d8d8d",
              }}
            >
              {rideHistory && rideHistory[0].place_sub_name}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </>
  );
};

const SavedPlaces = () => {
  const { homePlace, officePlace, otherPlaces } = useSavedPlaceContext();
  const { set_destination_func } = useRideContext();

  return (
    <View style={{ marginTop: 20 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {/* Home */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            homePlace
              ? set_destination_func(
                  homePlace.place_id,
                  homePlace.place_name,
                  homePlace.place_sub_name
                )
              : router.push("../(tabs)/account/saved_places");
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            width: 140,
          }}
        >
          <Entypo name="home" color={"#8d8d8d"} size={22} />
          <View style={{ flexShrink: 1 }}>
            <Text style={{ fontFamily: "raleway-bold", color: "#8d8d8d" }}>
              Home
            </Text>
            {homePlace ? (
              <Text
                style={{
                  fontFamily: "raleway-regular",
                  color: "#8d8d8d",
                  fontSize: 12,
                  textTransform: "capitalize",
                }}
                numberOfLines={1}
              >
                {homePlace.place_name}
              </Text>
            ) : (
              <Text
                style={{
                  fontFamily: "raleway-regular",
                  color: "#8d8d8d",
                  fontSize: 12,
                }}
                numberOfLines={1}
              >
                Add place <Feather name="plus" color={"#8d8d8d"} size={12} />
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Office */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            officePlace
              ? set_destination_func(
                  officePlace.place_id,
                  officePlace.place_name,
                  officePlace.place_sub_name
                )
              : router.push("../(tabs)/account/saved_places");
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            width: 140,
          }}
        >
          <FontAwesome name="briefcase" color={"#8d8d8d"} size={20} />
          <View style={{ flexShrink: 1 }}>
            <Text style={{ fontFamily: "raleway-bold", color: "#8d8d8d" }}>
              Office
            </Text>
            {officePlace ? (
              <Text
                style={{
                  fontFamily: "raleway-regular",
                  color: "#8d8d8d",
                  fontSize: 12,
                  textTransform: "capitalize",
                }}
                numberOfLines={1}
              >
                {officePlace.place_name}
              </Text>
            ) : (
              <Text
                style={{
                  fontFamily: "raleway-regular",
                  color: "#8d8d8d",
                  fontSize: 12,
                }}
                numberOfLines={1}
              >
                Add place <Feather name="plus" color={"#8d8d8d"} size={12} />
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Other places */}
        {otherPlaces?.map((item) => (
          <TouchableOpacity
            key={item._id}
            activeOpacity={0.7}
            onPress={() => {
              set_destination_func(
                item.place_id,
                item.place_name,
                item.place_sub_name
              );
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              width: 140,
            }}
          >
            <FontAwesome6 name="location-dot" color={"#8d8d8d"} size={20} />
            <View style={{ flexShrink: 1 }}>
              <Text
                style={{
                  fontFamily: "raleway-bold",
                  color: "#8d8d8d",
                  textTransform: "capitalize",
                }}
              >
                {item.place_header}
              </Text>
              <Text
                style={{
                  fontFamily: "raleway-regular",
                  color: "#8d8d8d",
                  textTransform: "capitalize",
                }}
                numberOfLines={1}
              >
                {item.place_name}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Add new place */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("../(tabs)/account/saved_places")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            width: 140,
          }}
        >
          <FontAwesome6 name="plus" color={"#8d8d8d"} size={20} />
          <View style={{ flexShrink: 1 }}>
            <Text
              style={{
                fontFamily: "raleway-bold",
                color: "#8d8d8d",
                textTransform: "capitalize",
              }}
            >
              Add Place
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const BookingModal: FC<{
  activeSuggestion: "pickup" | "destination" | "";
  pickupFocus: any;
  destinationFocus: any;
}> = ({ activeSuggestion, pickupFocus, destinationFocus }) => {
  const {
    userAddress,
    setUserAddress,
    pickupSuggestions,
    destinationSuggestions,
    destination,
    setDestination,
  } = useMapContext();

  const { rideHistory } = useHistoryContext();

  const {
    setPickupModal,
    pickupTime,
    pickupRef,
    destinationRef,
    set_destination_func,
    set_pickup_func,
    placeId,
    dateTimeModal,
    setDateTimeModal,
  } = useRideContext();

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Choose your route...
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setPickupModal(true)}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: "#515151",
          borderColor: "#fff",
          borderWidth: pickupTime === "later" ? 1 : 0,
          marginTop: 20,
          alignSelf: "flex-end",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontFamily: "raleway-semibold",
            fontSize: 12,
          }}
        >
          Pickup {pickupTime}
        </Text>
        <FontAwesome name="chevron-down" color={"#fff"} size={10} />
      </TouchableOpacity>
      {/* Route slection form */}
      <View style={styles.form}>
        <View style={{ flex: 1, marginTop: 10, flexDirection: "row", gap: 15 }}>
          {/* Select pickup and drop off */}
          <View style={{ alignItems: "center", marginTop: 15 }}>
            <View
              style={{
                width: 15,
                height: 15,
                backgroundColor: "#9c9c9c",
                borderRadius: 20,
              }}
            />
            <View
              style={{
                width: 1,
                height: 40,
                borderLeftWidth: 1,
                borderColor: "#9c9c9c",
                borderStyle: "dashed",
              }}
            />
            <View
              style={{
                width: 14,
                height: 14,
                backgroundColor: "#9c9c9c",
              }}
            />
          </View>
          <View>
            <View style={styles.route_inp_container}>
              <TextInput
                style={[styles.route_input]}
                placeholder="Pickup"
                value={userAddress}
                ref={pickupRef}
                onFocus={pickupFocus}
                onChangeText={setUserAddress}
                placeholderTextColor={"#b7b7b7"}
              />
            </View>
            <View style={styles.route_inp_container}>
              <TextInput
                style={styles.route_input}
                placeholder="Destination"
                value={destination}
                ref={destinationRef}
                onFocus={destinationFocus}
                onChangeText={setDestination}
                placeholderTextColor={"#b7b7b7"}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Suggestions */}
      <View style={[styles.suggestions_container]}>
        {activeSuggestion === "pickup" ? (
          <FlatList
            data={pickupSuggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.suggestion_box}
                onPress={() =>
                  set_pickup_func(
                    item.place_id,
                    item.structured_formatting.main_text
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
        ) : activeSuggestion === "destination" ? (
          <FlatList
            data={destinationSuggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.suggestion_box}
                onPress={() =>
                  set_destination_func(
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
        ) : (
          <FlatList
            data={rideHistory as any}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.suggestion_box}
                onPress={() =>
                  set_destination_func(
                    item.place_id,
                    item.place_name,
                    item.place_sub_name
                  )
                }
              >
                <MaterialCommunityIcons
                  name="history"
                  size={24}
                  color="#b7b7b7"
                />
                <View>
                  <Text style={styles.suggestion_header_text} numberOfLines={1}>
                    {item.place_name}
                  </Text>
                  <Text style={styles.suggestion_sub_text}>
                    {item.place_sub_name}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
      <PickupTimeModal
        open={dateTimeModal}
        setOpen={setDateTimeModal}
        place_id={placeId}
      />
      <SelectPickupTimeModal />
    </>
  );
};

const ChooseRideModal = () => {
  const {
    rideDetails,
    calculating,
    pickupCoords,
    destination,
    destinationCoords,
    userAddress,
    region,
  } = useMapContext();

  const { rideRequest, setRideStatus, pickupTime, scheduledTime } =
    useRideContext();

  const { showNotification } = useNotificationContext();

  const [booking, setBooking] = useState<boolean>(false);
  const book_ride = async () => {
    setBooking(true);

    if (!destination || !destinationCoords)
      showNotification("Destination not set", "error");

    try {
      if (pickupTime === "later" && scheduledTime) {
        await rideRequest(
          {
            address: userAddress,
            coordinates: pickupCoords || [region.latitude, region.longitude],
          },
          { address: destination, coordinates: destinationCoords! },
          scheduledTime
        );
      } else {
        await rideRequest(
          {
            address: userAddress,
            coordinates: pickupCoords || [region.latitude, region.longitude],
          },
          { address: destination, coordinates: destinationCoords! }
        );
      }

      setBooking(false);
      setRideStatus("searching");
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      setBooking(false);
    }
  };
  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Select Igle ride...
      </Text>

      <View
        style={{
          borderColor: "#fff",
          borderWidth: 3,
          borderRadius: 10,
          width: "100%",
          paddingHorizontal: 20,
          paddingVertical: 5,
          marginTop: 20,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
          <Image
            source={require("../assets/images/icons/sedan-icon.png")}
            style={{ height: 50, width: 50 }}
          />
          <View>
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-semibold",
              }}
            >
              Cab ride
            </Text>
            <Text
              style={{
                color: "#fff",
                fontFamily: "poppins-regular",
                fontSize: 12,
              }}
            >
              {rideDetails?.distanceKm ?? "--"}km .{" "}
              {rideDetails?.durationMins ?? "--"}mins
            </Text>
          </View>
        </View>
        <View>
          <Text
            style={{
              color: "#fff",
              alignSelf: "flex-end",
              fontFamily: "poppins-bold",
              fontSize: 16,
            }}
          >
            NGN {rideDetails?.amount.toLocaleString() ?? "----"}
          </Text>
        </View>
      </View>
      <TouchableWithoutFeedback
        onPress={book_ride}
        disabled={booking || calculating || !rideDetails}
      >
        <View
          style={{
            marginVertical: 20,
            padding: 10,
            borderRadius: 30,
            backgroundColor: "#fff",
            opacity: booking || calculating || !rideDetails ? 0.5 : 1,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontFamily: "raleway-bold",
              color: "#121212",
            }}
          >
            {booking ? "Booking..." : "Book now"}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
};

const SearchingModal = () => {
  const { region, mapRef } = useMapContext();

  const [searchText, setSearchText] = useState<string>(
    "Searching for drivers..."
  );

  const {
    cancelling,
    cancelRideRequest,
    ongoingRideData,
    retrying,
    retryRideRequest,
  } = useRideContext();

  const { showNotification } = useNotificationContext();

  useEffect(() => {
    const validStatuses = ["pending", "scheduled"];

    // If status is not valid, just clear and exit
    if (!validStatuses.includes(ongoingRideData?.status!)) {
      setSearchText("Searching for drivers..."); // optional: reset text
      return;
    }

    const messages = [
      { text: "We're trying to locate drivers around you...", delay: 3_000 },
      {
        text: "Please wait, still locating drivers around you...",
        delay: 10_000,
      },
      { text: "Expanding area of search...", delay: 10_000 },
    ];

    let totalDelay = 0;
    const timeouts: NodeJS.Timeout[] = [];

    messages.forEach(({ text, delay }) => {
      totalDelay += delay;
      const id = setTimeout(() => {
        setSearchText(text);
      }, totalDelay);
      timeouts.push(id);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [ongoingRideData?.status]);

  const cancel_ride = async () => {
    const reason = "No reason";
    const by = "rider";
    const ride_id = ongoingRideData?._id;

    try {
      ride_id && (await cancelRideRequest(ride_id, by, reason));
      if (region) mapRef.current.animateToRegion(region, 1000);
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  const retry_ride = async () => {
    try {
      await retryRideRequest();
    } catch (error: any) {
      showNotification(error.message, "success");
    }
  };
  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        {ongoingRideData?.status === "expired"
          ? "Ride timeout"
          : "Searching for driver"}
      </Text>

      <View style={{ marginTop: 20 }}>
        {ongoingRideData?.status !== "expired" && (
          <ActivityIndicator
            size={"large"}
            color={"#fff"}
            style={{ marginBottom: 20, marginTop: 10 }}
          />
        )}
        <Text
          style={{
            fontFamily: "raleway-regular",
            color: "#fff",
            textAlign: "center",
          }}
        >
          {ongoingRideData?.status === "expired"
            ? `No Driver was found at this time to go to ${ongoingRideData.destination.address}`
            : searchText}
        </Text>
      </View>

      {ongoingRideData?.status === "expired" && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 30,
            gap: 20,
          }}
        >
          <Pressable
            onPress={retry_ride}
            disabled={retrying}
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "center",
              backgroundColor: "#fff",
              opacity: retrying ? 0.5 : 1,
              borderRadius: 30,
              padding: 10,
            }}
          >
            <Text
              style={{
                color: "#121212",
                fontFamily: "raleway-bold",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {retrying ? "Retrying..." : "Retry"}
            </Text>
          </Pressable>
          <Pressable
            onPress={cancel_ride}
            disabled={cancelling}
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "center",
              borderColor: "#fff",
              borderWidth: 1,
              borderRadius: 30,
              padding: 10,
            }}
          >
            <Text
              style={{
                color: cancelling ? "#d7d7d7" : "#fff",
                fontFamily: "raleway-bold",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {cancelling ? "Cancelling..." : "Cancel"}
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );
};

const AcceptedModal = () => {
  const { region, mapRef } = useMapContext();

  const { cancelling, cancelRideRequest, ongoingRideData, setRideStatus } =
    useRideContext();

  const { showNotification } = useNotificationContext();

  const cancel_ride = async () => {
    const reason = "No reason";
    const by = "rider";
    const ride_id = ongoingRideData?._id;

    try {
      ride_id && (await cancelRideRequest(ride_id, by, reason));
      if (region) mapRef.current.animateToRegion(region, 1000);
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  const track_driver = () => {
    setRideStatus("track_driver");
    setTimeout(() => {
      if (mapRef.current && ongoingRideData)
        mapRef.current.animateToRegion(
          {
            longitudeDelta: 0.02,
            latitudeDelta: 0.02,
            latitude: ongoingRideData.driver.current_location.coordinates[0],
            longitude: ongoingRideData.driver.current_location.coordinates[1],
          },
          1000
        );
    }, 1000);
  };

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Driver found
      </Text>

      <Text style={[styles.rideStatusText, { marginTop: 20 }]}>
        This driver is on his way...
      </Text>

      {/* Ride request card */}
      {ongoingRideData && <RideRequestCard />}

      <TouchableOpacity
        activeOpacity={0.7}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 50,
          backgroundColor: "#fff",
          marginTop: 20,
        }}
        onPress={track_driver}
      >
        <Text
          style={{
            fontFamily: "raleway-bold",
            color: "#121212",
            textAlign: "center",
          }}
        >
          Track driver
        </Text>
      </TouchableOpacity>

      <TouchableWithoutFeedback onPress={cancel_ride} disabled={cancelling}>
        <Text
          style={{
            color: cancelling ? "#ff000080" : "#ff0000",
            marginTop: 30,
            fontFamily: "raleway-bold",
            textAlign: "center",
          }}
        >
          {cancelling ? "Cancelling..." : "Canel this ride"}
        </Text>
      </TouchableWithoutFeedback>
    </>
  );
};

const TrackDriver = () => {
  const { setRideStatus, ongoingRideData } = useRideContext();
  const { mapRef, routeCoords } = useMapContext();

  const see_ride_info = () => {
    if (mapRef.current)
      mapRef.current.fitToCoordinates(routeCoords, {
        edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    setRideStatus("accepted");
  };

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center", fontSize: 16 }]}>
        Tracking driver...
      </Text>

      {ongoingRideData && (
        <DriverCard
          name={ongoingRideData?.driver.user.name}
          id={ongoingRideData?.driver._id}
          total_trips={ongoingRideData?.driver.total_trips}
          rating={ongoingRideData?.driver.rating}
          num_of_reviews={ongoingRideData?.driver.num_of_reviews}
        />
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={see_ride_info}
        style={{
          marginVertical: 30,
          padding: 10,
          borderRadius: 30,
          backgroundColor: "#fff",
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontFamily: "raleway-bold",
            color: "#121212",
          }}
        >
          See ride info
        </Text>
      </TouchableOpacity>
    </>
  );
};

const PayModal = () => {
  const { setRideStatus, ongoingRideData } = useRideContext();

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Driver arrived
      </Text>

      <Text style={[styles.rideStatusText, { marginTop: 20 }]}>
        Your driver has arrived!
      </Text>

      <RideRequestCard />

      <Pressable
        style={{
          marginVertical: 50,
          padding: 10,
          borderRadius: 30,
          backgroundColor: "#fff",
        }}
        onPress={() => {
          setRideStatus("paying");
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontFamily: "raleway-bold",
            color: "#121212",
          }}
        >
          Pay NGN {ongoingRideData?.fare.toLocaleString()}
        </Text>
      </Pressable>
    </>
  );
};

const PayingModal = () => {
  const { rideDetails } = useMapContext();

  const { setRideStatus, payForRide } = useRideContext();

  const { userWalletBal } = useWalletContext();

  const [paying, setPaying] = useState<boolean>(false);
  const pay_func = async () => {
    setPaying(true);
    try {
      await payForRide();
    } catch (error) {
      console.log(error);
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <Text
        style={[
          styles.header_text,
          { textAlign: "center", fontFamily: "poppins-bold" },
        ]}
      >
        Confirm payment ({rideDetails?.amount.toLocaleString()} NGN)
      </Text>

      <View style={{ marginTop: 25 }}>
        <Text style={{ color: "#fff", fontFamily: "poppins-regular" }}>
          Wallet balance: {userWalletBal.toLocaleString()} NGN
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 20,
            marginTop: 25,
          }}
        >
          <Pressable
            onPress={pay_func}
            disabled={paying}
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              paddingHorizontal: 30,
              paddingVertical: 10,
              flex: 1,
              opacity: paying ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                color: "#121212",
                fontFamily: "raleway-bold",
                textAlign: "center",
              }}
            >
              {paying ? "Confirming..." : "Confirm"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setRideStatus("pay");
            }}
            style={{
              borderRadius: 20,
              paddingHorizontal: 30,
              paddingVertical: 10,
              borderStyle: "solid",
              borderWidth: 1,
              borderColor: "#fff",
              flex: 1,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-bold",
                textAlign: "center",
              }}
            >
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
};

const PaidModal = () => {
  const { pickupTime, scheduledTimeDif, setRideStatus, ongoingRideData } =
    useRideContext();
  const { mapRef } = useMapContext();

  const track_ride = () => {
    setRideStatus("track_ride");
    if (mapRef.current)
      setTimeout(() => {
        if (mapRef.current && ongoingRideData)
          mapRef.current.animateToRegion(
            {
              longitudeDelta: 0.02,
              latitudeDelta: 0.02,
              latitude: ongoingRideData.pickup.coordinates[0],
              longitude: ongoingRideData.pickup.coordinates[1],
            },
            1000
          );
      }, 1000);
  };

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center", fontSize: 16 }]}>
        {pickupTime === "later" || ongoingRideData?.scheduled_time
          ? `Your ride has been scheduled so head to pickup in ${scheduledTimeDif} time`
          : "Alright, hang tight, we'll take it from here..."}
      </Text>
      {pickupTime === "later" || ongoingRideData?.scheduled_time ? (
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            marginVertical: 20,
            padding: 10,
            borderRadius: 30,
            backgroundColor: "#fff",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontFamily: "raleway-bold",
              color: "#121212",
            }}
          >
            See ride details
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            marginVertical: 20,
            padding: 10,
            borderRadius: 30,
            backgroundColor: "#fff",
          }}
          onPress={track_ride}
        >
          <Text
            style={{
              textAlign: "center",
              fontFamily: "raleway-bold",
              color: "#121212",
            }}
          >
            Track ride
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
};

const TrackRide = () => {
  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center", fontSize: 16 }]}>
        Tracking ride...
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          router.push("../(tabs)/rides");
        }}
        style={{
          marginVertical: 30,
          padding: 10,
          borderRadius: 30,
          backgroundColor: "#fff",
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontFamily: "raleway-bold",
            color: "#121212",
          }}
        >
          See ride info
        </Text>
      </TouchableOpacity>
    </>
  );
};

const SelectPickupTimeModal = () => {
  const { setPickupModal, setPickupTime, pickupModal, pickupTime } =
    useRideContext();

  const handleSelect = (item: "now" | "later") => {
    setPickupTime(item);
  };
  return (
    <Modal
      visible={pickupModal}
      transparent
      animationType="slide"
      onRequestClose={() => setPickupModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { textAlign: "center" }]}>
            When do you want to ride
          </Text>

          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.7}
            onPress={() => handleSelect("now")}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 15 }}
              >
                <Ionicons name="time" color={"#fff"} size={20} />
                <View>
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "raleway-bold",
                      fontSize: 16,
                    }}
                  >
                    {"Now"}
                  </Text>
                  <Text
                    style={{ color: "#fff", fontFamily: "raleway-regular" }}
                  >
                    Pick me up now
                  </Text>
                </View>
              </View>
              <View style={styles.radioOuter}>
                {pickupTime === "now" && <View style={styles.radioInner} />}
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.7}
            onPress={() => handleSelect("later")}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 15 }}
              >
                <FontAwesome5 name="calendar-day" color={"#fff"} size={20} />
                <View>
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "raleway-bold",
                      fontSize: 16,
                    }}
                  >
                    Later
                  </Text>
                  <Text
                    style={{ color: "#fff", fontFamily: "raleway-regular" }}
                  >
                    Schedule the ride for later
                  </Text>
                </View>
              </View>
              <View style={styles.radioOuter}>
                {pickupTime === "later" && <View style={styles.radioInner} />}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: "#fff",
              marginVertical: 10,
              paddingVertical: 10,
              borderRadius: 5,
            }}
            activeOpacity={0.7}
            onPress={() => setPickupModal(false)}
          >
            <Text
              style={{
                color: "#121212",
                fontFamily: "raleway-bold",
                textAlign: "center",
              }}
            >
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const RateModal = () => {
  const { rating, review, setRating, setReview, createRating, ratingLoading } =
    useRatingContext();

  const { resetRide, ongoingRideData } = useRideContext();

  const rate_driver = async () => {
    try {
      ongoingRideData &&
        (await createRating(ongoingRideData._id, ongoingRideData.driver._id));
      resetRide();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.header_text}>You have arrived!</Text>
      <View
        style={{
          flex: 1,
          justifyContent: "space-between",
          paddingBottom: 20,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Image
            source={require("../assets/images/black-profile.jpeg")}
            style={{
              width: 70,
              height: 70,
              borderRadius: 40,
              marginTop: 20,
            }}
          />
          <Text
            style={{
              color: "#fff",
              fontFamily: "raleway-regular",
              marginTop: 10,
            }}
          >
            How was this driver?
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: 20,
              marginTop: 20,
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <FontAwesome
                  name={rating >= star ? "star" : "star-o"}
                  size={30}
                  color="#fff"
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ width: "100%" }}>
            <TextInput
              value={review}
              onChangeText={setReview}
              style={{
                backgroundColor: "transparent",
                borderColor: "#fff",
                borderWidth: 1,
                color: "#fff",
                borderRadius: 10,
                padding: 20,
                marginTop: 20,
                fontFamily: "raleway-regular",
              }}
              placeholder="Write a review"
            />
          </View>
        </View>

        <View>
          <Text style={{ color: "#fff", fontFamily: "raleway-bold" }}>
            Ride summary
          </Text>
          {ongoingRideData && (
            <RideRoute
              from={ongoingRideData?.pickup.address}
              to={ongoingRideData.destination.address}
            />
          )}

          <Text
            style={{
              color: "#d2ceceff",
              fontFamily: "raleway-bold",
              fontSize: 14,
              marginBottom: 10,
            }}
          >
            **You rode {ongoingRideData?.distance_km}km for{" "}
            {ongoingRideData?.duration_mins} mins
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-regular",
                fontSize: 18,
              }}
            >
              Total fare:
            </Text>
            <Text style={styles.priceText}>
              NGN {ongoingRideData?.fare.toLocaleString()}(Paid)
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 20,
            marginTop: 20,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={resetRide}
            style={{
              backgroundColor: "transparent",
              borderColor: "#fff",
              borderWidth: 1,
              borderRadius: 50,
              width: 100,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-bold",
                textAlign: "center",
              }}
            >
              Skip
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={rate_driver}
            disabled={ratingLoading}
            activeOpacity={0.7}
            style={{
              backgroundColor: "#fff",
              borderRadius: 50,
              paddingHorizontal: 20,
              paddingVertical: 10,
              flex: 1,
              opacity: ratingLoading ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                color: "#121212",
                fontFamily: "raleway-bold",
                textAlign: "center",
              }}
            >
              {ratingLoading ? "Submitting" : "Submit review"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const PickupTimeModal: FC<{
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  place_id: string;
}> = ({ open, setOpen, place_id }) => {
  const { showNotification } = useNotificationContext();
  const {
    scheduledTime,
    scheduledTimeDif,
    getTimeDifference,
    setScheduledTimeDif,
    setScheduledTime,
  } = useRideContext();
  const [dateInp, setDateInp] = useState<string>("");

  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const onDateChange = useCallback(
    (_: any, selectedDate?: Date) => {
      if (selectedDate && scheduledTime) {
        const newDate = new Date(scheduledTime);
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());
        setScheduledTime(newDate);
        setDateInp(newDate.toLocaleString());
        setShowDate(false);
        setShowTime(true);
      } else {
        setShowDate(false);
      }
    },
    [scheduledTime]
  );

  const onTimeChange = useCallback(
    (_: any, selectedTime?: Date) => {
      if (selectedTime && scheduledTime) {
        const newDate = new Date(scheduledTime);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setScheduledTime(newDate);
        setDateInp(newDate.toLocaleString());
      }
      setShowTime(false);
    },
    [scheduledTime]
  );

  const {
    getPlaceCoords,
    setDestinationCoords,
    calculateRide,
    pickupCoords,
    region,
  } = useMapContext();

  const { setModalUp, setRideStatus } = useRideContext();

  const schedule_ride = async () => {
    setOpen(false);
    // Check if time is valid
    const minAllowed = new Date();
    minAllowed.setMinutes(minAllowed.getMinutes() + 30);

    if (scheduledTime < minAllowed) {
      showNotification(
        "Please select a time at least 30 mins from now.",
        "error"
      );
      return;
    }

    setModalUp(false);
    setRideStatus("choosing_car");
    const coords = await getPlaceCoords(place_id);
    if (coords) {
      setDestinationCoords(coords);
      await calculateRide(pickupCoords || [region.latitude, region.longitude], [
        ...coords,
      ]);
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={() => setOpen(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { textAlign: "center" }]}>
            Pick your time
          </Text>

          {scheduledTimeDif && (
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-bold",
                marginVertical: 10,
              }}
            >
              **Scheduled for {scheduledTimeDif} from now**
            </Text>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowDate(true)}
          >
            <TextInput
              style={{
                backgroundColor: "#515151",
                color: "#fff",
                fontFamily: "raleway-semibold",
                paddingHorizontal: 10,
                textAlign: "center",
              }}
              editable={false}
              placeholder="--_--_-- --:--"
              placeholderTextColor={"#d7d7d7"}
              value={dateInp}
            />
          </TouchableOpacity>

          {showDate && (
            <DateTimePicker
              value={scheduledTime}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={onDateChange}
            />
          )}

          {showTime && (
            <DateTimePicker
              value={scheduledTime}
              mode="time"
              display="default"
              is24Hour={false}
              onChange={onTimeChange}
            />
          )}

          <TouchableOpacity
            disabled={!scheduledTime}
            style={{
              backgroundColor: "#fff",
              marginVertical: 10,
              paddingVertical: 10,
              borderRadius: 5,
              opacity: !scheduledTime ? 0.7 : 1,
            }}
            activeOpacity={0.7}
            onPress={schedule_ride}
          >
            <Text
              style={{
                color: "#121212",
                fontFamily: "raleway-bold",
                textAlign: "center",
              }}
            >
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const RideRequestCard = () => {
  const { ongoingRideData } = useRideContext();
  const [openDriverDetails, setOpenDriverDetails] = useState<boolean>(false);

  return (
    <View style={styles.rideRequestCard}>
      {/* Header */}
      <View style={styles.rideRequestHeader}>
        {/* User */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setOpenDriverDetails(true)}
          style={styles.userInfo}
        >
          <Image
            source={require("../assets/images/black-profile.jpeg")}
            style={styles.userImage}
          />
          <View>
            <Text style={styles.userName}>
              {ongoingRideData?.driver.user.name}
            </Text>
            <Text style={styles.userRides}>
              {ongoingRideData?.driver.total_trips || "No"} ride(s) completed
            </Text>
          </View>
        </TouchableOpacity>

        {ongoingRideData && (
          <DriverDetailsModal
            id={ongoingRideData?.driver._id}
            open={openDriverDetails}
            setOpen={setOpenDriverDetails}
          />
        )}

        {/* Call btn */}
        <TouchableWithoutFeedback
          onPress={() =>
            Linking.openURL(`tel:${ongoingRideData?.driver.user.phone}`)
          }
        >
          <View style={styles.callBtn}>
            <FontAwesome name="phone" color={"#121212"} size={20} />
          </View>
        </TouchableWithoutFeedback>
      </View>

      {/* Estimated time and duration */}
      <View style={{ marginVertical: 20 }}>
        <View style={styles.timeRow}>
          <MaterialIcons name="access-time" color={"#d7d7d7"} size={16} />
          <Text style={styles.timeText}>
            {ongoingRideData?.duration_mins} mins (
            {ongoingRideData?.distance_km} km)
          </Text>
        </View>

        <View style={styles.timeRow}>
          <Ionicons name="car" color={"#d7d7d7"} size={16} />
          <Text style={styles.timeText}>
            {ongoingRideData?.driver?.vehicle.color}{" "}
            {ongoingRideData?.driver?.vehicle.brand}{" "}
            {ongoingRideData?.driver?.vehicle.model}
          </Text>
        </View>
      </View>

      {/* Ride route card */}
      {ongoingRideData && (
        <RideRoute
          from={ongoingRideData?.pickup.address}
          to={ongoingRideData?.destination.address}
        />
      )}

      {/* Price */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontFamily: "raleway-regular",
            fontSize: 18,
          }}
        >
          Total fare:
        </Text>
        <Text style={styles.priceText}>
          {ongoingRideData?.fare.toLocaleString()} NGN
        </Text>
      </View>
      {/* <Text
          style={{
            marginVertical: 20,
            color: "#fff",
            fontFamily: "raleway-regular",
            fontSize: 12,
          }}
        >
          *Please ensure the driver has arrived before paying for this ride
        </Text> */}
    </View>
  );
};

export default RouteModal;

const styles = StyleSheet.create({
  modal: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  expand_line_conatiner: {
    width: "100%",
    padding: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  expand_line: {
    height: 5,
    width: 40,
    borderRadius: 10,
    backgroundColor: "grey",
  },
  header_text: {
    fontFamily: "raleway-bold",
    color: "#fff",
    fontSize: 20,
  },
  form: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },

  select_ride_container: {
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#515151",
    borderStyle: "solid",
    paddingBottom: 20,
  },
  select_ride_box: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 7,
    borderColor: "grey",
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: 20,
    padding: 5,
    paddingHorizontal: 10,
    backgroundColor: "grey",
  },
  select_ride_box_active: {
    backgroundColor: "#fff",
  },
  select_ride_text_active: {
    color: "#121212",
  },
  text_inp_container: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    backgroundColor: "#3f3f3f",
    marginTop: 20,
    borderRadius: 7,
  },
  text_input: {
    backgroundColor: "transparent",
    flex: 1,
    fontFamily: "raleway-bold",
    fontSize: 18,
    color: "#fff",
  },
  route_inp_container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  route_input: {
    backgroundColor: "#515151",
    borderRadius: 5,
    marginTop: 5,
    width: "95%",
    color: "#ffffff",
    paddingHorizontal: 20,
    fontFamily: "raleway-semibold",
  },
  from_circle: {
    width: 15,
    height: 15,
    backgroundColor: "#ffffff",
    borderRadius: "50%",
  },
  to_square: {
    width: 12,
    height: 12,
    backgroundColor: "#ffffff",
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

  rideStatusText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "raleway-bold",
    marginBottom: 10,
  },
  rideRequestCard: {
    borderStyle: "solid",
    borderColor: "#a0a0a0ff",
    borderWidth: 0.5,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  rideRequestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  userInfo: {
    flexDirection: "row",
    gap: 20,
  },
  userImage: {
    width: 30,
    height: 30,
  },
  userName: {
    color: "#fff",
    fontFamily: "raleway-semibold",
  },
  userRides: {
    color: "#d7d7d7",
    fontSize: 10,
    fontFamily: "raleway-regular",
  },
  timeoutText: {
    fontFamily: "poppins-regular",
    color: "#fff",
  },
  callBtn: {
    backgroundColor: "#fff",
    borderRadius: 50,
    width: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeText: {
    color: "#d7d7d7",
    fontFamily: "poppins-regular",
    fontSize: 12,
    marginTop: 3,
  },
  priceText: {
    color: "#fff",
    fontFamily: "poppins-bold",
    fontSize: 18,
  },
  actionBtnsRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  acceptBtn: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 10,
    flex: 1,
  },
  acceptBtnText: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 16,
    textAlign: "center",
  },
  cancelBtn: {
    backgroundColor: "transparent",
    borderRadius: 30,
    borderStyle: "solid",
    borderColor: "#fff",
    borderWidth: 1,
    padding: 10,
    flex: 1,
  },
  cancelBtnText: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
    textAlign: "center",
  },
  navigateBtnRow: {
    marginTop: 20,
  },
  navigateBtn: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 10,
    flex: 1,
  },
  navigateBtnText: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 16,
    textAlign: "center",
  },
  navigationContainer: {
    backgroundColor: "#121212",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "50%",
    borderTopWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: "#fff",
    fontFamily: "raleway-bold",
  },
  option: {
    paddingVertical: 10,
  },
  optionText: { fontSize: 16, color: "#fff", fontFamily: "raleway-regular" },
  closeBtn: {
    marginTop: 15,
    alignSelf: "center",
    padding: 10,
  },
  closeText: { color: "red", fontSize: 14, fontFamily: "raleway-semibold" },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#ffffff",
  },
});

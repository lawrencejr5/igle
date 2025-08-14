import {
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableWithoutFeedback,
  Image,
  TextInput,
  FlatList,
  Dimensions,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";

import RideRoute from "./RideRoute";

import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons";

import { useAuthContext } from "../context/AuthContext";
import { useMapContext } from "../context/MapContext";
import { useRideContext } from "../context/RideContext";
import { useNotificationContext } from "../context/NotificationContext";
import { useDriverAuthContext } from "../context/DriverAuthContext";

const RouteModal = () => {
  const { signedIn } = useAuthContext();

  const {
    region,
    userAddress,
    setUserAddress,
    mapSuggestions,
    setMapSuggestions,
    getSuggestions,
    getPlaceCoords,
    locationLoading,
    rideDetails,
    calculateRide,
    destination,
    setDestination,
    destinationCoords,
    setDestinationCoords,
  } = useMapContext();

  const { rideRequest, rideStatus, setRideStatus, modalUp, setModalUp } =
    useRideContext();

  const { driverData } = useDriverAuthContext();
  const { showNotification } = useNotificationContext();

  const set_destination_func = async (place_id: string, place_name: string) => {
    setDestination(place_name);
    setModalUp(false);
    setRideStatus("choosing_car");

    const coords = await getPlaceCoords(place_id);
    if (coords) {
      setDestinationCoords(coords);

      await calculateRide([region.latitude, region.longitude], [...coords]);
    }
  };

  const [booking, setBooking] = useState<boolean>(false);
  const book_ride = async () => {
    setBooking(true);

    const pickupCoords: [number, number] = [region.latitude, region.longitude];

    if (!destination || !destinationCoords)
      showNotification("Destination not set", "error");

    if (!userAddress || !pickupCoords)
      showNotification("Pickup location not set", "error");

    try {
      await rideRequest(
        { address: userAddress, coordinates: pickupCoords },
        { address: destination, coordinates: destinationCoords }
      );
      setBooking(false);
      setModalUp(false);
      setRideStatus("searching");
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      setBooking(false);
    }
  };

  useEffect(() => {
    if (destination) {
      getSuggestions(destination);
    }
  }, [destination]);

  const window_height = Dimensions.get("window").height - 70;
  const height = useRef(new Animated.Value(220)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const [carType, setCarType] = useState<"sedan" | "keke" | "suv">("keke");

  useEffect(() => {
    if (modalUp) {
      Animated.parallel([
        Animated.timing(height, {
          toValue: window_height,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(height, {
          toValue: 220,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [modalUp]);

  // useEffect(() => {
  //   if (status === "searching") {
  //     const searchTimeout = setTimeout(() => {
  //       setRideStatus("accepted");
  //       setModalUp(true);
  //     }, 3000);

  //     () => clearTimeout(searchTimeout);
  //   }
  // }, [status]);

  return (
    <Animated.View style={[styles.modal, { height: height }]}>
      {/* Form */}
      {rideStatus === "" && (
        <>
          <TouchableWithoutFeedback
            onPress={() => {
              setModalUp(true);
              setRideStatus("booking");
            }}
          >
            <View style={styles.expand_line_conatiner}>
              <View style={styles.expand_line} />
            </View>
          </TouchableWithoutFeedback>

          <Text style={styles.header_text}>
            {signedIn.name.split(" ")[1]}, let's go places...
          </Text>

          <TouchableWithoutFeedback
            onPress={() => {
              setModalUp(true);
              setRideStatus("booking");
            }}
          >
            <View style={styles.form}>
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
            </View>
          </TouchableWithoutFeedback>
        </>
      )}
      {rideStatus === "booking" && (
        <>
          <TouchableWithoutFeedback
            onPress={() => {
              setModalUp(false);
              setRideStatus("");
            }}
          >
            <View style={styles.expand_line_conatiner}>
              <View style={styles.expand_line} />
            </View>
          </TouchableWithoutFeedback>

          <Text style={[styles.header_text, { textAlign: "center" }]}>
            Choose your route...
          </Text>

          {/* Route slection form */}
          <Animated.View style={[styles.form, { opacity }]}>
            <View style={{ flex: 1, marginTop: 10 }}>
              {/* Pick car type */}

              {/* <View style={styles.select_ride_container}>
                <TouchableWithoutFeedback onPress={() => setCarType("keke")}>
                  <View
                    style={[
                      styles.select_ride_box,
                      carType === "keke" && styles.select_ride_box_active,
                    ]}
                  >
                    <Image
                      source={require("../assets/images/icons/keke-icon.png")}
                      style={{ width: 25, height: 25 }}
                    />
                    <Text
                      style={[
                        { color: "#fff", fontFamily: "raleway-bold" },
                        carType === "keke" && styles.select_ride_text_active,
                      ]}
                    >
                      Keke
                    </Text>
                  </View>
                </TouchableWithoutFeedback>

                <TouchableWithoutFeedback onPress={() => setCarType("sedan")}>
                  <View
                    style={[
                      styles.select_ride_box,
                      carType === "sedan" && styles.select_ride_box_active,
                    ]}
                  >
                    <Image
                      source={require("../assets/images/icons/sedan-icon.png")}
                      style={{ width: 25, height: 25 }}
                    />
                    <Text
                      style={[
                        { color: "#fff", fontFamily: "raleway-bold" },
                        carType === "sedan" && styles.select_ride_text_active,
                      ]}
                    >
                      Cab
                    </Text>
                  </View>
                </TouchableWithoutFeedback>

                <TouchableWithoutFeedback onPress={() => setCarType("suv")}>
                  <View
                    style={[
                      styles.select_ride_box,
                      carType === "suv" && styles.select_ride_box_active,
                    ]}
                  >
                    <Image
                      source={require("../assets/images/icons/suv-icon.png")}
                      style={{ width: 25, height: 25 }}
                    />
                    <Text
                      style={[
                        { color: "#fff", fontFamily: "raleway-bold" },
                        carType === "suv" && styles.select_ride_text_active,
                      ]}
                    >
                      SUV
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
              </View> */}

              {/* Select pickup and drop off */}
              <View style={styles.route_inp_container}>
                <View style={styles.from_circle} />
                <TextInput
                  style={[styles.route_input]}
                  placeholder="Pickup"
                  value={userAddress}
                  onChangeText={setUserAddress}
                  placeholderTextColor={"#b7b7b7"}
                  selection={{ start: 0, end: 0 }}
                  editable={false}
                />
              </View>
              <View style={styles.route_inp_container}>
                <View style={styles.to_square} />
                <TextInput
                  style={styles.route_input}
                  placeholder="Destination"
                  value={destination}
                  onChangeText={setDestination}
                  placeholderTextColor={"#b7b7b7"}
                />
              </View>
            </View>
          </Animated.View>

          {/* Suggestions */}
          <View style={[styles.suggestions_container]}>
            <FlatList
              data={mapSuggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableWithoutFeedback
                  onPress={() =>
                    set_destination_func(
                      item.place_id,
                      item.structured_formatting.main_text
                    )
                  }
                >
                  <View style={styles.suggestion_box}>
                    <Ionicons name="location" size={24} color="#b7b7b7" />
                    <View>
                      <Text
                        style={styles.suggestion_header_text}
                        numberOfLines={1}
                      >
                        {item.structured_formatting.main_text}
                      </Text>
                      <Text style={styles.suggestion_sub_text}>
                        {item.structured_formatting.secondary_text}
                      </Text>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              )}
            />
          </View>
        </>
      )}
      {rideStatus === "choosing_car" && (
        <>
          <TouchableWithoutFeedback
            onPress={() => {
              setModalUp(!modalUp);
            }}
          >
            <View style={styles.expand_line_conatiner}>
              <View style={styles.expand_line} />
            </View>
          </TouchableWithoutFeedback>

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
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 15 }}
            >
              <Image
                source={require("../assets/images/icons/keke-icon.png")}
                style={{ height: 50, width: 50 }}
              />
              <View>
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "raleway-semibold",
                  }}
                >
                  Keke na Pepe
                </Text>
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "poppins-regular",
                    fontSize: 12,
                  }}
                >
                  {rideDetails.distanceKm}km . {rideDetails.durationMins}mins
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
                NGN {rideDetails.amount.toLocaleString()}
              </Text>
            </View>
          </View>
          <TouchableWithoutFeedback onPress={book_ride}>
            <View
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
                {booking ? "Booking..." : "Book now"}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </>
      )}
      {rideStatus === "searching" && (
        <>
          <TouchableWithoutFeedback
            onPress={() => {
              setModalUp(!modalUp);
            }}
          >
            <View style={styles.expand_line_conatiner}>
              <View style={styles.expand_line} />
            </View>
          </TouchableWithoutFeedback>

          <Text
            style={[styles.header_text, { textAlign: "center", marginTop: 20 }]}
          >
            Searching for driver
          </Text>

          <View style={{ marginTop: 20 }}>
            <Text
              style={{
                fontFamily: "raleway-regular",
                color: "#fff",
                textAlign: "center",
              }}
            >
              We're trying to locate drivers around you...
            </Text>
          </View>
        </>
      )}
      {rideStatus === "accepted" && (
        <>
          <TouchableWithoutFeedback
            onPress={() => {
              setModalUp(!modalUp);
            }}
          >
            <View style={styles.expand_line_conatiner}>
              <View style={styles.expand_line} />
            </View>
          </TouchableWithoutFeedback>

          <Text style={[styles.header_text, { textAlign: "center" }]}>
            Driver found
          </Text>

          <Text style={[styles.rideStatusText, { marginTop: 20 }]}>
            This driver is on his way...
          </Text>

          {/* Ride request card */}
          <View style={styles.rideRequestCard}>
            {/* Header */}
            <View style={styles.rideRequestHeader}>
              {/* User */}
              <View style={styles.userInfo}>
                <Image
                  source={require("../assets/images/black-profile.jpeg")}
                  style={styles.userImage}
                />
                <View>
                  <Text style={styles.userName}>{driverData?.name}</Text>
                  <Text style={styles.userRides}>No ride completed</Text>
                </View>
              </View>

              {/* Call btn */}
              <View style={styles.callBtn}>
                <FontAwesome name="phone" color={"#121212"} size={20} />
              </View>
            </View>

            {/* Estimated time and duration */}
            <View style={{ marginVertical: 20 }}>
              <View style={styles.timeRow}>
                <MaterialIcons name="access-time" color={"#d7d7d7"} size={16} />
                <Text style={styles.timeText}>
                  {rideDetails.durationMins} mins ({rideDetails.distanceKm} km)
                </Text>
              </View>

              <View style={styles.timeRow}>
                <Ionicons name="car" color={"#d7d7d7"} size={16} />
                <Text style={styles.timeText}>
                  {driverData?.vehicle_color} {driverData?.vehicle_brand}{" "}
                  {driverData?.vehicle_model}
                </Text>
              </View>
            </View>

            {/* Ride route card */}
            <RideRoute from={userAddress} to={destination} />

            {/* Price */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={styles.priceText}>{rideDetails.amount} NGN</Text>
              <TouchableWithoutFeedback
                onPress={() => {
                  setRideStatus("paying");
                  setModalUp(false);
                }}
              >
                <View
                  style={{
                    backgroundColor: "#fff",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      color: "#121212",
                      fontFamily: "raleway-bold",
                      textAlign: "center",
                      fontSize: 12,
                    }}
                  >
                    Pay from wallet
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
            <Text
              style={{
                marginVertical: 20,
                color: "#fff",
                fontFamily: "raleway-regular",
                fontSize: 12,
              }}
            >
              *Please ensure the driver has arrived before paying for this ride
            </Text>
          </View>

          <TouchableWithoutFeedback
            onPress={() => {
              setRideStatus(""), setModalUp(false);
            }}
          >
            <Text
              style={{
                marginTop: 50,
                color: "#ff0000",
                fontFamily: "raleway-bold",
                textAlign: "center",
              }}
            >
              Canel this ride
            </Text>
          </TouchableWithoutFeedback>
        </>
      )}
      {rideStatus === "paying" && (
        <>
          <TouchableWithoutFeedback
            onPress={() => {
              setModalUp(!modalUp);
            }}
          >
            <View style={styles.expand_line_conatiner}>
              <View style={styles.expand_line} />
            </View>
          </TouchableWithoutFeedback>

          <Text style={[styles.header_text, { textAlign: "center" }]}>
            Confirm payment (1,500 NGN)
          </Text>

          <View style={{ marginTop: 25 }}>
            <Text style={{ color: "#fff", fontFamily: "poppins-regular" }}>
              Wallet balance: 12,500 NGN
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 20,
                marginTop: 10,
              }}
            >
              <TouchableWithoutFeedback
                onPress={() => {
                  setRideStatus("paid");
                  setModalUp(false);
                }}
              >
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    paddingHorizontal: 30,
                    paddingVertical: 10,
                    flex: 1,
                  }}
                >
                  <Text
                    style={{
                      color: "#121212",
                      fontFamily: "raleway-bold",
                      textAlign: "center",
                    }}
                  >
                    Confirm
                  </Text>
                </View>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback
                onPress={() => {
                  setRideStatus("accepted");
                  setModalUp(true);
                }}
              >
                <View
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
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </>
      )}
      {rideStatus === "paid" && (
        <>
          <TouchableWithoutFeedback
            onPress={() => {
              setModalUp(!modalUp);
            }}
          >
            <View style={styles.expand_line_conatiner}>
              <View style={styles.expand_line} />
            </View>
          </TouchableWithoutFeedback>

          <Text
            style={[
              styles.header_text,
              { textAlign: "center", marginTop: 20, fontSize: 16 },
            ]}
          >
            Alright, hang tight, we'll take it from here...
          </Text>
        </>
      )}
    </Animated.View>
  );
};

export default RouteModal;

const styles = StyleSheet.create({
  modal: {
    width: "100%",
    backgroundColor: "#121212",
    position: "absolute",
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 3,
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
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },

  select_ride_container: {
    marginBottom: 20,
    marginTop: 20,
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
    width: "90%",
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
    color: "#10b804ff",
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
});

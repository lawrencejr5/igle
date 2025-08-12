import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import React, { useState, useEffect } from "react";

import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import Feather from "@expo/vector-icons/Feather";

import { darkMapStyle } from "../../data/map.dark";

import * as Location from "expo-location";

import SideNav from "../../components/SideNav";
import NotificationScreen from "../../components/screens/NotificationScreen";
import RouteModal from "../../components/RouteModal";
import LocationUpdateModal from "../../components/LocationUpdateModal";

import Notification from "../../components/Notification";
import { useNotificationContext } from "../../context/NotificationContext";

import { useDriverAuthContext } from "../../context/DriverAuthContext";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import RideRoute from "../../components/RideRoute";

const HomePage = () => {
  const { notification } = useNotificationContext()!;
  const { getDriverProfile, driver } = useDriverAuthContext();

  useEffect(() => {
    getDriverProfile();
  }, []);

  // Side nav state
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);

  // Notification screen state
  const [openNotification, setOpenNotification] = useState<boolean>(false);

  // Location update modal state
  const [locationModalOpen, setLocationModalOpen] = useState<boolean>(false);

  const [region, setRegion] = useState<any>(null);
  useEffect(() => {
    // Getting current location
    const get_and_set_location = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    };
    get_and_set_location();
  }, []);

  const [available, setAvailable] = useState<boolean>(false);
  const [status, setStatus] = useState<
    | "searching"
    | "incoming"
    | "accepted"
    | "arriving"
    | "arrived"
    | "ongoing"
    | "completed"
    | ""
  >("");

  useEffect(() => {
    if (available && status === "searching") {
      setStatus("searching");
      const findOffer = setTimeout(() => {
        setStatus("incoming");
      }, 3000);
      return () => clearTimeout(findOffer);
    }
    if (!available) {
      setStatus("searching");
    }
  }, [available, status]);

  const [countDown, setCountDown] = useState<number>(90);

  useEffect(() => {
    if (status !== "incoming") {
      setCountDown(90);
      return;
    }

    const timer = setInterval(() => {
      setCountDown((prev) => {
        if (prev === 1) {
          setStatus("searching");
          return 90;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=Lagos&key=AIzaSyDdZZ0ji5pbx3ddhhlvYugGNvSxOOC3Zss`
    )
      .then((res) => res.json())
      .then((data) => console.log("Google API response:", data))
      .catch((err) => console.log("Error calling Google API:", err));
  }, []);

  return (
    <>
      <Notification notification={notification} />
      <View style={styles.container}>
        {/* Map */}
        <MapView
          style={styles.map}
          onMapReady={() => {
            console.log("yeehhhh");
          }}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          customMapStyle={darkMapStyle}
        >
          {region && (
            <Marker
              coordinate={{
                latitude: region.latitude,
                longitude: region.longitude,
              }}
              title="Your location"
            >
              <View style={styles.markerIcon}>
                <Image
                  source={require("../../assets/images/icons/keke-icon.png")}
                  style={styles.markerImage}
                />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Nav */}
        <View style={styles.nav_container}>
          <TouchableWithoutFeedback onPress={() => setSideNavOpen(true)}>
            <View style={styles.nav_box}>
              <Feather name="menu" size={22} color="white" />
            </View>
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback onPress={() => setOpenNotification(true)}>
            <View style={styles.nav_box}>
              <Feather name="bell" size={22} color="white" />
            </View>
          </TouchableWithoutFeedback>
        </View>

        {/* Side nav */}
        <SideNav
          open={sideNavOpen}
          setSideNavOpen={setSideNavOpen}
          mode="driver"
        />

        {/* Notification screen */}
        <NotificationScreen
          open={openNotification}
          setOpen={setOpenNotification}
        />

        {/* Location Update Modal */}
        <LocationUpdateModal
          visible={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
        />

        {/* Searching for drivers */}
        <View
          style={{ flex: 1, width: "100%", position: "absolute", bottom: 0 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              padding: 20,
            }}
          >
            <TouchableWithoutFeedback
              onPress={() => setLocationModalOpen(true)}
            >
              <View style={styles.locationButton}>
                <Ionicons name="location" size={24} color="#fff" />
              </View>
            </TouchableWithoutFeedback>
          </View>
          <View style={styles.main_modal_container}>
            {available && (
              <View style={styles.availableContainer}>
                {status === "searching" && (
                  <View>
                    <Text style={styles.searchingText}>
                      Searching for new ride offers...
                    </Text>
                  </View>
                )}
                {status === "incoming" && (
                  <>
                    <Text style={styles.rideStatusText}>
                      Incoming ride request
                    </Text>

                    {/* Ride request card */}
                    <View style={styles.rideRequestCard}>
                      {/* Header */}
                      <View style={styles.rideRequestHeader}>
                        {/* User */}
                        <View style={styles.userInfo}>
                          <Image
                            source={require("../../assets/images/black-profile.jpeg")}
                            style={styles.userImage}
                          />
                          <View>
                            <Text style={styles.userName}>Oputa Lawrence</Text>
                            <Text style={styles.userRides}>
                              34 ride completed
                            </Text>
                          </View>
                        </View>

                        {/* Timeout or call */}
                        <Text style={styles.timeoutText}>{countDown}s</Text>
                      </View>

                      {/* Estimated time and duration */}
                      <View style={styles.timeRow}>
                        <MaterialIcons
                          name="access-time"
                          color={"#d7d7d7"}
                          size={16}
                        />
                        <Text style={styles.timeText}>24 mins (3.45 km)</Text>
                      </View>

                      {/* Ride route card */}
                      <RideRoute from="Konwea plaza" to="Slot, Nnebisi road" />

                      {/* Price */}
                      <Text style={styles.priceText}>1,500 NGN</Text>

                      {/* Action btns */}
                      <View style={styles.actionBtnsRow}>
                        <TouchableWithoutFeedback
                          onPress={() => setStatus("accepted")}
                        >
                          <View style={styles.acceptBtn}>
                            <Text style={styles.acceptBtnText}>Accept</Text>
                          </View>
                        </TouchableWithoutFeedback>

                        <TouchableWithoutFeedback
                          onPress={() => setStatus("searching")}
                        >
                          <View style={styles.cancelBtn}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </View>
                        </TouchableWithoutFeedback>
                      </View>
                    </View>
                  </>
                )}
                {status === "accepted" && (
                  <>
                    <Text style={styles.rideStatusText}>IOngoing ride</Text>

                    {/* Ride request card */}
                    <View style={styles.rideRequestCard}>
                      {/* Header */}
                      <View style={styles.rideRequestHeader}>
                        {/* User */}
                        <View style={styles.userInfo}>
                          <Image
                            source={require("../../assets/images/black-profile.jpeg")}
                            style={styles.userImage}
                          />
                          <View>
                            <Text style={styles.userName}>Oputa Lawrence</Text>
                            <Text style={styles.userRides}>
                              34 ride completed
                            </Text>
                          </View>
                        </View>

                        {/* Call btn */}
                        <View style={styles.callBtn}>
                          <FontAwesome
                            name="phone"
                            color={"#121212"}
                            size={20}
                          />
                        </View>
                      </View>

                      {/* Estimated time and duration */}
                      <View style={styles.timeRow}>
                        <MaterialIcons
                          name="access-time"
                          color={"#d7d7d7"}
                          size={16}
                        />
                        <Text style={styles.timeText}>24 mins (3.45 km)</Text>
                      </View>

                      {/* Ride route card */}
                      <RideRoute from="Konwea plaza" to="Slot, Nnebisi road" />

                      {/* Price */}
                      <Text style={styles.priceText}>1,500 NGN</Text>

                      {/* Action btns */}

                      <View style={styles.navigateBtnRow}>
                        <TouchableWithoutFeedback
                          onPress={() => setStatus("arriving")}
                        >
                          <View style={styles.navigateBtn}>
                            <Text style={styles.navigateBtnText}>
                              Navigate to pickup
                            </Text>
                          </View>
                        </TouchableWithoutFeedback>
                      </View>
                    </View>
                  </>
                )}
                {status === "arriving" && (
                  <View style={styles.navigationContainer}>
                    <View style={styles.directionsRow}>
                      <FontAwesome5
                        name="directions"
                        color={"#fff"}
                        size={24}
                      />
                      <Text style={styles.directionsText}>
                        Go 3km and then turn right
                      </Text>
                    </View>
                    <View style={styles.arrivedBtnRow}>
                      <TouchableWithoutFeedback
                        onPress={() => setStatus("arrived")}
                      >
                        <View style={styles.arrivedBtn}>
                          <Text style={styles.arrivedBtnText}>
                            I have arrived at pickup
                          </Text>
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  </View>
                )}
                {status === "arrived" && (
                  <View style={styles.navigationContainer}>
                    <View style={styles.directionsRow}>
                      <Text style={styles.directionsText}>
                        When payment is confirmed, start the trip
                      </Text>
                    </View>
                    <View style={styles.arrivedBtnRow}>
                      <TouchableWithoutFeedback
                        onPress={() => setStatus("ongoing")}
                      >
                        <View style={styles.arrivedBtn}>
                          <Text style={styles.arrivedBtnText}>Start trip</Text>
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  </View>
                )}
                {status === "ongoing" && (
                  <View style={styles.navigationContainer}>
                    <View style={styles.directionsRow}>
                      <FontAwesome5
                        name="directions"
                        color={"#fff"}
                        size={24}
                      />
                      <Text style={styles.directionsText}>
                        Go 3km and then turn right
                      </Text>
                    </View>
                    <View style={styles.arrivedBtnRow}>
                      <TouchableWithoutFeedback
                        onPress={() => setStatus("completed")}
                      >
                        <View style={styles.arrivedBtn}>
                          <Text style={styles.arrivedBtnText}>Finish ride</Text>
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  </View>
                )}
                {status === "completed" && (
                  <View style={styles.navigationContainer}>
                    <View style={styles.directionsRow}>
                      <MaterialIcons
                        name="celebration"
                        color={"#fff"}
                        size={24}
                      />
                      <Text style={styles.directionsText}>
                        You have finished this ride
                      </Text>
                    </View>
                    <View style={styles.arrivedBtnRow}>
                      <TouchableWithoutFeedback
                        onPress={() => setStatus("searching")}
                      >
                        <View style={styles.arrivedBtn}>
                          <Text style={styles.arrivedBtnText}>
                            Search for another ride
                          </Text>
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Offline mode */}
            <View style={styles.main_modal}>
              <Image
                source={require("../../assets/images/black-profile.jpeg")}
                style={styles.profileImage}
              />
              <TouchableWithoutFeedback
                onPress={() => setAvailable(!available)}
              >
                {available ? (
                  <View
                    style={[styles.status, { backgroundColor: "#40863a4f" }]}
                  >
                    <Text style={[styles.status_text, { color: "#33b735ff" }]}>
                      You're online
                    </Text>
                  </View>
                ) : (
                  <View style={styles.status}>
                    <Text style={styles.status_text}>You're offline</Text>
                  </View>
                )}
              </TouchableWithoutFeedback>
              <FontAwesome name="sliders" size={24} color="#d7d7d7" />
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
    flex: 1,
  },
  map: {
    height: "95%",
  },
  markerIcon: {
    width: 35,
    height: 35,
  },
  markerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  nav_container: {
    width: "100%",
    flexDirection: "row",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1,
    position: "absolute",
    top: 50,
    gap: 10,
  },
  nav_box: {
    width: 45,
    height: 45,
    backgroundColor: "#121212",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  main_modal_container: {
    backgroundColor: "#121212",
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: "space-between",
  },
  availableContainer: {
    backgroundColor: "#121212",
    width: "100%",
    flex: 1,
    marginBottom: 40,
  },
  searchingText: {
    color: "#fff",
    fontFamily: "raleway-bold",
    textAlign: "center",
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
    marginTop: 20,
    marginBottom: 10,
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
  directionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  directionsText: {
    textAlign: "center",
    color: "#fff",
    fontFamily: "raleway-bold",
  },
  arrivedBtnRow: {
    marginTop: 20,
  },
  arrivedBtn: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 10,
    flex: 1,
  },
  arrivedBtnText: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 16,
    textAlign: "center",
  },
  main_modal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileImage: {
    height: 40,
    width: 40,
    borderRadius: 20,
  },
  status: {
    backgroundColor: "#ff44002a",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  status_text: {
    fontFamily: "raleway-bold",
    fontSize: 12,
    color: "#d12705",
  },
  locationButton: {
    backgroundColor: "#121212",
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});

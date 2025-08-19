import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  Image,
  TextInput,
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

import AsyncStorage from "@react-native-async-storage/async-storage";

import Notification from "../../components/Notification";
import { useNotificationContext } from "../../context/NotificationContext";

import { useDriverAuthContext } from "../../context/DriverAuthContext";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import RideRoute from "../../components/RideRoute";
import { useMapContext } from "../../context/MapContext";
import { useDriverContext } from "../../context/DriverContext";

const HomePage = () => {
  const { notification } = useNotificationContext();
  const { getDriverProfile, driver, driverSocket } = useDriverAuthContext();
  const {
    setAvailability,
    setDriveStatus,
    driveStatus,
    fetchIncomingRideData,
    incomingRideData,
    setIncomingRideData,
    acceptRideRequest,
  } = useDriverContext();
  const { region } = useMapContext();

  useEffect(() => {
    getDriverProfile();
  }, []);

  // Side nav state
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);

  // Notification screen state
  const [openNotification, setOpenNotification] = useState<boolean>(false);

  // Location update modal state
  const [locationModalOpen, setLocationModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (driver?.is_available && driveStatus === "searching") {
      const new_ride_func = async (data: any) => {
        setDriveStatus("incoming");
        await fetchIncomingRideData(data.ride_id);
      };
      driverSocket.on("new_ride_request", new_ride_func);

      return () => driverSocket.off("new_ride_request", new_ride_func);
    }
  }, [driver?.is_available, driveStatus, driverSocket]);

  useEffect(() => {
    if (!driver?.is_available) {
      setDriveStatus("searching");
      setIncomingRideData(null);
    }
  }, [driver?.is_available]);

  const [countDown, setCountDown] = useState<number>(90);

  useEffect(() => {
    if (driveStatus !== "incoming") {
      setCountDown(90);
      return;
    }

    const timer = setInterval(() => {
      setCountDown((prev) => {
        if (prev === 1) {
          setDriveStatus("searching");
          setIncomingRideData(null);
          return 90;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [driveStatus]);

  const setAvailableFunc = async () => {
    try {
      await setAvailability(!driver?.is_available);
    } catch (error) {
      console.log(error);
    }
  };

  const [accepting, setAccepting] = useState<boolean>(false);
  const accept_incoming_ride = async () => {
    setAccepting(true);
    try {
      await acceptRideRequest();
      setDriveStatus("accepted");
    } catch (error) {
      console.log(error);
    } finally {
      setAccepting(false);
    }
  };

  const reject_incoming_ride = () => {
    setDriveStatus("searching");
    setIncomingRideData(null);
  };

  return (
    <>
      <Notification notification={notification} />
      <View style={styles.container}>
        {/* Map */}
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            ...region,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
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
            {driver?.is_available && (
              <View style={styles.availableContainer}>
                {driveStatus === "searching" && (
                  <View>
                    <Text style={styles.searchingText}>
                      Searching for new ride offers...
                    </Text>
                  </View>
                )}
                {driveStatus === "incoming" && incomingRideData && (
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
                            <Text style={styles.userName}>
                              {incomingRideData.rider.name}
                            </Text>
                            <Text style={styles.userRides}>
                              No rides completed
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
                        <Text style={styles.timeText}>
                          {incomingRideData.duration_mins} mins (
                          {incomingRideData.distance_km} km)
                        </Text>
                      </View>

                      {/* Ride route card */}
                      <RideRoute
                        from={incomingRideData.pickup.address}
                        to={incomingRideData.destination.address}
                      />

                      {/* Price */}
                      <Text style={styles.priceText}>
                        NGN {incomingRideData.fare.toLocaleString()}
                      </Text>

                      {/* Action btns */}
                      <View style={styles.actionBtnsRow}>
                        <TouchableWithoutFeedback
                          onPress={accept_incoming_ride}
                          disabled={accepting}
                        >
                          <View
                            style={[
                              styles.acceptBtn,
                              { opacity: accepting ? 0.5 : 1 },
                            ]}
                          >
                            <Text style={styles.acceptBtnText}>
                              {accepting ? "Accepting" : "Accept"}
                            </Text>
                          </View>
                        </TouchableWithoutFeedback>

                        <TouchableWithoutFeedback
                          onPress={reject_incoming_ride}
                        >
                          <View style={styles.cancelBtn}>
                            <Text style={styles.cancelBtnText}>Reject</Text>
                          </View>
                        </TouchableWithoutFeedback>
                      </View>
                    </View>
                  </>
                )}
                {driveStatus === "accepted" && (
                  <>
                    <Text style={styles.rideStatusText}>Ongoing ride</Text>

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
                          onPress={() => setDriveStatus("arriving")}
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
                {driveStatus === "arriving" && (
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
                        onPress={() => setDriveStatus("arrived")}
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
                {driveStatus === "arrived" && (
                  <View style={styles.navigationContainer}>
                    <View style={styles.directionsRow}>
                      <Text style={styles.directionsText}>
                        When payment is confirmed, start the trip
                      </Text>
                    </View>
                    <View style={styles.arrivedBtnRow}>
                      <TouchableWithoutFeedback
                        onPress={() => setDriveStatus("ongoing")}
                      >
                        <View style={styles.arrivedBtn}>
                          <Text style={styles.arrivedBtnText}>Start trip</Text>
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  </View>
                )}
                {driveStatus === "ongoing" && (
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
                        onPress={() => setDriveStatus("completed")}
                      >
                        <View style={styles.arrivedBtn}>
                          <Text style={styles.arrivedBtnText}>Finish ride</Text>
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  </View>
                )}
                {driveStatus === "completed" && (
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
                        onPress={() => setDriveStatus("searching")}
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
              <TouchableWithoutFeedback onPress={setAvailableFunc}>
                {driver?.is_available ? (
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

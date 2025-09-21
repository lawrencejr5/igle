import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import React, { useState, useEffect } from "react";

import * as Linking from "expo-linking";

import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  FontAwesome5,
} from "@expo/vector-icons";
import { useDriverAuthContext } from "../context/DriverAuthContext";
import { useDriverContext } from "../context/DriverContext";
import { useNotificationContext } from "../context/NotificationContext";
import { useMapContext } from "../context/MapContext";

import RideRoute from "./RideRoute";

const DriverRideModal = () => {
  const { getDriverProfile, driver, driverSocket } = useDriverAuthContext();
  const {
    setDriveStatus,
    driveStatus,
    fetchIncomingRideData,
    incomingRideData,
    setIncomingRideData,
    ongoingRideData,
    setLocationModalOpen,
  } = useDriverContext();

  const { showNotification } = useNotificationContext();

  useEffect(() => {
    getDriverProfile();
  }, []);

  useEffect(() => {
    if (driver?.is_available && driveStatus === "searching" && driverSocket) {
      const new_ride_func = async (data: any) => {
        setDriveStatus("incoming");
        await fetchIncomingRideData(data.ride_id);
      };

      const ride_taken_func = (data: any) => {
        setIncomingRideData((prev: any) => {
          if (prev?._id === data.ride_id) {
            showNotification("Ride has been claimed", "error");
            return null;
          }
          return prev;
        });
      };

      driverSocket.on("new_ride_request", new_ride_func);
      driverSocket.on("ride_taken", ride_taken_func);

      return () => {
        driverSocket.off("new_ride_request", new_ride_func);
        driverSocket.off("ride_taken", ride_taken_func);
      };
    }
  }, [driver?.is_available, driveStatus, driverSocket]);

  useEffect(() => {
    if (!driver?.is_available) {
      setDriveStatus("searching");
      setIncomingRideData(null);
    }
  }, [driver?.is_available]);

  return (
    <View style={{ flex: 1, width: "100%", position: "absolute", bottom: 0 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          padding: 20,
        }}
      >
        <TouchableWithoutFeedback onPress={() => setLocationModalOpen(true)}>
          <View style={styles.locationButton}>
            <Ionicons name="location" size={24} color="#fff" />
          </View>
        </TouchableWithoutFeedback>
      </View>
      <View style={styles.main_modal_container}>
        {driver?.is_available && (
          <View style={styles.availableContainer}>
            {driveStatus === "searching" && <SearchingModal />}
            {/*  */}
            {driveStatus === "incoming" && incomingRideData && (
              <IncomingModal />
            )}
            {/*  */}
            {driveStatus === "accepted" && ongoingRideData && <AcceptedModal />}
            {/*  */}
            {driveStatus === "arriving" && <ArrivingModal />}
            {/*  */}
            {driveStatus === "arrived" && <ArrivedModal />}
            {/*  */}
            {driveStatus === "ongoing" && <OngoingModal />}
            {/*  */}
            {driveStatus === "completed" && <CompletedModal />}
          </View>
        )}

        {/* Offline mode */}
        <OfflineMode />
      </View>
    </View>
  );
};

const OfflineMode = () => {
  const { driver } = useDriverAuthContext();
  const { setAvailability } = useDriverContext();

  return (
    <View style={styles.main_modal}>
      <Image
        source={require("../assets/images/user.png")}
        style={styles.profileImage}
      />
      {driver?.is_available ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={async () => await setAvailability()}
          style={[styles.status, { backgroundColor: "#40863a4f" }]}
        >
          <Text style={[styles.status_text, { color: "#33b735ff" }]}>
            You're online
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={async () => await setAvailability()}
          style={styles.status}
        >
          <Text style={styles.status_text}>You're offline</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity activeOpacity={20}>
        <Ionicons name="wallet" size={30} color="#d7d7d7" />
      </TouchableOpacity>
    </View>
  );
};

const SearchingModal = () => {
  return (
    <View>
      <Text style={styles.searchingText}>Searching for new ride offers...</Text>
    </View>
  );
};

const IncomingModal = () => {
  const {
    incomingRideData,
    driveStatus,
    setDriveStatus,
    setIncomingRideData,
    acceptRideRequest,
  } = useDriverContext();

  const [countDown, setCountDown] = useState<number>(90);
  const [accepting, setAccepting] = useState<boolean>(false);

  useEffect(() => {
    if (driveStatus !== "incoming") {
      setCountDown(30);
      return;
    }

    const timer = setInterval(() => {
      setCountDown((prev) => {
        if (prev === 1) {
          setDriveStatus("searching");
          setIncomingRideData(null);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [driveStatus]);

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
      <Text style={styles.rideStatusText}>Incoming ride request</Text>

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
              <Text style={styles.userName}>{incomingRideData.rider.name}</Text>
              <Text style={styles.userRides}>No rides completed</Text>
            </View>
          </View>

          {/* Timeout or call */}
          <Text style={styles.timeoutText}>{countDown}s</Text>
        </View>

        {/* Estimated time and duration */}
        <View style={styles.timeRow}>
          <MaterialIcons name="access-time" color={"#d7d7d7"} size={16} />
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
            <View style={[styles.acceptBtn, { opacity: accepting ? 0.5 : 1 }]}>
              <Text style={styles.acceptBtnText}>
                {accepting ? "Accepting" : "Accept"}
              </Text>
            </View>
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback onPress={reject_incoming_ride}>
            <View style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Reject</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </>
  );
};

const AcceptedModal = () => {
  const { ongoingRideData, setDriveStatus } = useDriverContext();

  return (
    <>
      <Text style={styles.rideStatusText}>Ongoing ride</Text>

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
              <Text style={styles.userName}>{ongoingRideData.rider.name}</Text>
              <Text style={styles.userRides}>No rides completed</Text>
            </View>
          </View>

          {/* Call btn */}
          <TouchableWithoutFeedback
            onPress={() =>
              Linking.openURL(`tel:${ongoingRideData.rider.phone}`)
            }
          >
            <View style={styles.callBtn}>
              <FontAwesome name="phone" color={"#121212"} size={20} />
            </View>
          </TouchableWithoutFeedback>
        </View>

        {/* Estimated time and duration */}
        <View style={styles.timeRow}>
          <MaterialIcons name="access-time" color={"#d7d7d7"} size={16} />
          <Text style={styles.timeText}>
            {ongoingRideData.duration_mins} mins ({ongoingRideData.distance_km}{" "}
            km)
          </Text>
        </View>

        {/* Ride route card */}
        <RideRoute
          from={ongoingRideData.pickup.address}
          to={ongoingRideData.destination.address}
        />

        {/* Price */}
        <Text style={styles.priceText}>
          {ongoingRideData.fare.toLocaleString()} NGN
        </Text>

        {/* Action btns */}

        <View style={styles.navigateBtnRow}>
          <TouchableWithoutFeedback onPress={() => setDriveStatus("arriving")}>
            <View style={styles.navigateBtn}>
              <Text style={styles.navigateBtnText}>Navigate to pickup</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </>
  );
};

const ArrivingModal = () => {
  const {
    ongoingRideData,
    updateRideStatus,
    setDriveStatus,
    setToPickupRouteCoords,
  } = useDriverContext();

  const [arriving, setArriving] = useState<boolean>(false);
  const set_arrived = async () => {
    setArriving(true);
    try {
      await updateRideStatus("arrived");
      setDriveStatus("arrived");
      setToPickupRouteCoords([]);
    } catch (error) {
      console.log(error);
    } finally {
      setArriving(false);
    }
  };

  return (
    <View style={styles.navigationContainer}>
      <View style={styles.directionsRow}>
        <FontAwesome5 name="directions" color={"#fff"} size={30} />
        <Text style={styles.directionsText}>
          {`Alright quickly head to ${ongoingRideData.pickup.address}, it should take about ${ongoingRideData.duration_mins} mins`}
        </Text>
      </View>
      <View style={styles.arrivedBtnRow}>
        <TouchableWithoutFeedback onPress={set_arrived} disabled={arriving}>
          <View style={[styles.arrivedBtn, { opacity: arriving ? 0.5 : 1 }]}>
            <Text style={styles.arrivedBtnText}>I have arrived at pickup</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

const ArrivedModal = () => {
  const { updateRideStatus, setDriveStatus } = useDriverContext();
  const { showNotification } = useNotificationContext();

  const [starting, setStarting] = useState<boolean>(false);
  const start_ride = async () => {
    setStarting(true);
    try {
      await updateRideStatus("ongoing");
      showNotification("This ride has started", "success");
      setDriveStatus("ongoing");
    } catch (error) {
      console.log(error);
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={styles.navigationContainer}>
      <View style={styles.directionsRow}>
        <Text style={styles.directionsText}>
          When payment is confirmed, you can start the trip
        </Text>
      </View>
      <View style={styles.arrivedBtnRow}>
        <TouchableWithoutFeedback onPress={start_ride} disabled={starting}>
          <View style={[styles.arrivedBtn, { opacity: starting ? 0.5 : 1 }]}>
            <Text style={styles.arrivedBtnText}>Start trip</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

const OngoingModal = () => {
  const { ongoingRideData, updateRideStatus, setDriveStatus } =
    useDriverContext();
  const { showNotification } = useNotificationContext();

  const [completing, setCompleting] = useState<boolean>(false);
  const complete_ride = async () => {
    setCompleting(true);
    try {
      await updateRideStatus("completed");
      showNotification("This ride has been completed", "success");
      setDriveStatus("completed");
    } catch (error) {
      console.log(error);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <View style={styles.navigationContainer}>
      <View style={styles.directionsRow}>
        <FontAwesome5 name="directions" color={"#fff"} size={30} />
        <Text style={styles.directionsText}>
          {`Aright, let's head to ${ongoingRideData.destination.address}`}
        </Text>
      </View>
      <View style={styles.arrivedBtnRow}>
        <TouchableWithoutFeedback onPress={complete_ride} disabled={completing}>
          <View style={[styles.arrivedBtn, { opacity: completing ? 0.5 : 1 }]}>
            <Text style={styles.arrivedBtnText}>Finish ride</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

const CompletedModal = () => {
  const {
    setToDestinationRouteCoords,
    setToPickupRouteCoords,
    setDriveStatus,
    setOngoingRideData,
    setIncomingRideData,
  } = useDriverContext();

  const start_searching = () => {
    setToDestinationRouteCoords([]);
    setToPickupRouteCoords([]);
    setDriveStatus("searching");
    setOngoingRideData(null);
    setIncomingRideData(null);
  };
  return (
    <View style={styles.navigationContainer}>
      <View style={styles.directionsRow}>
        <MaterialIcons name="celebration" color={"#fff"} size={24} />
        <Text style={styles.directionsText}>You have finished this ride</Text>
      </View>
      <View style={styles.arrivedBtnRow}>
        <TouchableWithoutFeedback onPress={start_searching}>
          <View style={styles.arrivedBtn}>
            <Text style={styles.arrivedBtnText}>Search for another ride</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

export default DriverRideModal;

const styles = StyleSheet.create({
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
    width: "100%",
  },
  directionsRow: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
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
    height: 35,
    width: 35,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fff",
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

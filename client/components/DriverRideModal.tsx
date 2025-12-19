import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { Image } from "expo-image";

import React, { useState, useEffect, Dispatch, SetStateAction } from "react";

import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";

import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { useDriverAuthContext } from "../context/DriverAuthContext";
import { useDriverContext } from "../context/DriverContext";
import { useNotificationContext } from "../context/NotificationContext";

import RideRoute from "./RideRoute";

import EarningsModal from "./screens/DriverEarnings";
import DriverAccountModal from "./screens/DriverAccountModal";
import { useMapContext } from "../context/MapContext";
import { ActivityIndicator } from "react-native";

const DriverRideModal = () => {
  const { driver } = useDriverAuthContext();
  const { setMapPadding } = useMapContext();
  const {
    setDriveStatus,
    driveStatus,
    incomingRideData,
    ongoingRideData,
    setLocationModalOpen,
    // delivery
    jobType,
    setJobType,
    incomingDeliveryData,
    ongoingDeliveryData: ongoingDelivery,
  } = useDriverContext();

  const [openEarnings, setOpenEarnings] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);

  useEffect(() => {
    // When active data is available, set local UI state accordingly
    if (ongoingRideData) {
      setJobType("ride");
      switch (ongoingRideData.status) {
        case "accepted":
          if (
            ongoingRideData.scheduled &&
            ongoingRideData.payment_status === "paid"
          ) {
            setDriveStatus("searching");
          } else {
            setDriveStatus("accepted");
          }
          break;
        case "arrived":
          setDriveStatus("arrived");
          break;
        case "ongoing":
          setDriveStatus("ongoing");
          break;
      }
    } else if (ongoingDelivery) {
      setJobType("delivery");
      switch (ongoingDelivery.status) {
        case "accepted":
          setDriveStatus("accepted");
          break;
        case "arrived":
          setDriveStatus("arrived");
          break;
        case "picked_up":
          setDriveStatus("picked_up");
          break;
        case "in_transit":
          setDriveStatus("ongoing");
          break;
      }
    } else {
      setJobType("");
    }
  }, [ongoingRideData, ongoingDelivery]);

  return (
    <View style={{ flex: 1, width: "100%", position: "absolute", bottom: 0 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          padding: 20,
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            setLocationModalOpen(true);
          }}
        >
          <View style={styles.locationButton}>
            <Ionicons name="location" size={24} color="#fff" />
          </View>
        </TouchableWithoutFeedback>
      </View>
      <View
        style={styles.main_modal_container}
        onLayout={(e) => {
          const h = Math.ceil(e.nativeEvent.layout.height || 0);
          setMapPadding((prev: any) => ({ ...prev, bottom: h - 20 }));
        }}
      >
        {driver?.is_available && (
          <View style={styles.availableContainer}>
            {/* RIDE MODALS */}
            {jobType !== "delivery" && (
              <>
                {driveStatus === "searching" && <SearchingModal />}
                {driveStatus === "incoming" && incomingRideData && (
                  <IncomingModal />
                )}
                {driveStatus === "accepted" && ongoingRideData && (
                  <AcceptedModal />
                )}
                {driveStatus === "arriving" && <ArrivingModal />}
                {driveStatus === "arrived" && <ArrivedModal />}
                {driveStatus === "ongoing" && <OngoingModal />}
                {driveStatus === "completed" && <CompletedModal />}
              </>
            )}

            {/* DELIVERY MODALS */}
            {jobType === "delivery" && (
              <>
                {driveStatus === "searching" && <SearchingModal />}
                {driveStatus === "incoming" && incomingDeliveryData && (
                  <DeliveryIncomingModal />
                )}
                {driveStatus === "accepted" && <DeliveryAcceptedModal />}
                {driveStatus === "arriving" && <DeliveryArrivingModal />}
                {driveStatus === "arrived" && <DeliveryArrivedModal />}
                {driveStatus === "picked_up" && <DeliveryPickedUpModal />}
                {driveStatus === "ongoing" && <DeliveryInTransitModal />}
                {driveStatus === "completed" && <DeliveryDeliveredModal />}
              </>
            )}
          </View>
        )}
        <>
          <EarningsModal
            visible={openEarnings}
            onClose={() => setOpenEarnings(false)}
          />
          <DriverAccountModal
            visible={openAccount}
            onClose={() => setOpenAccount(false)}
          />
        </>
        {/* Offline mode */}
        <OfflineMode
          setEarningsOpen={setOpenEarnings}
          setAccountOpen={setOpenAccount}
        />
      </View>
    </View>
  );
};

const OfflineMode = ({
  setEarningsOpen,
  setAccountOpen,
}: {
  setEarningsOpen: Dispatch<SetStateAction<boolean>>;
  setAccountOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const { driver } = useDriverAuthContext();
  const { setAvailability, ongoingDeliveryData, ongoingRideData } =
    useDriverContext();

  const [btnLoading, setBtnLoading] = useState<boolean>(false);

  const availability_func = async () => {
    setBtnLoading(true);
    try {
      await setAvailability();
    } catch (error) {
      console.log(error);
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <View style={styles.main_modal}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setAccountOpen(true)}
      >
        <Image
          source={
            driver?.profile_img
              ? { uri: driver?.profile_img } // remote image from backend
              : require("../assets/images/user.png") // fallback local asset
          }
          style={styles.profileImage}
        />
      </TouchableOpacity>
      {driver?.is_available ? (
        <TouchableOpacity
          activeOpacity={0.5}
          disabled={!!ongoingDeliveryData || !!ongoingRideData}
          onPress={availability_func}
          style={[styles.status, { backgroundColor: "#40863456" }]}
        >
          {btnLoading ? (
            <ActivityIndicator color={"#33b735"} />
          ) : (
            <Text style={[styles.status_text, { color: "#33b735" }]}>
              You're online
            </Text>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={availability_func}
          style={styles.status}
        >
          {btnLoading ? (
            <ActivityIndicator color={"#d12705"} />
          ) : (
            <Text style={styles.status_text}>You're offline</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setEarningsOpen(true)}
      >
        <Ionicons name="wallet" size={30} color="#d7d7d7" />
      </TouchableOpacity>
    </View>
  );
};

const SearchingModal = () => {
  return (
    <View>
      <Text style={styles.searchingText}>
        Searching for new ride/delivery offers...
      </Text>
    </View>
  );
};

// ============================================
// RIDE MODALS
// ============================================

const IncomingModal = () => {
  const {
    incomingRideData,
    driveStatus,
    setDriveStatus,
    setIncomingRideData,
    acceptRideRequest,
  } = useDriverContext();

  const [countDown, setCountDown] = useState<number>(30);
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
      setDriveStatus("searching");
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
        {incomingRideData?.scheduled_time && (
          <View
            style={{
              backgroundColor: "#ffb53630",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              marginBottom: 10,
              flexShrink: 1,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                color: "#ffb536",
                fontFamily: "raleway-semibold",
                fontSize: 11,
              }}
            >
              Scheduled ride!
            </Text>
          </View>
        )}
        <View style={styles.rideRequestHeader}>
          {/* User */}
          <View style={styles.userInfo}>
            <Image
              source={
                incomingRideData?.rider?.profile_pic
                  ? { uri: incomingRideData?.rider?.profile_pic } // remote image from backend
                  : require("../assets/images/user.png")
              }
              style={styles.userImage}
            />
            <View>
              <Text style={styles.userName}>
                {incomingRideData?.rider.name}
              </Text>
              <Text style={styles.userRides}>Passenger</Text>
            </View>
          </View>

          {/* Timeout or call */}
          <Text style={styles.timeoutText}>{countDown}s</Text>
        </View>

        {/* Estimated time and duration */}
        <View style={styles.timeRow}>
          <MaterialIcons name="access-time" color={"#d7d7d7"} size={16} />
          <Text style={styles.timeText}>
            {incomingRideData?.duration_mins} mins (
            {incomingRideData?.distance_km} km)
          </Text>
        </View>

        {/* Scheduled time (if any) */}
        {incomingRideData?.scheduled_time && (
          <View style={styles.scheduledRow}>
            <MaterialIcons name="event" color={"#ffb536"} size={16} />
            <Text style={styles.scheduledText}>
              {(() => {
                try {
                  const d = new Date(incomingRideData.scheduled_time as any);
                  return d.toLocaleString(undefined, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                } catch (e) {
                  return String(incomingRideData.scheduled_time);
                }
              })()}
            </Text>
          </View>
        )}

        {/* Ride route card */}
        {incomingRideData && (
          <RideRoute
            from={incomingRideData?.pickup.address}
            to={incomingRideData?.destination.address}
          />
        )}

        {/* Price */}
        <Text style={styles.priceText}>
          NGN {incomingRideData?.fare.toLocaleString()}
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
  const { ongoingRideData, setDriveStatus, setIncomingRideData } =
    useDriverContext();
  const { showNotification } = useNotificationContext();

  const paid = ongoingRideData?.payment_status === "paid";

  return (
    <>
      <Text style={styles.rideStatusText}>
        {ongoingRideData?.scheduled_time ? "Scheduled ride" : "Ongoing ride"}
      </Text>

      {/* Ride request card */}
      <View style={styles.rideRequestCard}>
        {/* Header */}
        <View style={styles.rideRequestHeader}>
          {/* User */}
          <View style={styles.userInfo}>
            <Image
              source={
                ongoingRideData?.rider?.profile_pic
                  ? { uri: ongoingRideData?.rider?.profile_pic } // remote image from backend
                  : require("../assets/images/user.png")
              }
              style={styles.userImage}
            />
            <View>
              <Text style={styles.userName}>{ongoingRideData?.rider.name}</Text>
              <Text style={styles.userRides}>Passenger</Text>
            </View>
          </View>

          {/* Call btn */}
          <TouchableWithoutFeedback
            onPress={() =>
              Linking.openURL(`tel:${ongoingRideData?.rider.phone}`)
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
            {ongoingRideData?.duration_mins} mins (
            {ongoingRideData?.distance_km} km)
          </Text>
        </View>

        {/* Ride route card */}
        {ongoingRideData && (
          <RideRoute
            from={ongoingRideData.pickup.address}
            to={ongoingRideData.destination.address}
          />
        )}

        {/* Price */}
        <Text style={styles.priceText}>
          {ongoingRideData?.fare.toLocaleString()} NGN
        </Text>

        {/* Action btns */}
        <View style={styles.navigateBtnRow}>
          {ongoingRideData?.scheduled ? (
            <TouchableOpacity
              style={[styles.navigateBtn, { opacity: !paid ? 0.7 : 1 }]}
              onPress={() => {
                showNotification("Ride schedule confirmed", "success");
                setDriveStatus("searching");
                setIncomingRideData(null);
              }}
              disabled={!paid}
            >
              <Text style={styles.navigateBtnText}>{"Confirm schedule"}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.navigateBtn}
              onPress={() => setDriveStatus("arriving")}
            >
              <Text style={styles.navigateBtnText}>Navigate to pickup</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={{ padding: 10, marginTop: 10 }}
            onPress={() => {
              setDriveStatus("searching");
              setIncomingRideData(null);
            }}
          >
            <Text
              style={{
                color: "#ff0000",
                fontFamily: "raleway-bold",
                textAlign: "center",
              }}
            >
              Cancel ride
            </Text>
          </TouchableOpacity>
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
          {`Alright quickly head to ${ongoingRideData?.pickup.address}, it should take about ${ongoingRideData?.duration_mins} mins`}
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
          {`Aright, let's head to ${ongoingRideData?.destination.address}`}
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

// ============================================
// DELIVERY MODALS
// ============================================

const DeliveryIncomingModal = () => {
  const {
    incomingDeliveryData,
    setIncomingDeliveryData,
    setDriveStatus,
    acceptDeliveryRequest,
  } = useDriverContext();

  const [countDown, setCountDown] = useState<number>(30);
  const [accepting, setAccepting] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountDown((prev) => {
        if (prev === 1) {
          setDriveStatus("searching");
          setIncomingDeliveryData(null);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const acceptDelivery = async () => {
    setAccepting(true);
    try {
      await acceptDeliveryRequest();
      setDriveStatus("accepted");
    } catch (error) {
      setDriveStatus("searching");
    } finally {
      setAccepting(false);
    }
  };

  const rejectDelivery = () => {
    setDriveStatus("searching");
    setIncomingDeliveryData(null);
  };

  // Get package icon
  const getPackageIcon = (type?: string) => {
    switch (type) {
      case "document":
        return "📄";
      case "electronics":
        return "📱";
      case "food":
        return "🍔";
      case "clothing":
        return "👕";
      case "furniture":
        return "🪑";
      default:
        return "📦";
    }
  };

  if (!incomingDeliveryData) return null;

  return (
    <>
      <Text style={styles.rideStatusText}>Incoming delivery request</Text>

      <View style={styles.rideRequestCard}>
        {/* Header with sender info */}
        <View style={styles.rideRequestHeader}>
          <View style={styles.userInfo}>
            <Image
              source={require("../assets/images/user.png")}
              style={styles.userImage}
            />
            <View>
              <Text style={styles.userName}>
                {typeof incomingDeliveryData.sender === "object"
                  ? incomingDeliveryData.sender?.name
                  : "Sender"}
              </Text>
              <Text style={styles.userRides}>Sender</Text>
            </View>
          </View>

          <Text style={styles.timeoutText}>{countDown}s</Text>
        </View>

        {/* Estimated time and distance */}
        <View style={styles.timeRow}>
          <MaterialIcons name="access-time" color={"#d7d7d7"} size={16} />
          <Text style={styles.timeText}>
            {incomingDeliveryData.duration_mins} mins (
            {incomingDeliveryData.distance_km} km)
          </Text>
        </View>

        {/* Package info */}
        <View
          style={{
            backgroundColor: "#2a2a2a",
            padding: 12,
            borderRadius: 8,
            marginVertical: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 24 }}>
              {getPackageIcon(incomingDeliveryData.package?.type)}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>
                {incomingDeliveryData.package?.description || "Package"}
              </Text>
              <Text style={styles.userRides}>
                {incomingDeliveryData.package?.type || "other"} •{" "}
                {incomingDeliveryData.package?.fragile ? "Fragile" : "Standard"}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery route */}

        {/* Use RideRoute component (same as rides) */}
        {incomingDeliveryData && (
          <RideRoute
            from={incomingDeliveryData?.pickup?.address || ""}
            to={incomingDeliveryData?.dropoff?.address || ""}
          />
        )}

        {/* Price */}
        <Text style={styles.priceText}>
          NGN {incomingDeliveryData.fare.toLocaleString()}
        </Text>

        {/* Action buttons */}
        <View style={styles.actionBtnsRow}>
          <TouchableWithoutFeedback
            onPress={acceptDelivery}
            disabled={accepting}
          >
            <View style={[styles.acceptBtn, { opacity: accepting ? 0.5 : 1 }]}>
              <Text style={styles.acceptBtnText}>
                {accepting ? "Accepting..." : "Accept"}
              </Text>
            </View>
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback onPress={rejectDelivery}>
            <View style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Decline</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </>
  );
};

const DeliveryAcceptedModal = () => {
  const { ongoingDeliveryData, setDriveStatus } = useDriverContext();

  const getPackageIcon = (type?: string) => {
    switch (type) {
      case "document":
        return "📄";
      case "electronics":
        return "📱";
      case "food":
        return "🍔";
      case "clothing":
        return "👕";
      case "furniture":
        return "🪑";
      default:
        return "📦";
    }
  };

  const navigateToPickup = () => {
    setDriveStatus("arriving");
  };

  return (
    <>
      <Text style={styles.rideStatusText}>Ongoing delivery</Text>

      <View style={styles.rideRequestCard}>
        {/* Header with sender info */}
        <View style={styles.rideRequestHeader}>
          <View style={styles.userInfo}>
            <Image
              source={require("../assets/images/user.png")}
              style={styles.userImage}
            />
            <View>
              <Text style={styles.userName}>
                {typeof ongoingDeliveryData?.sender === "object"
                  ? ongoingDeliveryData?.sender?.name
                  : "Sender"}
              </Text>
              <Text style={styles.userRides}>Sender</Text>
            </View>
          </View>

          <TouchableWithoutFeedback
            onPress={() =>
              typeof ongoingDeliveryData?.sender === "object" &&
              Linking.openURL(`tel:${ongoingDeliveryData?.sender?.phone}`)
            }
          >
            <View style={styles.callBtn}>
              <Ionicons name="call" size={20} color="#121212" />
            </View>
          </TouchableWithoutFeedback>
        </View>

        {/* Estimated time and distance */}
        <View style={styles.timeRow}>
          <MaterialIcons name="access-time" color={"#d7d7d7"} size={16} />
          <Text style={styles.timeText}>
            {ongoingDeliveryData?.duration_mins} mins (
            {ongoingDeliveryData?.distance_km} km)
          </Text>
        </View>

        {/* Package info */}
        <View
          style={{
            backgroundColor: "#2a2a2a",
            padding: 12,
            borderRadius: 8,
            marginVertical: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 24 }}>
              {getPackageIcon(ongoingDeliveryData?.package?.type)}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>
                {ongoingDeliveryData?.package?.description || "Package"}
              </Text>
              <Text style={styles.userRides}>
                {ongoingDeliveryData?.package?.type || "other"} •{" "}
                {ongoingDeliveryData?.package?.fragile ? "Fragile" : "Standard"}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery route */}
        {ongoingDeliveryData && (
          <RideRoute
            from={ongoingDeliveryData?.pickup?.address || ""}
            to={ongoingDeliveryData?.dropoff?.address || ""}
          />
        )}

        {/* Price */}
        <Text style={styles.priceText}>
          {ongoingDeliveryData?.fare.toLocaleString()} NGN
        </Text>

        {/* Navigate to pickup button */}
        <View style={styles.navigateBtnRow}>
          <TouchableWithoutFeedback onPress={navigateToPickup}>
            <View style={styles.navigateBtn}>
              <Text style={styles.navigateBtnText}>Navigate to Pickup</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </>
  );
};

const DeliveryArrivingModal = () => {
  const {
    ongoingDeliveryData,
    updateDeliveryStatus,
    setDriveStatus,
    setToPickupRouteCoords,
  } = useDriverContext();
  const [arriving, setArriving] = useState<boolean>(false);

  const markAsArrived = async () => {
    setArriving(true);
    try {
      await updateDeliveryStatus("arrived");
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
          Head to the pickup location at {ongoingDeliveryData?.pickup.address}
        </Text>
      </View>

      <View style={styles.arrivedBtnRow}>
        <TouchableWithoutFeedback onPress={markAsArrived} disabled={arriving}>
          <View style={[styles.arrivedBtn, { opacity: arriving ? 0.5 : 1 }]}>
            <Text style={styles.arrivedBtnText}>
              {arriving ? "Confirming..." : "I've Arrived at Pickup"}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

const DeliveryArrivedModal = () => {
  const { ongoingDeliveryData, updateDeliveryStatus, setDriveStatus } =
    useDriverContext();
  const [pickingUp, setPickingUp] = useState<boolean>(false);
  const [isPackageExpanded, setIsPackageExpanded] = useState<boolean>(false);

  const confirmPickup = async () => {
    setPickingUp(true);
    try {
      await updateDeliveryStatus("picked_up");
      setDriveStatus("picked_up");
    } catch (error) {
      console.log(error);
    } finally {
      setPickingUp(false);
    }
  };

  // Get package icon
  const getPackageIcon = (type?: string) => {
    switch (type) {
      case "document":
        return "📄";
      case "electronics":
        return "📱";
      case "food":
        return "🍔";
      case "clothing":
        return "👕";
      case "furniture":
        return "🪑";
      default:
        return "📦";
    }
  };

  // Get vehicle icon based on vehicle type
  const getVehicleIcon = (vehicle: string) => {
    switch (vehicle) {
      case "bike":
      case "motorcycle":
        return require("../assets/images/icons/motorcycle-icon.png");
      case "cab":
      case "car":
        return require("../assets/images/icons/sedan-icon.png");
      case "van":
        return require("../assets/images/icons/van-icon.png");
      case "truck":
        return require("../assets/images/icons/truck-icon.png");
      default:
        return require("../assets/images/icons/motorcycle-icon.png");
    }
  };

  return (
    <View style={styles.navigationContainer}>
      <View style={styles.directionsRow}>
        <Text style={styles.directionsText}>
          You've arrived at the pickup location
        </Text>
      </View>

      {/* Package details card (expandable) */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsPackageExpanded(!isPackageExpanded)}
        style={{
          padding: 14,
          borderRadius: 12,
          backgroundColor: "#1e1e1e",
          borderWidth: 0.5,
          borderColor: "#2a2a2a",
          marginTop: 20,
        }}
      >
        {/* ID at the top */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <View
            style={{
              backgroundColor: "#2a2a2a",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: "poppins-regular",
                fontSize: 10,
              }}
            >
              ID: #{(ongoingDeliveryData?._id || "").slice(-9).toUpperCase()}
            </Text>
          </View>
          <Text
            style={{
              color: "#fff",
              fontFamily: "poppins-bold",
              fontSize: 14,
            }}
          >
            NGN {ongoingDeliveryData?.fare.toLocaleString()}
          </Text>
        </View>

        {/* Main content */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              backgroundColor: "#2a2a2a",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 24 }}>
              {getPackageIcon(ongoingDeliveryData?.package?.type)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontFamily: "raleway-semibold" }}>
              {ongoingDeliveryData?.package?.type
                ? ongoingDeliveryData.package.type.charAt(0).toUpperCase() +
                  ongoingDeliveryData.package.type.slice(1)
                : "Other"}{" "}
              Package
            </Text>
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {ongoingDeliveryData?.package?.description || "Package"}
              {ongoingDeliveryData?.package?.fragile ? " • Fragile" : ""}
            </Text>
          </View>
          <Feather
            name={isPackageExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#cfcfcf"
          />
        </View>

        {/* Expanded content - package details */}
        {isPackageExpanded && (
          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 0.5,
              borderTopColor: "#2a2a2a",
            }}
          >
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 11,
              }}
            >
              Recipient: {ongoingDeliveryData?.to?.name || "Unknown"}
            </Text>
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 11,
                marginTop: 2,
              }}
            >
              Phone: {ongoingDeliveryData?.to?.phone || "N/A"}
            </Text>
            {ongoingDeliveryData?.package?.fragile && (
              <View
                style={{
                  marginTop: 10,
                  backgroundColor: "#ff980020",
                  padding: 8,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    color: "#ff9800",
                    fontFamily: "raleway-bold",
                    textAlign: "center",
                    fontSize: 12,
                  }}
                >
                  ⚠️ Handle with care - Fragile item
                </Text>
              </View>
            )}
            <View style={{ marginTop: 10 }}>
              <Text
                style={{
                  color: "#cfcfcf",
                  fontFamily: "poppins-regular",
                  fontSize: 11,
                }}
              >
                Delivery to: {ongoingDeliveryData?.dropoff.address}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.arrivedBtnRow}>
        <TouchableWithoutFeedback onPress={confirmPickup} disabled={pickingUp}>
          <View style={[styles.arrivedBtn, { opacity: pickingUp ? 0.5 : 1 }]}>
            <Text style={styles.arrivedBtnText}>
              {pickingUp ? "Confirming..." : "Confirm Package Pickup"}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

const DeliveryPickedUpModal = () => {
  const { ongoingDeliveryData, updateDeliveryStatus, setDriveStatus } =
    useDriverContext();
  const [startingTransit, setStartingTransit] = useState<boolean>(false);

  const startTransit = async () => {
    setStartingTransit(true);
    try {
      await updateDeliveryStatus("in_transit");
      setDriveStatus("ongoing");
    } catch (error) {
      console.log(error);
    } finally {
      setStartingTransit(false);
    }
  };

  return (
    <View style={styles.navigationContainer}>
      <View style={styles.directionsRow}>
        <FontAwesome5 name="box" color={"#fff"} size={26} />
        <Text style={styles.directionsText}>
          Package picked up. You can start transit to the dropoff location.
        </Text>
      </View>

      {/* Summary */}
      <View
        style={{
          padding: 12,
          borderRadius: 12,
          backgroundColor: "#1e1e1e",
          borderWidth: 0.5,
          borderColor: "#2a2a2a",
          marginTop: 12,
        }}
      >
        <Text
          style={{
            color: "#cfcfcf",
            fontFamily: "poppins-regular",
            fontSize: 11,
          }}
        >
          Dropoff: {ongoingDeliveryData?.dropoff.address}
        </Text>
        {ongoingDeliveryData?.to?.name ? (
          <Text
            style={{
              color: "#cfcfcf",
              fontFamily: "poppins-regular",
              fontSize: 11,
              marginTop: 4,
            }}
          >
            Recipient: {ongoingDeliveryData?.to?.name} (
            {ongoingDeliveryData?.to?.phone})
          </Text>
        ) : null}
      </View>

      <View style={styles.arrivedBtnRow}>
        <TouchableWithoutFeedback
          onPress={startTransit}
          disabled={startingTransit}
        >
          <View
            style={[styles.arrivedBtn, { opacity: startingTransit ? 0.5 : 1 }]}
          >
            <Text style={styles.arrivedBtnText}>
              {startingTransit ? "Starting..." : "Start transit"}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

const DeliveryInTransitModal = () => {
  const {
    ongoingDeliveryData,
    updateDeliveryStatus,
    setDriveStatus,
    toDestinationRouteCoords,
    mapRef,
  } = useDriverContext();
  const [isDeliveryExpanded, setIsDeliveryExpanded] = useState<boolean>(false);
  const [delivering, setDelivering] = useState<boolean>(false);
  const [isCardVisible, setIsCardVisible] = useState<boolean>(true);

  // Fit map to route coordinates when card visibility changes
  useEffect(() => {
    if (
      toDestinationRouteCoords &&
      toDestinationRouteCoords.length > 1 &&
      mapRef.current
    ) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(toDestinationRouteCoords, {
          edgePadding: { top: 50, left: 50, right: 50, bottom: 50 },
          animated: true,
        });
      }, 100);
    }
  }, [isCardVisible]);

  // Get package icon
  const getPackageIcon = (type?: string) => {
    switch (type) {
      case "document":
        return "📄";
      case "electronics":
        return "📱";
      case "food":
        return "🍔";
      case "clothing":
        return "👕";
      case "furniture":
        return "🪑";
      default:
        return "📦";
    }
  };

  const callRecipient = async () => {
    try {
      const url = `tel:${ongoingDeliveryData?.to?.phone}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (e) {
      console.log("Failed to initiate call");
    }
  };

  const confirmDelivered = async () => {
    setDelivering(true);
    try {
      await updateDeliveryStatus("delivered");
      setDriveStatus("completed");
    } catch (error) {
      console.log(error);
    } finally {
      setDelivering(false);
    }
  };

  return (
    <View style={styles.navigationContainer}>
      <View style={styles.directionsRow}>
        {/* <FontAwesome5 name="directions" color={"#fff"} size={30} /> */}

        <TouchableOpacity
          onPress={() => setIsCardVisible(!isCardVisible)}
          style={{}}
        >
          <Feather
            name={isCardVisible ? "chevron-down" : "chevron-up"}
            size={30}
            color="#fff"
          />
        </TouchableOpacity>
        <Text style={styles.directionsText}>
          Package picked up! Head to the dropoff location
        </Text>
      </View>

      {/* Delivery details card (collapsible) */}
      {isCardVisible && (
        <View
          style={{
            padding: 14,
            borderRadius: 12,
            backgroundColor: "#1e1e1e",
            borderWidth: 0.5,
            borderColor: "#2a2a2a",
            marginVertical: 15,
          }}
        >
          {/* Main content - Collapsed state */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#2a2a2a",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="location-on" color={"#f44336"} size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#cfcfcf",
                  fontFamily: "poppins-regular",
                  fontSize: 10,
                }}
              >
                Delivering to
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "raleway-semibold",
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {ongoingDeliveryData?.to?.name}
              </Text>
              <Text
                style={{
                  color: "#a8a8a8",
                  fontFamily: "poppins-regular",
                  fontSize: 11,
                  marginTop: 4,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {ongoingDeliveryData?.dropoff.address}
              </Text>
            </View>
            <TouchableOpacity
              onPress={callRecipient}
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="call" size={18} color="#121212" />
            </TouchableOpacity>
          </View>

          {/* Expanded content - Full delivery details */}
          {isDeliveryExpanded && (
            <View
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 0.5,
                borderTopColor: "#2a2a2a",
              }}
            >
              {/* Recipient contact */}
              <View
                style={{
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottomWidth: 0.5,
                  borderBottomColor: "#2a2a2a",
                }}
              >
                <Text
                  style={{
                    color: "#cfcfcf",
                    fontFamily: "poppins-regular",
                    fontSize: 10,
                  }}
                >
                  Recipient Contact
                </Text>
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "raleway-semibold",
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {ongoingDeliveryData?.to?.phone}
                </Text>
              </View>

              {/* Package details */}
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    color: "#cfcfcf",
                    fontFamily: "poppins-regular",
                    fontSize: 10,
                    marginBottom: 8,
                  }}
                >
                  Package Details
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    backgroundColor: "#2a2a2a",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>
                    {getPackageIcon(ongoingDeliveryData?.package?.type)}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: "raleway-semibold",
                        fontSize: 12,
                      }}
                    >
                      {ongoingDeliveryData?.package?.type
                        ? ongoingDeliveryData.package.type
                            .charAt(0)
                            .toUpperCase() +
                          ongoingDeliveryData.package.type.slice(1)
                        : "Other"}
                    </Text>
                    <Text
                      style={{
                        color: "#cfcfcf",
                        fontFamily: "poppins-regular",
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      {ongoingDeliveryData?.package?.description || "Package"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Fragile warning */}
              {ongoingDeliveryData?.package?.fragile && (
                <View
                  style={{
                    backgroundColor: "#ff980020",
                    padding: 10,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "#ff9800",
                      fontFamily: "raleway-bold",
                      textAlign: "center",
                      fontSize: 12,
                    }}
                  >
                    ⚠️ Fragile - Handle with care
                  </Text>
                </View>
              )}

              {/* Delivery ID and Fare */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 12,
                  borderTopWidth: 0.5,
                  borderTopColor: "#2a2a2a",
                }}
              >
                <View
                  style={{
                    backgroundColor: "#2a2a2a",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "poppins-regular",
                      fontSize: 10,
                    }}
                  >
                    ID: #
                    {(ongoingDeliveryData?._id || "").slice(-9).toUpperCase()}
                  </Text>
                </View>
                <Text
                  style={{
                    color: "#10b804ff",
                    fontFamily: "poppins-bold",
                    fontSize: 16,
                  }}
                >
                  NGN {ongoingDeliveryData?.fare.toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* See more/less button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsDeliveryExpanded(!isDeliveryExpanded)}
            style={{
              marginTop: 5,
              paddingTop: 5,
              borderTopWidth: 0.5,
              borderTopColor: "#2a2a2a",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "raleway-semibold",
                fontSize: 12,
              }}
            >
              {isDeliveryExpanded ? "See less" : "See more"}
            </Text>
            <Feather
              name={isDeliveryExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color="#cfcfcf"
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Confirm delivery button */}
      <View style={styles.arrivedBtnRow}>
        <TouchableWithoutFeedback
          onPress={confirmDelivered}
          disabled={delivering}
        >
          <View style={[styles.arrivedBtn, { opacity: delivering ? 0.5 : 1 }]}>
            <Text style={styles.arrivedBtnText}>
              {delivering ? "Confirming..." : "I have delivered the package"}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

const DeliveryDeliveredModal = () => {
  const {
    setToDestinationRouteCoords,
    setToPickupRouteCoords,
    setDriveStatus,
    setOngoingDeliveryData,
    setIncomingDeliveryData,
    setJobType,
  } = useDriverContext() as any;

  const { region, mapRef } = useMapContext();

  const start_searching = () => {
    setToDestinationRouteCoords([]);
    setToPickupRouteCoords([]);
    setDriveStatus("searching");
    setOngoingDeliveryData(null);
    setIncomingDeliveryData(null);
    setJobType("");
    // Recentering is handled by a stable effect in Home when driveStatus === 'searching'
  };

  return (
    <View style={styles.navigationContainer}>
      <View style={styles.directionsRow}>
        <MaterialIcons name="celebration" color={"#fff"} size={24} />
        <Text style={styles.directionsText}>
          You have completed this delivery
        </Text>
      </View>
      <View style={styles.arrivedBtnRow}>
        <TouchableWithoutFeedback onPress={start_searching}>
          <View style={styles.arrivedBtn}>
            <Text style={styles.arrivedBtnText}>
              Search for another delivery
            </Text>
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
    borderRadius: 15,
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
  scheduledRow: {
    marginTop: 6,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scheduledText: {
    color: "#ffb536",
    fontFamily: "poppins-regular",
    fontSize: 13,
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
    borderRadius: 50,
    width: 160,
  },
  status_text: {
    fontFamily: "raleway-bold",
    fontSize: 12,
    color: "#d12705",
    textAlign: "center",
  },
  locationButton: {
    backgroundColor: "#121212",
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    padding: 20,
    width: "100%",
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  totalEarnings: {
    color: "#fff",
    fontFamily: "poppins-bold",
    fontSize: 24,
    marginTop: 10,
  },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
  },
  filterTab: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#3b3b3b",
  },
  activeFilterTab: {
    backgroundColor: "#fff",
  },
  filterText: {
    color: "#fff",
    fontFamily: "raleway-regular",
  },
  activeFilterText: {
    color: "#121212",
    fontFamily: "raleway-bold",
  },
  breakdownContainer: {
    marginVertical: 15,
  },
  breakdownText: {
    color: "#fff",
    fontFamily: "raleway-regular",
    marginBottom: 5,
  },
  sectionTitle: {
    color: "#fff",
    fontFamily: "raleway-bold",
    marginTop: 20,
  },
  tripItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#3b3b3b",
  },
  tripText: {
    color: "#fff",
    fontFamily: "raleway-regular",
  },
});

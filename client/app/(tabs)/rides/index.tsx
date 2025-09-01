import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableWithoutFeedback,
  Linking,
  ScrollView,
  Pressable,
} from "react-native";
import React, { useState } from "react";

import { router } from "expo-router";

import RideRoute from "../../../components/RideRoute";
import DriverCard from "../../../components/DriverCard";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import { useRideContext } from "../../../context/RideContext";
import { useNotificationContext } from "../../../context/NotificationContext";
import { useWalletContext } from "../../../context/WalletContext";
import { useMapContext } from "../../../context/MapContext";

import Notification from "../../../components/Notification";
import { useLoading } from "../../../context/LoadingContext";
import AppLoading from "../../../loadings/AppLoading";
import RideLoading from "../../../loadings/RideLoading";
import { FontAwesome6 } from "@expo/vector-icons";

const vehicleIcons: Record<string, any> = {
  cab: require("../../../assets/images/icons/sedan-icon.png"),
  keke: require("../../../assets/images/icons/keke-icon.png"),
  suv: require("../../../assets/images/icons/suv-icon.png"),
};

const Rides = () => {
  const { notification, showNotification } = useNotificationContext();
  const { appLoading, loadingState } = useLoading();

  const [category, setCategory] = useState<
    "ongoing" | "completed" | "cancelled"
  >("ongoing");

  const { ongoingRideData, userCompletedRides, userCancelledRides } =
    useRideContext();

  return (
    <>
      {appLoading ? (
        <AppLoading />
      ) : (
        <>
          <Notification notification={notification} />
          <View style={styles.container}>
            <Text style={styles.header_text}>Rides</Text>

            {/* Categories nav... */}
            <CategoryTabs category={category} setCategory={setCategory} />

            {/* Ongoing data */}
            {category === "ongoing" &&
              (ongoingRideData ? (
                <OngoingRide data={ongoingRideData} />
              ) : (
                <EmptyState message="You don't have any ongoing rides currently" />
              ))}

            {/* Completed data */}
            {category === "completed" &&
              (loadingState.completedRides ? (
                <RideLoading />
              ) : userCompletedRides.length === 0 ? (
                <EmptyState message="You haven't completed any rides yet" />
              ) : (
                <CompletedRides data={userCompletedRides} />
              ))}

            {/* Cancelled data */}
            {category === "cancelled" &&
              (loadingState.cancelledRides ? (
                <RideLoading />
              ) : userCancelledRides.length === 0 ? (
                <EmptyState message="You haven't cancelled any rides yet" />
              ) : (
                <CancelledRides data={userCancelledRides} />
              ))}
          </View>
        </>
      )}
    </>
  );
};

const CategoryTabs = ({
  category,
  setCategory,
}: {
  category: "ongoing" | "completed" | "cancelled";
  setCategory: (cat: "ongoing" | "completed" | "cancelled") => void;
}) => {
  const tabs: Array<"ongoing" | "completed" | "cancelled"> = [
    "ongoing",
    "completed",
    "cancelled",
  ];

  return (
    <View style={styles.nav_container}>
      {tabs.map((tab) => (
        <TouchableWithoutFeedback key={tab} onPress={() => setCategory(tab)}>
          <View
            style={[styles.nav_box, category === tab && styles.nav_box_active]}
          >
            <Text
              style={[
                styles.nav_text,
                category === tab && styles.nav_text_active,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      ))}
    </View>
  );
};

const EmptyState = ({ message }: { message: string }) => {
  const { setRideStatus, setModalUp, setPickupTime } = useRideContext();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{ justifyContent: "center", alignItems: "center", width: "90%" }}
      >
        <Image
          source={require("../../../assets/images/icons/no-results-white.png")}
          style={{ width: 100, height: 100, marginBottom: 20 }}
        />
        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontFamily: "raleway-bold",
            textAlign: "center",
          }}
        >
          {message}
        </Text>
      </View>
      <View
        style={{
          position: "absolute",
          bottom: 10,
          alignItems: "center",
          flex: 1,
        }}
      >
        <Pressable
          style={{
            backgroundColor: "#fff",
            width: 320,
            padding: 10,
            borderRadius: 20,
            marginTop: 10,
          }}
          onPress={() => {
            router.push("../home");
            setRideStatus("booking");
            setModalUp(true);
            setPickupTime("later");
          }}
        >
          <Text style={{ fontFamily: "raleway-bold", textAlign: "center" }}>
            Schedule ride
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const OngoingRide = ({ data }: { data: any }) => {
  const { showNotification } = useNotificationContext();

  const {
    payForRide,
    cancelRideRequest,
    cancelling,
    ongoingRideData,
    retrying,
    retryRideRequest,
  } = useRideContext();
  const { region, mapRef } = useMapContext();

  const makeCall = async (phone: string) => {
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      showNotification("Could not place call", "error");
    }
  };

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

  const retry_ride = async () => {
    try {
      await retryRideRequest();
      router.push("../home");
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  const cancel_ride = async () => {
    const reason = "No reason";
    const by = "rider";
    const ride_id = ongoingRideData?._id;

    try {
      await cancelRideRequest(ride_id, by, reason);
      if (region) mapRef.current.animateToRegion(region, 1000);
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  return (
    <View style={styles.ride_card}>
      <View style={styles.ride_header}>
        <Text style={styles.ride_header_text}>
          {new Date(data.createdAt).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Text>
        {data.status === "expired" && (
          <View
            style={{
              backgroundColor: "#ff00003a",
              paddingVertical: 5,
              paddingHorizontal: 10,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                color: "#ff0000",
                fontFamily: "raleway-bold",
                fontSize: 10,
              }}
            >
              Expired
            </Text>
          </View>
        )}
      </View>
      {/* Driver details */}
      {data.driver && (
        <>
          <DriverCard name={data.driver.user.name} />

          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Image
              source={vehicleIcons[data.driver.vehicle_type]}
              style={{ height: 50, width: 50 }}
            />
            <View>
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "raleway-bold",
                  fontSize: 12,
                  textTransform: "capitalize",
                  width: "100%",
                }}
              >
                {data.driver.vehicle_type} ride
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  gap: 5,
                }}
              >
                <FontAwesome5
                  name="car"
                  size={14}
                  color="#c6c6c6"
                  style={{ marginTop: 3 }}
                />
                <Text
                  style={{
                    color: "#c6c6c6",
                    fontFamily: "raleway-semibold",
                    fontSize: 12,
                  }}
                >
                  {data.driver.vehicle.color} {data.driver.vehicle.brand}{" "}
                  {data.driver.vehicle.model}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
      {/* Ride route */}

      <View style={{ marginTop: 10 }}>
        <RideRoute from={data.pickup.address} to={data.destination.address} />
      </View>

      {/* Pay */}
      {data.driver ? (
        data.payment_status === "paid" ? (
          <>
            <TouchableWithoutFeedback
              onPress={() => makeCall(data.driver.user.phone)}
            >
              <View
                style={[
                  styles.pay_btn,
                  {
                    backgroundColor: "transparent",
                    borderColor: "white",
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[styles.pay_btn_text, { color: "#fff" }]}>
                  Call Driver &nbsp;&nbsp;
                  <FontAwesome5 name="phone-alt" color="#fff" size={14} />
                </Text>
              </View>
            </TouchableWithoutFeedback>
            <View style={styles.pay_btn}>
              <Text style={styles.pay_btn_text}>Track</Text>
            </View>
            <TouchableWithoutFeedback
              onPress={cancel_ride}
              disabled={cancelling}
            >
              <Text
                style={{
                  color: cancelling ? "#ff000080" : "#ff0000",
                  fontFamily: "raleway-bold",
                  textAlign: "center",
                  marginTop: 15,
                }}
              >
                {cancelling ? "Cancelling..." : "Cancel ride"}
              </Text>
            </TouchableWithoutFeedback>
          </>
        ) : (
          <>
            <TouchableWithoutFeedback onPress={pay_func} disabled={paying}>
              <View style={styles.pay_btn}>
                <Text style={styles.pay_btn_text}>
                  {paying
                    ? "Paying..."
                    : `Pay ${data.fare.toLocaleString()} NGN`}
                </Text>
              </View>
            </TouchableWithoutFeedback>
            <TouchableWithoutFeedback
              onPress={cancel_ride}
              disabled={cancelling}
            >
              <View
                style={[
                  styles.pay_btn,
                  {
                    backgroundColor: "transparent",
                    borderColor: "white",
                    borderWidth: 1,
                    opacity: paying ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={[styles.pay_btn_text, { color: "#fff" }]}>
                  {cancelling ? "Cancelling..." : "Cancel ride"}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </>
        )
      ) : data.status === "expired" ? (
        <TouchableWithoutFeedback onPress={retry_ride}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {retrying ? (
              <Text style={{ color: "#9e9d9d", fontFamily: "raleway-bold" }}>
                Retrying...
              </Text>
            ) : (
              <>
                <Text style={{ color: "#d2d2d2", fontFamily: "raleway-bold" }}>
                  Retry&nbsp;
                </Text>
                <FontAwesome6
                  name="rotate-right"
                  color="#fff"
                  size={10}
                  style={{ marginTop: 4 }}
                />
              </>
            )}
          </View>
        </TouchableWithoutFeedback>
      ) : (
        <>
          <Text
            style={{
              color: "#fff",
              fontFamily: "raleway-regular",
              textAlign: "center",
            }}
          >
            Still searching for driver...
          </Text>
          <TouchableWithoutFeedback onPress={cancel_ride} disabled={cancelling}>
            <Text
              style={{
                color: cancelling ? "#ff000080" : "#ff0000",
                fontFamily: "raleway-bold",
                textAlign: "center",
                marginTop: 15,
              }}
            >
              {cancelling ? "Cancelling..." : "Cancel ride"}
            </Text>
          </TouchableWithoutFeedback>
        </>
      )}
    </View>
  );
};

const CompletedRides = ({ data }: { data: any }) => (
  <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
    {data.map((ride: any, i: number) => {
      return (
        <View key={i}>
          <View style={styles.ride_card}>
            <View
              style={{
                backgroundColor: "#4cd90635",
                marginBottom: 15,
                alignSelf: "flex-start",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 15,
              }}
            >
              <Text
                style={{
                  color: "#4cd906ff",
                  fontFamily: "raleway-bold",
                  fontSize: 10,
                }}
              >
                Completed
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-start",
                gap: 12,
              }}
            >
              <Image
                source={vehicleIcons[ride.driver.vehicle_type]}
                style={{ width: 30, height: 30 }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  flex: 1,
                  paddingBottom: 10,
                }}
              >
                <View>
                  <Text
                    style={{
                      fontFamily: "raleway-bold",
                      color: "#fff",
                    }}
                  >
                    {ride.destination.address}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "raleway-semibold",
                      color: "grey",
                      fontSize: 11,
                    }}
                  >
                    {new Date(ride.createdAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
                <View>
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "poppins-bold",
                      fontSize: 12,
                    }}
                  >
                    {ride.fare.toLocaleString() ?? ""} NGN
                  </Text>
                  <Text
                    style={{
                      fontFamily: "raleway-semibold",
                      color: "grey",
                      fontSize: 11,
                      textTransform: "capitalize",
                    }}
                  >
                    {ride.payment_method}
                  </Text>
                </View>
              </View>
            </View>
            {/* Ride route */}
            <RideRoute
              from={ride.pickup.address}
              to={ride.destination.address}
            />
            <TouchableWithoutFeedback
              onPress={() => router.push(`./rides/ride_detail/${ride._id}`)}
            >
              <View style={styles.pay_btn}>
                <Text style={styles.pay_btn_text}>View ride details</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      );
    })}
  </ScrollView>
);

const CancelledRides = ({ data }: { data: any }) => {
  const { rebookRideRequest, rebooking } = useRideContext();
  const [rebookingId, setRebookingId] = React.useState<string | null>(null);

  const rebook_ride = async (ride_id: string) => {
    setRebookingId(ride_id);
    try {
      await rebookRideRequest(ride_id);
      router.push("../home");
    } catch (error: any) {
      console.log(error.message);
    } finally {
      setRebookingId(null); // reset after done
    }
  };
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      {data.map((ride: any, i: number) => (
        <View key={i}>
          <View style={styles.ride_card}>
            <View
              style={{
                backgroundColor: "#ff000035",
                marginBottom: 10,
                alignSelf: "flex-start",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 15,
              }}
            >
              <Text
                style={{
                  color: "#ff0000",
                  fontFamily: "raleway-bold",
                  fontSize: 10,
                }}
              >
                Cancelled
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-start",
                gap: 12,
              }}
            >
              <Image
                source={require("../../../assets/images/icons/sedan-icon.png")}
                style={{ width: 30, height: 30 }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 10,
                  flex: 1,
                }}
              >
                <Pressable
                  onPress={() => router.push(`./rides/ride_detail/${ride._id}`)}
                  style={{ width: "65%" }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: "raleway-bold",
                      color: "#fff",
                    }}
                  >
                    {ride.destination.address}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "raleway-semibold",
                      color: "grey",
                      fontSize: 11,
                    }}
                  >
                    {new Date(ride.createdAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => rebook_ride(ride._id)}
                  disabled={rebookingId === ride._id}
                  style={{
                    backgroundColor: "#fff",
                    paddingHorizontal: 10,
                    height: 30,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: rebookingId === ride._id ? 0.5 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: "#121212",
                      fontFamily: "raleway-semibold",
                      fontSize: 12,
                      marginBottom: 3,
                    }}
                  >
                    {rebookingId === ride._id ? "Rebooking..." : "Rebook"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default Rides;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header_text: {
    color: "#fff",
    marginTop: 10,
    fontFamily: "raleway-bold",
    fontSize: 30,
  },
  nav_container: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 20,
    marginVertical: 20,
  },
  nav_box: {
    backgroundColor: "grey",
    paddingVertical: 7,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderRadius: 20,
  },
  nav_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  nav_box_active: {
    backgroundColor: "#fff",
  },
  nav_text_active: {
    color: "#121212",
  },

  ride_card: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#4b4b4bff",
    width: "100%",
    borderRadius: 10,
    marginBottom: 30,
    padding: 15,
  },
  ride_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ride_header_text: {
    fontFamily: "poppins-bold",
    color: "#fff",
    fontSize: 12,
  },
  info_sec: {
    backgroundColor: "#363636",
    marginTop: 20,
    borderRadius: 5,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  driver_sec: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 10,
  },
  driver_img: {
    width: 25,
    height: 25,
    borderRadius: 15,
  },
  driver_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  amount_text: {
    fontFamily: "poppins-bold",
    color: "#5ffd7f",
  },
  pay_btn: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 10,
    marginTop: 15,
  },
  pay_btn_text: {
    color: "#121212",
    fontFamily: "poppins-bold",
    textAlign: "center",
  },
});

import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableWithoutFeedback,
  Linking,
} from "react-native";
import React, { useState } from "react";

import { router } from "expo-router";

import RideRoute from "../../../components/RideRoute";
import DriverCard from "../../../components/DriverCard";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import { useRideContext } from "../../../context/RideContext";
import { useNotificationContext } from "../../../context/NotificationContext";

const Rides = () => {
  const { showNotification } = useNotificationContext();

  const [category, setCategory] = useState<
    "ongoing" | "completed" | "cancelled"
  >("ongoing");

  const vehicleIcons: Record<string, any> = {
    cab: require("../../../assets/images/icons/sedan-icon.png"),
    keke: require("../../../assets/images/icons/keke-icon.png"),
    suv: require("../../../assets/images/icons/suv-icon.png"),
  };

  const { rideData, ongoingRideData, ongoingRideId } = useRideContext();

  const makeCall = async (phone: string) => {
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      showNotification("Could not place call", "error");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header_text}>Rides</Text>

      {/* Categories nav... */}
      <View style={styles.nav_container}>
        <TouchableWithoutFeedback onPress={() => setCategory("ongoing")}>
          <View
            style={[
              styles.nav_box,
              category === "ongoing" && styles.nav_box_active,
            ]}
          >
            <Text
              style={[
                styles.nav_text,
                category === "ongoing" && styles.nav_text_active,
              ]}
            >
              Ongoing
            </Text>
          </View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback onPress={() => setCategory("completed")}>
          <View
            style={[
              styles.nav_box,
              category === "completed" && styles.nav_box_active,
            ]}
          >
            <Text
              style={[
                styles.nav_text,
                category === "completed" && styles.nav_text_active,
              ]}
            >
              Completed
            </Text>
          </View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback onPress={() => setCategory("cancelled")}>
          <View
            style={[
              styles.nav_box,
              category === "cancelled" && styles.nav_box_active,
            ]}
          >
            <Text
              style={[
                styles.nav_text,
                category === "cancelled" && styles.nav_text_active,
              ]}
            >
              Cancelled
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>

      {/* Ongoing data */}
      {category === "ongoing" &&
        (ongoingRideId ? (
          <View style={styles.ride_card}>
            <View style={styles.ride_header}>
              <Text style={styles.ride_header_text}>
                {new Date(ongoingRideData.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </Text>
            </View>
            {/* Driver details */}
            {ongoingRideData.driver && (
              <>
                <DriverCard name={ongoingRideData.driver.user.name} />

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
                    source={vehicleIcons[ongoingRideData.driver.vehicle_type]}
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
                      {ongoingRideData.driver.vehicle_type} ride
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
                        {ongoingRideData.driver.vehicle.color}{" "}
                        {ongoingRideData.driver.vehicle.brand}{" "}
                        {ongoingRideData.driver.vehicle.model}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
            {/* Ride route */}

            <View style={{ marginTop: 10 }}>
              <RideRoute
                from={ongoingRideData.pickup.address}
                to={ongoingRideData.destination.address}
              />
            </View>

            {/* Pay */}
            {ongoingRideData.paid ? (
              <>
                <TouchableWithoutFeedback
                  onPress={() => makeCall(ongoingRideData.driver.user.phone)}
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
              </>
            ) : (
              <View style={styles.pay_btn}>
                <Text style={styles.pay_btn_text}>
                  Pay {ongoingRideData.fare.toLocaleString()} NGN
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontFamily: "raleway-bold",
                textAlign: "center",
                width: "80%",
              }}
            >
              You don't have any ongoing ride yet
            </Text>
          </View>
        ))}

      {/* Completed data */}
      {category === "completed" && (
        <View>
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
                source={require("../../../assets/images/icons/keke-icon.png")}
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
                  <Text style={{ fontFamily: "raleway-bold", color: "#fff" }}>
                    Konwea plaza
                  </Text>
                  <Text
                    style={{
                      fontFamily: "raleway-semibold",
                      color: "grey",
                      fontSize: 11,
                    }}
                  >
                    20 Dec, 2025 . 5:00am
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
                    500 NGN
                  </Text>
                  <Text
                    style={{
                      fontFamily: "raleway-semibold",
                      color: "grey",
                      fontSize: 11,
                    }}
                  >
                    Wallet
                  </Text>
                </View>
              </View>
            </View>
            {/* Ride route */}
            <RideRoute from="Anglican girls grammar school" to="Konwea Plaza" />
            <TouchableWithoutFeedback
              onPress={() => router.push("./rides/ride_detail")}
            >
              <View style={styles.pay_btn}>
                <Text style={styles.pay_btn_text}>View ride details</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      )}

      {/* Cancelled data */}
      {category === "cancelled" && (
        <View>
          <View style={styles.ride_card}>
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
                  flex: 1,
                }}
              >
                <View>
                  <Text style={{ fontFamily: "raleway-bold", color: "#fff" }}>
                    Asaba shoprite
                  </Text>
                  <Text
                    style={{
                      fontFamily: "raleway-semibold",
                      color: "grey",
                      fontSize: 11,
                    }}
                  >
                    20 Dec, 2025 . 5:00am
                  </Text>
                </View>
                <View>
                  <Text
                    style={{
                      color: "#e30f0fff",
                      fontFamily: "raleway-bold",
                      fontSize: 12,
                    }}
                  >
                    Cancelled
                  </Text>
                  <Text
                    style={{
                      color: "#848484ff",
                      fontFamily: "raleway-semibold",
                      fontSize: 11,
                      alignSelf: "flex-end",
                    }}
                  >
                    - By you
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default Rides;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingVertical: 40,
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
    marginTop: 20,
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
    marginTop: 30,
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

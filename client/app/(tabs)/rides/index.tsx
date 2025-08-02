import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState } from "react";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";

const Rides = () => {
  const [category, setCategory] = useState<
    "ongoing" | "completed" | "cancelled"
  >("ongoing");

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
      {category === "ongoing" && (
        <View style={styles.ride_card}>
          <View style={styles.ride_header}>
            <Text style={styles.ride_header_text}>Today, 22 Feb, 2025</Text>
            <Text style={styles.ride_header_text}>5:00AM - 6:30Am</Text>
          </View>
          <View style={styles.info_sec}>
            <View style={styles.driver_sec}>
              <Image
                source={require("../../../assets/images/black-profile.jpeg")}
                style={styles.driver_img}
                resizeMode="cover"
              />
              <View>
                <Text style={styles.driver_name}>Chidubem Oputa</Text>
              </View>
            </View>
            <View>
              <Text style={styles.amount_text}>5,000 NGN</Text>
            </View>
          </View>
          <View style={styles.route_sec}>
            <View style={styles.route}>
              <View style={styles.pickup_icon} />
              <View style={styles.route_texts}>
                <Text style={styles.route_type}>Pickup location:</Text>
                <Text style={styles.route_text}>
                  Anglican girls grammar school
                </Text>
              </View>
            </View>
            <View style={styles.route}>
              <View style={styles.dropoff_icon} />
              <View style={styles.route_texts}>
                <Text style={styles.route_type}>Drop off location:</Text>
                <Text style={styles.route_text}>Konwea Plaza</Text>
              </View>
            </View>
          </View>
          <View style={styles.pay_btn}>
            <Text style={styles.pay_btn_text}>Pay 5,000 NGN</Text>
          </View>
        </View>
      )}

      {/* Completed data */}
      {category === "completed" && (
        <TouchableWithoutFeedback
          onPress={() => router.push("./rides/ride_detail")}
        >
          <View style={{ marginTop: 10 }}>
            <View
              style={{
                backgroundColor: "#2c2c2c",
                flexDirection: "row",
                justifyContent: "flex-start",
                gap: 12,
                paddingVertical: 15,
                paddingHorizontal: 15,
                borderRadius: 10,
                marginTop: 15,
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
                      color: "#6fe30fff",
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
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Cancelled data */}
      {category === "cancelled" && (
        <View style={{ marginTop: 10 }}>
          <View
            style={{
              backgroundColor: "#2c2c2cff",
              flexDirection: "row",
              justifyContent: "flex-start",
              gap: 12,
              paddingVertical: 15,
              paddingHorizontal: 15,
              borderRadius: 10,
              marginTop: 15,
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
                    fontFamily: "poppins-bold",
                    fontSize: 12,
                  }}
                >
                  Cancelled
                </Text>
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
  route_sec: {
    marginTop: 30,
  },
  route: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  pickup_icon: {
    backgroundColor: "#fff",
    height: 15,
    width: 15,
    borderRadius: "50%",
  },
  dropoff_icon: {
    backgroundColor: "#fff",
    height: 12,
    width: 12,
  },
  route_type: {
    color: "#aaaaaa",
    fontFamily: "raleway-bold",
    fontSize: 10,
  },
  route_texts: {
    // marginTop: 10,
  },
  route_text: {
    color: "#ffffff",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  pay_btn: {
    backgroundColor: "#008a1c",
    flexDirection: "row",
    justifyContent: "center",
    borderRadius: 30,
    padding: 10,
    marginTop: 10,
  },
  pay_btn_text: {
    color: "#ffffff",
    fontFamily: "poppins-bold",
  },
});

import { StyleSheet, Text, View, Image } from "react-native";
import React from "react";

import FontAwesome from "@expo/vector-icons/FontAwesome";

const Rides = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header_text}>Rides</Text>

      {/* Categories nav... */}
      <View style={styles.nav_container}>
        <View style={[styles.nav_box, styles.nav_box_active]}>
          <Text style={[styles.nav_text, styles.nav_text_active]}>Ongoing</Text>
        </View>
        <View style={styles.nav_box}>
          <Text style={styles.nav_text}>Completed</Text>
        </View>
        <View style={styles.nav_box}>
          <Text style={styles.nav_text}>Cancelled</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.ride_card}>
        <View style={styles.ride_header}>
          <Text style={styles.ride_header_text}>Today, 22 Feb, 2025</Text>
          <Text style={styles.ride_header_text}>5:00AM - 6:30Am</Text>
        </View>
        <View style={styles.info_sec}>
          <View style={styles.driver_sec}>
            <Image
              source={require("../../assets/images/black-profile.jpeg")}
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
      </View>
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
    backgroundColor: "#343434",
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
    backgroundColor: "#5d5d5d",
    marginTop: 10,
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
    marginTop: 20,
  },
  route: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  pickup_icon: {
    backgroundColor: "#5ffd7f",
    height: 15,
    width: 15,
    borderRadius: "50%",
  },
  dropoff_icon: {
    backgroundColor: "#fd6c5f",
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
});

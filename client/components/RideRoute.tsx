import { StyleSheet, Text, View } from "react-native";
import React from "react";

const RideRoute: React.FC<{ from: string; to: string }> = ({ from, to }) => {
  return (
    <View style={styles.route_sec}>
      <View style={styles.route}>
        <View style={styles.pickup_icon} />
        <View style={styles.route_texts}>
          <Text style={styles.route_type}>Pickup location:</Text>
          <Text style={styles.route_text}>{from}</Text>
        </View>
      </View>
      <View style={styles.route}>
        <View style={styles.dropoff_icon} />
        <View style={styles.route_texts}>
          <Text style={styles.route_type}>Drop off location:</Text>
          <Text style={styles.route_text}>{to}</Text>
        </View>
      </View>
    </View>
  );
};

export default RideRoute;

const styles = StyleSheet.create({
  route_sec: {
    marginTop: 10,
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
    paddingRight: 10,
  },
});

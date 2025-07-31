import { StyleSheet, Text, View, TextInput, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";

import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";

import { darkMapStyle } from "../../data/map.dark";

import * as Location from "expo-location";

const Home = () => {
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

  return (
    <View style={{ backgroundColor: "#121212", flex: 1 }}>
      {/* Map */}
      <MapView
        style={{ height: "85%" }}
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
          />
        )}
      </MapView>

      {/* Nav */}
      <View style={styles.nav_container}>
        <View style={styles.nav_box}>
          <Feather name="menu" size={22} color="white" />
        </View>
        <View style={styles.nav_box}>
          <Feather name="bell" size={22} color="white" />
        </View>
      </View>
      {/* Modal */}
      <View style={styles.modal}>
        {/* Expand line */}
        <View style={styles.expand_line_conatiner}>
          <View style={styles.expand_line} />
        </View>

        {/* Header text */}
        {/* <Text style={styles.header_text}>Let's go places...</Text> */}
        <Text style={[styles.header_text, { textAlign: "center" }]}>
          Choose your route...
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            placeholder="Where we dey go?"
            placeholderTextColor={"grey"}
            editable={false}
            style={styles.text_input}
          />
          <View style={{ flex: 1, marginTop: 20 }}>
            <View style={styles.route_inp_container}>
              <View style={styles.from_circle} />
              <TextInput
                style={styles.route_input}
                placeholder="24 Lucia avenue, Okwe"
                placeholderTextColor={"#ffffff"}
              />
            </View>
            <View style={styles.route_inp_container}>
              <View style={styles.to_square} />
              <TextInput
                style={styles.route_input}
                placeholder="Destination"
                placeholderTextColor={"#b7b7b7"}
              />
            </View>
          </View>
        </View>

        {/* Suggestions */}
        <ScrollView style={styles.suggestions_container}>
          <View style={styles.suggestion_box}>
            <Ionicons name="location" size={20} color="#b7b7b7" />
            <View>
              <Text style={styles.suggestion_header_text}>
                Anglican girls grammar school
              </Text>
              <Text style={styles.suggestion_sub_text}>
                409 Nnebisi Road, Umuagu, Asaba 320242, Delta
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  nav_container: {
    width: "100%",
    flexDirection: "row",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1,
    position: "absolute",
    top: 50,
  },
  nav_box: {
    width: 45,
    height: 45,
    backgroundColor: "#121212",
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    height: "85%",
    width: "100%",
    backgroundColor: "#121212",
    position: "absolute",
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  expand_line_conatiner: {
    width: "100%",
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
    marginTop: 10,
  },
  form: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  text_input: {
    backgroundColor: "#3f3f3f",
    borderBottomWidth: 0,
    outlineWidth: 0,
    marginTop: 20,
    borderRadius: 7,
    flex: 1,
    fontFamily: "raleway-bold",
    fontSize: 18,
    paddingHorizontal: 10,
    display: "none",
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
});

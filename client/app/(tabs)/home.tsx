import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableWithoutFeedback,
  Animated,
  Image,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";

import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Entypo from "@expo/vector-icons/Entypo";

import { darkMapStyle } from "../../data/map.dark";

import * as Location from "expo-location";

const Home = () => {
  const [carType, setCarType] = useState<"sedan" | "keke" | "suv">("keke");

  const [modalUp, setModalUp] = useState<boolean>(false);

  const height = useRef(new Animated.Value(180)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const expand_route_modal = () => {
    setModalUp(true);
    Animated.timing(height, {
      toValue: 600,
      duration: 500,
      useNativeDriver: false,
    }).start();
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  const collapse_route_modal = () => {
    setModalUp(false);
    Animated.timing(height, {
      toValue: 180,
      duration: 300,
      useNativeDriver: false,
    }).start();
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);
  const sideNavTranslate = useRef(new Animated.Value(-320)).current;
  const openSideNav = () => {
    setSideNavOpen(true);
    Animated.timing(sideNavTranslate, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSideNav = () => {
    Animated.timing(sideNavTranslate, {
      toValue: -320,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSideNavOpen(false));
  };

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

    // Collapsing route model on render
    collapse_route_modal();
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
        <TouchableWithoutFeedback onPress={openSideNav}>
          <View style={styles.nav_box}>
            <Feather name="menu" size={22} color="white" />
          </View>
        </TouchableWithoutFeedback>
        <View style={styles.nav_box}>
          <Feather name="bell" size={22} color="white" />
        </View>
      </View>

      {/* Side nav */}
      {sideNavOpen && (
        <TouchableWithoutFeedback onPress={closeSideNav}>
          <View
            style={{
              position: "absolute",
              zIndex: 1,
              height: "100%",
              width: "100%",
              backgroundColor: "#12121290",
            }}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View
                style={{
                  position: "absolute",
                  zIndex: 1,
                  height: "100%",
                  width: 320,
                  backgroundColor: "#121212",
                  paddingTop: 50,
                  paddingHorizontal: 20,
                  flex: 1,
                  justifyContent: "space-between",
                  transform: [{ translateX: sideNavTranslate }],
                }}
              >
                <View>
                  {/* Logo */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingRight: 5,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: "raleway-bold",
                        fontSize: 30,
                      }}
                    >
                      Igle
                    </Text>
                    <TouchableWithoutFeedback
                      onPress={closeSideNav}
                      style={{ padding: 10 }}
                    >
                      <Feather name="sidebar" size={24} color="#fff" />
                    </TouchableWithoutFeedback>
                  </View>

                  {/* User */}
                  <View
                    style={{
                      marginVertical: 30,
                      backgroundColor: "#393939",
                      paddingHorizontal: 10,
                      paddingVertical: 10,
                      borderRadius: 10,
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <Image
                      source={require("../../assets/images/black-profile.jpeg")}
                      style={{ height: 50, width: 50, borderRadius: 25 }}
                    />

                    <View>
                      <Text
                        style={{
                          color: "#fff",
                          fontFamily: "raleway-bold",
                          fontSize: 16,
                        }}
                      >
                        Oputa Lawrence
                      </Text>
                      <Text
                        style={{
                          color: "#ffffff",
                          fontFamily: "raleway-regular",
                          marginTop: 3,
                        }}
                      >
                        Rider
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Side bar values */}
                <View>
                  <View style={styles.sidenav_content_box}>
                    <FontAwesome name="car" size={20} color="#c6c6c6" />
                    <Text style={styles.sidenav_content_text}>My Rides</Text>
                  </View>
                  <View style={styles.sidenav_content_box}>
                    <Entypo name="wallet" size={20} color="#c6c6c6" />
                    <Text style={styles.sidenav_content_text}>Wallet</Text>
                  </View>
                  <View style={styles.sidenav_content_box}>
                    <Ionicons name="pricetag" size={20} color="#c6c6c6" />
                    <Text style={styles.sidenav_content_text}>Promotions</Text>
                  </View>
                  <View style={styles.sidenav_content_box}>
                    <Feather name="help-circle" size={20} color="#c6c6c6" />
                    <Text style={styles.sidenav_content_text}>Support</Text>
                  </View>
                  <View style={styles.sidenav_content_box}>
                    <FontAwesome name="info-circle" size={20} color="#c6c6c6" />
                    <Text style={styles.sidenav_content_text}>About</Text>
                  </View>
                  <View style={styles.sidenav_content_box}>
                    <FontAwesome name="star" size={20} color="#c6c6c6" />
                    <Text style={styles.sidenav_content_text}>Rate us</Text>
                  </View>
                </View>

                {/* Switch mode */}
                <View style={{ marginBottom: 30, paddingHorizontal: 10 }}>
                  <View
                    style={{
                      backgroundColor: "#fff",
                      padding: 10,
                      paddingHorizontal: 30,
                      borderRadius: 5,
                      flexDirection: "row",
                      gap: 10,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#121212",
                        fontFamily: "raleway-bold",
                        fontSize: 16,
                      }}
                    >
                      Driver mode
                    </Text>
                    <FontAwesome6 name="rotate" size={20} color="black" />
                  </View>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Modal */}
      <Animated.View style={[styles.modal, { height: height }]}>
        {/* Expand line */}
        <TouchableWithoutFeedback onPress={collapse_route_modal}>
          <View style={styles.expand_line_conatiner}>
            <View style={styles.expand_line} />
          </View>
        </TouchableWithoutFeedback>

        {/* Header text */}
        {modalUp ? (
          <Text style={[styles.header_text, { textAlign: "center" }]}>
            Choose your route...
          </Text>
        ) : (
          <Text style={styles.header_text}>Ifeanyi, let's go places...</Text>
        )}

        {/* Form */}
        {!modalUp && (
          <TouchableWithoutFeedback onPress={expand_route_modal}>
            <View style={styles.form}>
              <View style={styles.text_inp_container}>
                <Image
                  source={require("../../assets/images/icons/car-icon.png")}
                  style={{ height: 30, width: 30 }}
                />
                <TextInput
                  placeholder="Where we dey go?"
                  placeholderTextColor={"#8d8d8d"}
                  editable={false}
                  style={styles.text_input}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}

        {/* Route slection form */}
        <Animated.View style={[styles.form, { opacity }]}>
          <View style={{ flex: 1, marginTop: 10 }}>
            {/* Pick car type */}
            <View style={styles.select_ride_container}>
              <TouchableWithoutFeedback onPress={() => setCarType("keke")}>
                <View
                  style={[
                    styles.select_ride_box,
                    carType === "keke" && styles.select_ride_box_active,
                  ]}
                >
                  <Image
                    source={require("../../assets/images/icons/keke-icon.png")}
                    style={{ width: 25, height: 25 }}
                  />
                  <Text
                    style={[
                      { color: "#fff", fontFamily: "raleway-bold" },
                      carType === "keke" && styles.select_ride_text_active,
                    ]}
                  >
                    Keke
                  </Text>
                </View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={() => setCarType("sedan")}>
                <View
                  style={[
                    styles.select_ride_box,
                    carType === "sedan" && styles.select_ride_box_active,
                  ]}
                >
                  <Image
                    source={require("../../assets/images/icons/sedan-icon.png")}
                    style={{ width: 25, height: 25 }}
                  />
                  <Text
                    style={[
                      { color: "#fff", fontFamily: "raleway-bold" },
                      carType === "sedan" && styles.select_ride_text_active,
                    ]}
                  >
                    Cab
                  </Text>
                </View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={() => setCarType("suv")}>
                <View
                  style={[
                    styles.select_ride_box,
                    carType === "suv" && styles.select_ride_box_active,
                  ]}
                >
                  <Image
                    source={require("../../assets/images/icons/suv-icon.png")}
                    style={{ width: 25, height: 25 }}
                  />
                  <Text
                    style={[
                      { color: "#fff", fontFamily: "raleway-bold" },
                      carType === "suv" && styles.select_ride_text_active,
                    ]}
                  >
                    SUV
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            </View>

            {/* Select pickup and drop off */}
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
        </Animated.View>

        {/* Suggestions */}
        <Animated.ScrollView
          style={[styles.suggestions_container, { opacity }]}
        >
          <View style={styles.suggestion_box}>
            <Ionicons name="location" size={24} color="#b7b7b7" />
            <View>
              <Text style={styles.suggestion_header_text}>
                Anglican girls grammar school
              </Text>
              <Text style={styles.suggestion_sub_text}>
                6P38+VWR, Unnamed Road, Umuagu, Asaba 320242, Delta
              </Text>
            </View>
          </View>
        </Animated.ScrollView>
      </Animated.View>
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
    // height: "85%",
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
    padding: 10,
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
  },
  form: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },

  select_ride_container: {
    marginBottom: 20,
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#515151",
    borderStyle: "solid",
    paddingBottom: 20,
  },
  select_ride_box: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 7,
    borderColor: "grey",
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: 20,
    padding: 5,
    paddingHorizontal: 10,
    backgroundColor: "grey",
  },
  select_ride_box_active: {
    backgroundColor: "#fff",
  },
  select_ride_text_active: {
    color: "#121212",
  },
  text_inp_container: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    backgroundColor: "#3f3f3f",
    marginTop: 20,
    borderRadius: 7,
  },
  text_input: {
    backgroundColor: "transparent",
    flex: 1,
    fontFamily: "raleway-bold",
    fontSize: 18,
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

  sidenav_content_box: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 15,
    alignItems: "center",
    paddingHorizontal: 5,
    marginVertical: 15,
  },
  sidenav_content_text: {
    color: "#c6c6c6",
    fontFamily: "raleway-semibold",
    fontSize: 18,
  },
});

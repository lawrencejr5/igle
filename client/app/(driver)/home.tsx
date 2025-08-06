import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import React, { useState, useEffect } from "react";

import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import Feather from "@expo/vector-icons/Feather";

import { darkMapStyle } from "../../data/map.dark";

import * as Location from "expo-location";

import SideNav from "../../components/SideNav";
import NotificationScreen from "../../components/screens/NotificationScreen";
import RouteModal from "../../components/RouteModal";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { MaterialIcons } from "@expo/vector-icons";
import RideRoute from "../../components/RideRoute";

const HomePage = () => {
  // Side nav state
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);

  // Notification screen state
  const [openNotification, setOpenNotification] = useState<boolean>(false);

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

  const [available, setAvailable] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [accepted, setAccepted] = useState<boolean>(false);

  useEffect(() => {
    if (available) {
      const findOffer = setTimeout(() => {
        setLoading(false);
      }, 3000);
      return () => clearTimeout(findOffer);
    }
    if (!available) {
      setLoading(true);
      setAccepted(false);
    }
  }, [available, loading]);

  return (
    <View style={{ backgroundColor: "#121212", flex: 1 }}>
      {/* Map */}
      <MapView
        style={{ height: "95%" }}
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
          >
            <View style={{ width: 35, height: 35 }}>
              <Image
                source={require("../../assets/images/icons/keke-icon.png")}
                style={{ width: "100%", height: "100%", resizeMode: "contain" }}
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
      <SideNav open={sideNavOpen} setSideNavOpen={setSideNavOpen} />

      {/* Notification screen */}
      <NotificationScreen
        open={openNotification}
        setOpen={setOpenNotification}
      />

      {/* Searching for drivers */}
      <View style={[styles.main_modal_container]}>
        {available && (
          <View
            style={{
              backgroundColor: "#121212",
              width: "100%",
              flex: 1,
              marginBottom: 40,
            }}
          >
            {loading ? (
              <View>
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "raleway-bold",
                    textAlign: "center",
                  }}
                >
                  Searching for new ride offers...
                </Text>
              </View>
            ) : (
              //   Incoming ride request
              <>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    fontFamily: "raleway-bold",
                    marginBottom: 10,
                  }}
                >
                  Incoming ride request
                </Text>

                {/* Ride request card */}
                <View
                  style={{
                    borderStyle: "solid",
                    borderColor: "#a0a0a0ff",
                    borderWidth: 0.5,
                    borderRadius: 10,
                    paddingVertical: 15,
                    paddingHorizontal: 20,
                  }}
                >
                  {/* Header */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    {/* User */}
                    <View style={{ flexDirection: "row", gap: 20 }}>
                      <Image
                        source={require("../../assets/images/black-profile.jpeg")}
                        style={{ width: 30, height: 30 }}
                      />
                      <View>
                        <Text
                          style={{
                            color: "#fff",
                            fontFamily: "raleway-semibold",
                          }}
                        >
                          Oputa Lawrence
                        </Text>
                        <Text
                          style={{
                            color: "#d7d7d7",
                            fontSize: 10,
                            fontFamily: "raleway-regular",
                          }}
                        >
                          34 ride completed
                        </Text>
                      </View>
                    </View>

                    {/* Timeout or call */}
                    {!accepted ? (
                      <Text
                        style={{ fontFamily: "poppins-regular", color: "#fff" }}
                      >
                        90s
                      </Text>
                    ) : (
                      <View
                        style={{
                          backgroundColor: "#fff",
                          borderRadius: "50%",
                          width: 35,
                          height: 35,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FontAwesome name="phone" color={"#121212"} size={20} />
                      </View>
                    )}
                  </View>

                  {/* Estimated time and duration */}
                  <View
                    style={{
                      marginTop: 20,
                      marginBottom: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <MaterialIcons
                      name="access-time"
                      color={"#d7d7d7"}
                      size={16}
                    />
                    <Text
                      style={{
                        color: "#d7d7d7",
                        fontFamily: "poppins-regular",
                        fontSize: 12,
                        marginTop: 3,
                      }}
                    >
                      24 mins (3.45 km)
                    </Text>
                  </View>

                  {/* Ride route card */}
                  <RideRoute from="Konwea plaza" to="Slot, Nnebisi road" />

                  {/* Price */}
                  <Text
                    style={{
                      color: "#10b804ff",
                      fontFamily: "poppins-bold",
                      fontSize: 18,
                    }}
                  >
                    1,500 NGN
                  </Text>

                  {/* Action btns */}
                  {!accepted ? (
                    <View
                      style={{
                        marginTop: 20,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        gap: 20,
                      }}
                    >
                      <TouchableWithoutFeedback
                        onPress={() => setAccepted(true)}
                      >
                        <View
                          style={{
                            backgroundColor: "#fff",
                            borderRadius: 30,
                            padding: 10,
                            flex: 1,
                          }}
                        >
                          <Text
                            style={{
                              color: "#121212",
                              fontFamily: "raleway-bold",
                              fontSize: 16,
                              textAlign: "center",
                            }}
                          >
                            Accept
                          </Text>
                        </View>
                      </TouchableWithoutFeedback>

                      <TouchableWithoutFeedback
                        onPress={() => setLoading(true)}
                      >
                        <View
                          style={{
                            backgroundColor: "transparent",
                            borderRadius: 30,
                            borderStyle: "solid",
                            borderColor: "#fff",
                            borderWidth: 1,
                            padding: 10,
                            flex: 1,
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontFamily: "raleway-bold",
                              fontSize: 16,
                              textAlign: "center",
                            }}
                          >
                            Cancel
                          </Text>
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  ) : (
                    <View
                      style={{
                        marginTop: 20,
                      }}
                    >
                      <TouchableWithoutFeedback
                        onPress={() => setAccepted(true)}
                      >
                        <View
                          style={{
                            backgroundColor: "#fff",
                            borderRadius: 30,
                            padding: 10,
                            flex: 1,
                          }}
                        >
                          <Text
                            style={{
                              color: "#121212",
                              fontFamily: "raleway-bold",
                              fontSize: 16,
                              textAlign: "center",
                            }}
                          >
                            Start trip
                          </Text>
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.main_modal}>
          <Image
            source={require("../../assets/images/black-profile.jpeg")}
            style={{ height: 40, width: 40, borderRadius: 20 }}
          />
          <TouchableWithoutFeedback onPress={() => setAvailable(!available)}>
            {available ? (
              <View style={[styles.status, { backgroundColor: "#40863a4f" }]}>
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
  );
};

export default HomePage;

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
  main_modal_container: {
    backgroundColor: "#121212",
    flex: 1,
    width: "100%",
    position: "absolute",
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: "space-between",
  },
  main_modal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
});

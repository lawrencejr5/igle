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
      <View
        style={{
          backgroundColor: "#121212",
          height: "15%",
          width: "100%",
          position: "absolute",
          bottom: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: 20,
          paddingVertical: 30,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Image
          source={require("../../assets/images/black-profile.jpeg")}
          style={{ height: 40, width: 40, borderRadius: 20 }}
        />
        <View
          style={{
            // backgroundColor: "#40863a4f",
            backgroundColor: "#ff44002a",
            paddingHorizontal: 30,
            paddingVertical: 10,
            borderRadius: 20,
          }}
        >
          <Text
            style={{
              fontFamily: "raleway-semibold",
              fontSize: 12,
              //   color: "#33b735ff",
              color: "#d12705ff",
            }}
          >
            You're offline
          </Text>
        </View>
        <FontAwesome name="sliders" size={24} color="#d7d7d7" />
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
});

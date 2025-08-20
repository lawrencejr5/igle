import { StyleSheet, View, Text, TouchableWithoutFeedback } from "react-native";
import React, { useState, useEffect, useRef } from "react";

import { io } from "socket.io-client";

import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";

import Feather from "@expo/vector-icons/Feather";

import { darkMapStyle } from "../../data/map.dark";

import * as Location from "expo-location";

import SideNav from "../../components/SideNav";
import NotificationScreen from "../../components/screens/NotificationScreen";

import RouteModal from "../../components/RouteModal";
import Notification from "../../components/Notification";

import { useNotificationContext } from "../../context/NotificationContext";
import { useMapContext } from "../../context/MapContext";

import { useAuthContext } from "../../context/AuthContext";

const Home = () => {
  // Side nav state
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);

  // Notification screen state
  const [openNotification, setOpenNotification] = useState<boolean>(false);

  const { notification } = useNotificationContext();
  const {
    region,
    getPlaceName,
    destination,
    destinationCoords,
    routeCoords,
    mapRef,
    locationLoading,
  } = useMapContext();

  const { appLoading } = useAuthContext();

  useEffect(() => {
    getPlaceName(region.latitude, region.longitude);
  }, [region]);

  if (appLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#121212",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 14,
            fontFamily: "raleway-regular",
          }}
        >
          App data is loading, please wait...
        </Text>
      </View>
    );
  }

  return (
    <>
      <Notification notification={notification} />
      <View style={{ backgroundColor: "#121212", flex: 1 }}>
        {/* Map */}
        {!locationLoading && region && (
          <MapView
            ref={mapRef}
            style={{ height: "75%" }}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            customMapStyle={darkMapStyle}
          >
            <Marker
              coordinate={{
                latitude: region.latitude,
                longitude: region.longitude,
              }}
              title="Your location"
            >
              <View
                style={{
                  backgroundColor: "white",
                  padding: 5,
                  borderRadius: 50,
                }}
              >
                <View
                  style={{
                    backgroundColor: "black",
                    padding: 5,
                    borderRadius: 50,
                  }}
                />
              </View>
            </Marker>
            {destinationCoords && destination && (
              <Marker
                coordinate={{
                  latitude: destinationCoords[0],
                  longitude: destinationCoords[1],
                }}
                title="Destination"
              >
                <View
                  style={{
                    backgroundColor: "white",
                    padding: 4,
                    borderRadius: 2,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "black",
                      padding: 4,
                      borderRadius: 2,
                    }}
                  />
                </View>
              </Marker>
            )}

            {routeCoords.length > 0 && destination && (
              <Polyline
                coordinates={routeCoords}
                strokeColor="#fff"
                strokeWidth={4}
              />
            )}
          </MapView>
        )}

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
        <SideNav
          open={sideNavOpen}
          setSideNavOpen={setSideNavOpen}
          mode="rider"
        />

        {/* Notification screen */}
        <NotificationScreen
          open={openNotification}
          setOpen={setOpenNotification}
        />

        {/* Choose route Modal */}
        <RouteModal />
      </View>
    </>
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
});

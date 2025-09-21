import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import React, { useState, useEffect, useMemo } from "react";

import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";

import Feather from "@expo/vector-icons/Feather";

import { darkMapStyle } from "../../data/map.dark";

import SideNav from "../../components/SideNav";
import NotificationScreen from "../../components/screens/NotificationScreen";
import LocationUpdateModal from "../../components/LocationUpdateModal";

import Notification from "../../components/Notification";
import { useNotificationContext } from "../../context/NotificationContext";

import { useDriverAuthContext } from "../../context/DriverAuthContext";

import { useMapContext } from "../../context/MapContext";
import { useDriverContext } from "../../context/DriverContext";
import DriverRideModal from "../../components/DriverRideModal";

const HomePage = () => {
  const { notification } = useNotificationContext();
  const { getDriverProfile } = useDriverAuthContext();
  const {
    ongoingRideData,
    toPickupRouteCoords,
    toDestinationRouteCoords,
    mapRef,
    locationModalOpen,
    setLocationModalOpen,
  } = useDriverContext();
  const { region } = useMapContext();

  useEffect(() => {
    getDriverProfile();
  }, []);

  // Side nav state
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);

  // Notification screen state
  const [openNotification, setOpenNotification] = useState<boolean>(false);

  useEffect(() => {
    if (region && mapRef.current) {
      mapRef.current.animateToRegion(
        region,
        1000 // duration in ms
      );
    }
  }, [region]);

  const memoizedPickupRouteCoords = useMemo(
    () => toPickupRouteCoords,
    [toPickupRouteCoords]
  );
  const memoizedDestinationRouteCoords = useMemo(
    () => toDestinationRouteCoords,
    [toDestinationRouteCoords]
  );

  return (
    <>
      {notification.visible && <Notification notification={notification} />}
      <View style={styles.container}>
        {/* Map */}
        {region && (
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            ref={mapRef}
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
              <View style={styles.markerIcon}>
                <Image
                  source={require("../../assets/images/icons/keke-icon.png")}
                  style={styles.markerImage}
                />
              </View>
            </Marker>

            {ongoingRideData && memoizedPickupRouteCoords && (
              <Marker
                coordinate={{
                  latitude: ongoingRideData.pickup.coordinates[0],
                  longitude: ongoingRideData.pickup.coordinates[1],
                }}
                title="Pickup"
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
            {ongoingRideData && memoizedDestinationRouteCoords && (
              <Marker
                coordinate={{
                  latitude: ongoingRideData.destination.coordinates[0],
                  longitude: ongoingRideData.destination.coordinates[1],
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

            {toPickupRouteCoords && (
              <Polyline
                coordinates={memoizedPickupRouteCoords}
                strokeColor="#fff"
                strokeWidth={4}
              />
            )}

            {toDestinationRouteCoords && (
              <Polyline
                coordinates={memoizedDestinationRouteCoords}
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
          mode="driver"
        />

        {/* Notification screen */}
        <NotificationScreen
          open={openNotification}
          setOpen={setOpenNotification}
        />

        {/* Location Update Modal */}
        <LocationUpdateModal
          visible={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
        />

        {/* Searching for drivers */}
        <DriverRideModal />
      </View>
    </>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
    flex: 1,
  },
  map: {
    height: "95%",
  },
  markerIcon: {
    width: 35,
    height: 35,
  },
  markerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  nav_container: {
    width: "100%",
    flexDirection: "row",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    top: 50,
    gap: 10,
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

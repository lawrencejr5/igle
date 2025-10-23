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
  const { driveStatus } = useDriverContext();
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
      mapRef.current.animateToRegion(region, 1000);
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

  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  // Stop tracking changes after the marker has loaded
  const loadMap = () => {
    setTracksViewChanges(false);
  };

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
            onMapLoaded={loadMap}
          >
            <Marker
              tracksViewChanges={tracksViewChanges}
              coordinate={
                driveStatus === "arrived" || driveStatus === "ongoing"
                  ? {
                      latitude: ongoingRideData?.pickup.coordinates[0],
                      longitude: ongoingRideData?.pickup.coordinates[1],
                    }
                  : region
              }
              title="You are here!"
              anchor={{ x: 0.2, y: 0.2 }}
            >
              <View style={styles.markerIcon}>
                <Image
                  source={require("../../assets/images/icons/sedan-icon.png")}
                  style={styles.markerImage}
                />
              </View>
            </Marker>

            {ongoingRideData &&
              ongoingRideData.pickup &&
              driveStatus === "arriving" && (
                <Marker
                  // tracksViewChanges={tracksViewChanges}
                  coordinate={{
                    latitude: ongoingRideData.pickup.coordinates[0],
                    longitude: ongoingRideData.pickup.coordinates[1],
                  }}
                  title="Pickup"
                  anchor={{ x: 0.2, y: 0.2 }}
                >
                  <View style={styles.markerIcon}>
                    <Image
                      source={require("../../assets/images/user.png")}
                      style={styles.markerImage}
                    />
                  </View>
                </Marker>
              )}
            {ongoingRideData &&
              ongoingRideData.destination &&
              (driveStatus === "arrived" || driveStatus === "ongoing") && (
                <Marker
                  // tracksViewChanges={tracksViewChanges}
                  coordinate={{
                    latitude: ongoingRideData.destination.coordinates[0],
                    longitude: ongoingRideData.destination.coordinates[1],
                  }}
                  title="Destination"
                  anchor={{ x: 0.2, y: 0.2 }}
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
                strokeWidth={2}
              />
            )}

            {toDestinationRouteCoords && (
              <Polyline
                coordinates={memoizedDestinationRouteCoords}
                strokeColor="#fff"
                strokeWidth={3}
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
        </View>

        {/* Side nav */}
        <SideNav
          open={sideNavOpen}
          setSideNavOpen={setSideNavOpen}
          mode="driver"
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
    width: 35,
    height: 35,
    borderRadius: 50,
  },
  nav_container: {
    width: "100%",
    flexDirection: "row",
    paddingHorizontal: 20,
    justifyContent: "flex-end",
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

import { StyleSheet, View, TouchableWithoutFeedback } from "react-native";
import { Image } from "expo-image";

import React, { useState, useEffect, useMemo } from "react";

import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";

import Feather from "@expo/vector-icons/Feather";

import { darkMapStyle } from "../../data/map.dark";

import SideNav from "../../components/SideNav";
import NotificationScreen from "../../components/screens/NotificationScreen";
import LocationUpdateModal from "../../components/LocationUpdateModal";

import { useNotificationContext } from "../../context/NotificationContext";

import { useDriverAuthContext } from "../../context/DriverAuthContext";

import { useMapContext } from "../../context/MapContext";
import { useDriverContext } from "../../context/DriverContext";
import DriverRideModal from "../../components/DriverRideModal";
import AppLoading from "../../loadings/AppLoading";
import { useLoading } from "../../context/LoadingContext";

const HomePage = () => {
  const { notification } = useNotificationContext();
  const { getDriverProfile, driver } = useDriverAuthContext();
  const { driveStatus } = useDriverContext();
  const {
    jobType,
    ongoingRideData,
    ongoingDeliveryData,
    toPickupRouteCoords,
    toDestinationRouteCoords,
    mapRef,
    locationModalOpen,
    setLocationModalOpen,
  } = useDriverContext();
  const { region, mapPadding } = useMapContext();
  const { driverLoading } = useLoading();

  useEffect(() => {
    getDriverProfile();
  }, []);

  // Side nav state
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);

  // Notification screen state
  const [openNotification, setOpenNotification] = useState<boolean>(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (region && mapRef.current) {
        mapRef.current.animateToRegion(region, 1000);
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [region]);

  // When returning to searching (after completing/cancelling), re-center map after layout settles
  useEffect(() => {
    if (driveStatus === "searching" && region && mapRef.current) {
      const timeout = setTimeout(() => {
        mapRef.current?.animateToRegion(region, 1000);
      }, 350);
      return () => clearTimeout(timeout);
    }
  }, [driveStatus, region]);

  const memoizedPickupRouteCoords = useMemo(
    () => toPickupRouteCoords,
    [toPickupRouteCoords],
  );
  const memoizedDestinationRouteCoords = useMemo(
    () => toDestinationRouteCoords,
    [toDestinationRouteCoords],
  );

  // Derive pickup and destination coordinates based on current job type
  const pickupCoordsArr: [number, number] | null = useMemo(() => {
    if (jobType === "ride") {
      return ongoingRideData?.pickup?.coordinates || null;
    }
    if (jobType === "delivery") {
      return ongoingDeliveryData?.pickup?.coordinates || null;
    }
    return null;
  }, [jobType, ongoingRideData, ongoingDeliveryData]);

  const destinationCoordsArr: [number, number] | null = useMemo(() => {
    if (jobType === "ride") {
      return ongoingRideData?.destination?.coordinates || null;
    }
    if (jobType === "delivery") {
      return ongoingDeliveryData?.dropoff?.coordinates || null;
    }
    return null;
  }, [jobType, ongoingRideData, ongoingDeliveryData]);

  const hasPickup =
    Array.isArray(pickupCoordsArr) && pickupCoordsArr.length === 2;
  const hasDestination =
    Array.isArray(destinationCoordsArr) && destinationCoordsArr.length === 2;

  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  // Stop tracking changes after the marker has loaded
  const loadMap = () => {
    setTracksViewChanges(false);
  };

  // Determine driver's current position on map
  // When arrived at pickup (for both rides and deliveries), show driver at pickup location
  // Otherwise show at current region
  const driverMarkerCoordinate = useMemo(() => {
    if (
      hasPickup &&
      (driveStatus === "arrived" ||
        driveStatus === "picked_up" ||
        driveStatus === "ongoing")
    ) {
      return {
        latitude: pickupCoordsArr![0],
        longitude: pickupCoordsArr![1],
      };
    }
    return region;
  }, [hasPickup, pickupCoordsArr, driveStatus, region]);

  // Get vehicle icon based on driver's vehicle type
  const getDriverVehicleIcon = () => {
    switch (driver?.vehicle_type) {
      case "bike":
        return require("../../assets/images/icons/motorcycle-icon.png");
      case "keke":
        return require("../../assets/images/icons/keke-icon.png");
      case "van":
        return require("../../assets/images/icons/van-icon.png");
      case "truck":
        return require("../../assets/images/icons/truck-icon.png");
      case "suv":
        return require("../../assets/images/icons/suv-icon.png");
      case "cab":
      default:
        return require("../../assets/images/icons/sedan-icon.png");
    }
  };

  return (
    <>
      <>
        <View style={styles.container}>
          {/* Map */}
          {region && (
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              ref={mapRef}
              initialRegion={region}
              customMapStyle={darkMapStyle}
              paddingAdjustmentBehavior="always"
              mapPadding={mapPadding}
              onMapLoaded={loadMap}
            >
              {/* Driver's current position */}
              <Marker
                // tracksViewChanges={tracksViewChanges}
                coordinate={driverMarkerCoordinate}
                title="You are here!"
                anchor={{ x: 0.3, y: 0.4 }}
              >
                <View style={styles.markerIcon}>
                  <Image
                    source={getDriverVehicleIcon()}
                    style={styles.markerImage}
                  />
                </View>
              </Marker>

              {/* Pickup marker (for both rides and deliveries) - only show when arriving */}
              {hasPickup && driveStatus === "arriving" && (
                <Marker
                  coordinate={{
                    latitude: pickupCoordsArr![0],
                    longitude: pickupCoordsArr![1],
                  }}
                  title={jobType === "delivery" ? "Pickup" : "Pickup"}
                  anchor={{ x: 0.3, y: 0.4 }}
                >
                  <View style={styles.markerIcon}>
                    <Image
                      source={require("../../assets/images/user.png")}
                      style={[styles.markerImage, { height: 30, width: 30 }]}
                    />
                  </View>
                </Marker>
              )}

              {/* Destination/Dropoff marker */}
              {hasDestination &&
                ((jobType === "ride" &&
                  (driveStatus === "arrived" || driveStatus === "ongoing")) ||
                  (jobType === "delivery" &&
                    driveStatus !== "completed" &&
                    memoizedDestinationRouteCoords)) && (
                  <Marker
                    coordinate={{
                      latitude: destinationCoordsArr![0],
                      longitude: destinationCoordsArr![1],
                    }}
                    title={jobType === "delivery" ? "Dropoff" : "Destination"}
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

              {Array.isArray(memoizedPickupRouteCoords) &&
                memoizedPickupRouteCoords.length > 1 && (
                  <Polyline
                    coordinates={memoizedPickupRouteCoords}
                    strokeColor="#fff"
                    strokeWidth={2}
                  />
                )}

              {Array.isArray(memoizedDestinationRouteCoords) &&
                memoizedDestinationRouteCoords.length > 1 && (
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

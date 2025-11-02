import { StyleSheet, View, Image, Pressable } from "react-native";
import React, { useState, useEffect } from "react";

import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";

import Feather from "@expo/vector-icons/Feather";

import { darkMapStyle } from "../../data/map.dark";

import RideRouteModal from "../../components/RideRouteModal";
import Notification from "../../components/Notification";

import { useNotificationContext } from "../../context/NotificationContext";
import { useMapContext } from "../../context/MapContext";

import { useLoading } from "../../context/LoadingContext";
import AppLoading from "../../loadings/AppLoading";
import { useRideContext } from "../../context/RideContext";
import { useAuthContext } from "../../context/AuthContext";
import { router } from "expo-router";

const BookRide = () => {
  const { notification } = useNotificationContext();
  const {
    region,
    getPlaceName,
    userAddress,
    destination,
    mapRef,
    mapPadding,
    locationLoading,
  } = useMapContext();
  const { signedIn } = useAuthContext();
  const {
    rideStatus,
    setRideStatus,
    ongoingRideData,
    resetRide,
    rideRouteCoords,
    ridePickupMarker,
    rideDestinationMarker,
  } = useRideContext();

  const { appLoading } = useLoading();

  useEffect(() => {
    getPlaceName(region.latitude, region.longitude);
  }, [region]);

  useEffect(() => {
    if (!region) return;

    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.animateToRegion(region, 1000);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [region, mapRef.current]);

  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  // Stop tracking changes after the marker has loaded
  const loadMap = () => {
    setTracksViewChanges(false);
  };

  // Note: marker coordinates update directly from context on each socket update
  <>
    {appLoading || locationLoading ? (
      <AppLoading />
    ) : (
      <>
        {notification.visible && <Notification notification={notification} />}
        <View style={{ backgroundColor: "#121212", flex: 1 }}>
          {/* Map */}
          {region && (
            <MapView
              ref={mapRef}
              onMapLoaded={loadMap}
              style={{ ...StyleSheet.absoluteFillObject }}
              provider={PROVIDER_GOOGLE}
              initialRegion={region}
              customMapStyle={darkMapStyle}
              mapPadding={mapPadding}
            >
              {/* Default user location marker - show when no route is set */}
              {rideRouteCoords.length === 0 &&
                rideStatus !== "track_driver" &&
                rideStatus !== "track_ride" && (
                  <Marker
                    coordinate={region}
                    title={userAddress}
                    anchor={{ x: 0.2, y: 0.2 }}
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
                )}

              {/* Pickup marker - show when route is available */}
              {rideRouteCoords.length > 0 &&
                rideStatus !== "track_driver" &&
                rideStatus !== "track_ride" && (
                  <Marker
                    coordinate={ridePickupMarker || rideRouteCoords[0]}
                    title={userAddress}
                    anchor={{ x: 0.2, y: 0.2 }}
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
                )}

              {/* Destination marker - show when route is available */}
              {rideRouteCoords.length > 0 &&
                destination &&
                rideStatus !== "track_driver" &&
                rideStatus !== "track_ride" && (
                  <Marker
                    coordinate={
                      rideDestinationMarker ||
                      rideRouteCoords[rideRouteCoords.length - 1]
                    }
                    title={destination}
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

              {/* Driver marker - show when tracking driver */}
              {rideStatus === "track_driver" && ongoingRideData && (
                <Marker
                  coordinate={{
                    latitude:
                      ongoingRideData.driver.current_location.coordinates[0],
                    longitude:
                      ongoingRideData.driver.current_location.coordinates[1],
                  }}
                  title={"Your driver is here!"}
                  anchor={{ x: 0.2, y: 0.2 }}
                  tracksViewChanges={false}
                >
                  <Image
                    source={require("../../assets/images/user.png")}
                    style={{ height: 35, width: 35, borderRadius: 50 }}
                  />
                </Marker>
              )}

              {/* User marker - show when tracking ride */}
              {rideStatus === "track_ride" && ongoingRideData && (
                <Marker
                  coordinate={{
                    latitude:
                      ongoingRideData.driver.current_location.coordinates[0],
                    longitude:
                      ongoingRideData.driver.current_location.coordinates[1],
                  }}
                  title={"You are here!"}
                  anchor={{ x: 0.2, y: 0.2 }}
                  tracksViewChanges={false}
                >
                  <Image
                    source={
                      signedIn?.profile_pic
                        ? { uri: signedIn.profile_pic }
                        : require("../../assets/images/black-profile.jpeg")
                    }
                    style={{
                      height: 35,
                      width: 35,
                      borderRadius: 50,
                      borderWidth: 1,
                      borderColor: "#fff",
                    }}
                  />
                </Marker>
              )}

              {/* Route polyline - show when route is available */}
              {rideRouteCoords.length > 0 &&
                rideStatus !== "track_driver" &&
                rideStatus !== "track_ride" && (
                  <Polyline
                    coordinates={rideRouteCoords}
                    strokeColor="#fff"
                    strokeWidth={2}
                  />
                )}
            </MapView>
          )}

          {/* Nav */}
          <View style={styles.nav_container}>
            {(() => {
              const hiddenStatuses = [
                "searching",
                "accepted",
                "pay",
                "paid",
                "rating",
              ];
              if (hiddenStatuses.includes(rideStatus as any)) return null;

              return (
                <Pressable
                  onPress={() => {
                    // ordered modal flow - used for stepping back through statuses
                    const modalOrder = [
                      "",
                      "booking",
                      "choosing_car",
                      "searching",
                      "accepted",
                      "track_driver",
                      "pay",
                      "paying",
                      "paid",
                      "track_ride",
                      "rating",
                    ];

                    if (rideStatus === undefined || rideStatus === "") {
                      // no previous modal status - go to home
                      router.push("../(tabs)/home");
                      return;
                    }

                    const idx = modalOrder.indexOf(rideStatus as any);
                    if (idx > 0) {
                      const prev = modalOrder[idx - 1];
                      setRideStatus(prev as any);
                      if (prev === "") {
                        // moving back to start - reset ride state
                        resetRide();
                      }
                    } else {
                      router.push("../(tabs)/home");
                    }
                  }}
                  style={styles.nav_box}
                >
                  <Feather name="arrow-left" size={22} color="white" />
                </Pressable>
              );
            })()}
          </View>

          {/* Choose route Modal */}
          <RideRouteModal />
        </View>
      </>
    )}
  </>;
};

export default BookRide;

const styles = StyleSheet.create({
  nav_container: {
    width: "100%",
    paddingHorizontal: 20,
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

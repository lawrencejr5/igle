import { StyleSheet, View, Pressable } from "react-native";
import React, { useState, useEffect, useRef } from "react";

import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";

import Notification from "../../components/Notification";

import { useNotificationContext } from "../../context/NotificationContext";
import { useMapContext } from "../../context/MapContext";

import { router } from "expo-router";

import { darkMapStyle } from "../../data/map.dark";

import Feather from "@expo/vector-icons/Feather";
import DeliveryRouteModal from "../../components/DeliveryRouteModal";
import { useDeliverContext } from "../../context/DeliveryContext";

const BookDelivery = () => {
  const { notification } = useNotificationContext();
  const { region, userAddress, mapRef, mapPadding } = useMapContext();
  const {
    deliveryStatus,
    setDeliveryStatus,
    ongoingDeliveryData,
    deliveryData,
    deliveryRouteCoords,
    deliveryPickupMarker,
    deliveryDropoffMarker,
  } = useDeliverContext();

  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  // Stop tracking changes after the marker has loaded
  const loadMap = () => {
    setTracksViewChanges(false);
  };

  useEffect(() => {
    if (!region) return;

    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.animateToRegion(region, 1000);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [region, mapRef.current]);
  return (
    <>
      {notification.visible && <Notification notification={notification} />}
      <View style={{ flex: 1, backgroundColor: "#121212" }}>
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
            {/* Default user location marker - show when no delivery route is set */}
            {deliveryRouteCoords.length === 0 &&
              deliveryStatus !== "track_driver" &&
              deliveryStatus !== "track_delivery" && (
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

            {/* Delivery pickup marker - matches ride pickup design */}
            {deliveryRouteCoords.length > 0 &&
              deliveryStatus !== "track_driver" &&
              deliveryStatus !== "track_delivery" &&
              deliveryPickupMarker &&
              (deliveryData?.pickup?.address ||
                ongoingDeliveryData?.pickup?.address) && (
                <Marker
                  coordinate={deliveryPickupMarker}
                  title={
                    deliveryData?.pickup.address ||
                    ongoingDeliveryData?.pickup.address
                  }
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

            {/* Delivery dropoff marker - matches ride destination design */}
            {deliveryRouteCoords.length > 0 &&
              deliveryStatus !== "track_driver" &&
              deliveryStatus !== "track_delivery" &&
              deliveryDropoffMarker &&
              (deliveryData?.dropoff?.address ||
                ongoingDeliveryData?.dropoff?.address) && (
                <Marker
                  coordinate={deliveryDropoffMarker}
                  title={
                    deliveryData?.dropoff?.address ||
                    ongoingDeliveryData?.dropoff?.address
                  }
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

            {/* Delivery route polyline - matches ride polyline design */}
            {deliveryPickupMarker &&
              deliveryDropoffMarker &&
              deliveryStatus !== "track_driver" &&
              deliveryStatus !== "track_delivery" &&
              (deliveryData?.dropoff?.address ||
                ongoingDeliveryData?.dropoff?.address) && (
                <Polyline
                  coordinates={deliveryRouteCoords}
                  strokeColor="#fff"
                  strokeWidth={2}
                />
              )}

            {/* Driver marker - show when tracking driver */}
            {deliveryStatus === "track_driver" && ongoingDeliveryData && (
              <Marker
                coordinate={{
                  latitude:
                    ongoingDeliveryData.driver.current_location.coordinates[0],
                  longitude:
                    ongoingDeliveryData.driver.current_location.coordinates[1],
                }}
                title={"Your dispatch rider is here!"}
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

            {/* Driver marker - show when tracking delivery progress */}
            {deliveryStatus === "track_delivery" && ongoingDeliveryData && (
              <Marker
                coordinate={{
                  latitude:
                    ongoingDeliveryData.driver.current_location.coordinates[0],
                  longitude:
                    ongoingDeliveryData.driver.current_location.coordinates[1],
                }}
                title={"Your package is on the move"}
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
          </MapView>
        )}

        <View style={styles.nav_container}>
          {(() => {
            // Only show back button for specific delivery statuses
            const allowedStatuses = [
              "",
              "details",
              "route",
              "vehicle",
              "track_driver",
              "paying",
              "track_delivery",
            ];

            if (!allowedStatuses.includes(deliveryStatus as any)) return null;

            return (
              <Pressable
                onPress={() => {
                  // ordered modal flow - used for stepping back through statuses
                  const modalOrder = [
                    "",
                    "details",
                    "route",
                    "vehicle",
                    "searching",
                    "expired",
                    "accepted",
                    "track_driver",
                    "arrived",
                    "paying",
                    "paid",
                    "picked_up",
                    "in_transit",
                    "track_delivery",
                    "rating",
                  ];

                  if (!deliveryStatus) {
                    // no previous modal status - go to home
                    router.push("../(tabs)/home");
                    return;
                  }

                  const idx = modalOrder.indexOf(deliveryStatus as any);
                  if (idx > 0) {
                    const prev = modalOrder[idx - 1];
                    setDeliveryStatus(prev as any);
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

        <DeliveryRouteModal />
      </View>
    </>
  );
};

export default BookDelivery;

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

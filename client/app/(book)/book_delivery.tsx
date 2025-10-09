import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  Image,
  Pressable,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";

import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";

import Notification from "../../components/Notification";

import { useNotificationContext } from "../../context/NotificationContext";
import { useMapContext } from "../../context/MapContext";

import { useLoading } from "../../context/LoadingContext";
import AppLoading from "../../loadings/AppLoading";
import { useRideContext } from "../../context/RideContext";
import { useAuthContext } from "../../context/AuthContext";
import { router } from "expo-router";

import { darkMapStyle } from "../../data/map.dark";

import Feather from "@expo/vector-icons/Feather";
import DeliveryRouteModal from "../../components/DeliveryRouteModal";

const BookDelivery = () => {
  const { notification } = useNotificationContext();
  const {
    region,
    getPlaceName,
    userAddress,
    destination,
    pickupMarker,
    destinationMarker,
    routeCoords,
    mapRef,
    mapPadding,
    locationLoading,
  } = useMapContext();
  const { signedIn } = useAuthContext();

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
      <View style={{ flex: 1, backgroundColor: "#121212" }}>
        {region && (
          <MapView
            ref={mapRef}
            style={{ ...StyleSheet.absoluteFillObject }}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            customMapStyle={darkMapStyle}
            mapPadding={mapPadding}
          >
            <Marker
              coordinate={routeCoords.length > 0 ? routeCoords[0] : region}
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
          </MapView>
        )}

        <View style={styles.nav_container}>
          <Pressable
            onPress={() => {
              // ordered modal flow - used for stepping back through statuses

              router.push("../(tabs)/home");
            }}
            style={styles.nav_box}
          >
            <Feather name="arrow-left" size={22} color="white" />
          </Pressable>
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

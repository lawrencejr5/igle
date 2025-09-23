import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";

import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";

import Feather from "@expo/vector-icons/Feather";

import { darkMapStyle } from "../../data/map.dark";

import SideNav from "../../components/SideNav";
import NotificationScreen from "../../components/screens/NotificationScreen";

import RouteModal from "../../components/RouteModal";
import Notification from "../../components/Notification";

import { useNotificationContext } from "../../context/NotificationContext";
import { useMapContext } from "../../context/MapContext";

import { useLoading } from "../../context/LoadingContext";
import AppLoading from "../../loadings/AppLoading";
import { useRideContext } from "../../context/RideContext";
import DriverMarker from "../../components/DriverMarker";
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
  const { rideStatus, ongoingRideData } = useRideContext();

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

  return (
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
                {rideStatus !== "track_driver" &&
                rideStatus !== "track_ride" ? (
                  <Marker
                    tracksViewChanges={tracksViewChanges}
                    coordinate={
                      routeCoords.length > 0 ? routeCoords[0] : region
                    }
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
                ) : (
                  <>
                    {rideStatus === "track_driver" && ongoingRideData && (
                      <Marker
                        coordinate={{
                          latitude:
                            ongoingRideData.driver.current_location
                              .coordinates[0],
                          longitude:
                            ongoingRideData.driver.current_location
                              .coordinates[1],
                        }}
                        title={"Your driver is here!"}
                        anchor={{ x: 0.2, y: 0.2 }}
                      >
                        <Image
                          source={require("../../assets/images/user.png")}
                          style={{ height: 35, width: 35, borderRadius: 50 }}
                        />
                      </Marker>
                    )}
                    {rideStatus === "track_ride" && ongoingRideData && (
                      <Marker
                        coordinate={{
                          latitude: ongoingRideData.pickup.coordinates[0],
                          longitude: ongoingRideData.pickup.coordinates[1],
                        }}
                        title={"You are here!"}
                        anchor={{ x: 0.2, y: 0.2 }}
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
                  </>
                )}

                {routeCoords.length > 0 &&
                  destination &&
                  rideStatus !== "track_driver" &&
                  rideStatus !== "track_ride" && (
                    <Marker
                      coordinate={routeCoords[routeCoords.length - 1]}
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

                {pickupMarker &&
                  destinationMarker &&
                  destination &&
                  rideStatus !== "track_driver" &&
                  rideStatus !== "track_ride" && (
                    <Polyline
                      coordinates={routeCoords}
                      strokeColor="#fff"
                      strokeWidth={2}
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
              <TouchableWithoutFeedback
                onPress={() => setOpenNotification(true)}
              >
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
      )}
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

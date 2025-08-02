import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useState, useEffect } from "react";

import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import AntDesign from "@expo/vector-icons/AntDesign";
import { darkMapStyle } from "../../../data/map.dark";

import * as Location from "expo-location";
import { router } from "expo-router";
import RideRoute from "../../../components/ride_route";

const RideDetails = () => {
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
    <View
      style={{
        flex: 1,
        backgroundColor: "#121212",
      }}
    >
      {/* Back btn */}
      <TouchableWithoutFeedback onPress={() => router.back()}>
        <View
          style={{
            backgroundColor: "#121212",
            gap: 20,
            position: "absolute",
            zIndex: 1,
            padding: 10,
            borderRadius: 7,
            marginTop: 50,
            marginHorizontal: 20,
          }}
        >
          <AntDesign name="arrowleft" size={24} color="#fff" />
        </View>
      </TouchableWithoutFeedback>

      {/* Map */}
      <MapView
        style={{ height: "35%" }}
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
          />
        )}
      </MapView>

      {/* Ride details */}
      <ScrollView style={{ marginTop: 20, paddingHorizontal: 20 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Image
            source={require("../../../assets/images/icons/keke-icon.png")}
            style={{ width: 50, height: 50 }}
          />
          <View>
            <Text
              style={{
                fontFamily: "raleway-semibold",
                color: "#c6c5c5ff",
                fontSize: 20,
              }}
            >
              Monday, Dec 25, 2025
            </Text>
          </View>
        </View>

        {/* Ride details section */}
        <View
          style={{
            marginTop: 20,
            paddingTop: 20,
            borderColor: "#c3c3c3ff",
            borderTopWidth: 0.5,
            borderStyle: "solid",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontFamily: "raleway-semibold",
              fontSize: 22,
            }}
          >
            Ride details
          </Text>
          <View>
            <RideRoute from="Anglican girls grammar school" to="Konwea Plaza" />
          </View>
        </View>

        {/* Fare */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontFamily: "raleway-regular",
              fontSize: 18,
            }}
          >
            Total Fare:
          </Text>
          <Text
            style={{
              color: "#41ae0a",
              fontFamily: "poppins-bold",
              fontSize: 20,
            }}
          >
            500 NGN
          </Text>
        </View>

        {/* Driver section */}
        <View
          style={{
            marginTop: 20,
            paddingTop: 20,
            borderColor: "#c3c3c3ff",
            borderTopWidth: 0.5,
            borderStyle: "solid",
          }}
        >
          {/* Header */}
          <Text
            style={{
              color: "#fff",
              fontFamily: "raleway-semibold",
              fontSize: 22,
            }}
          >
            Driver Details
          </Text>

          {/* Driver card */}
          <View
            style={{
              marginTop: 20,
              backgroundColor: "#393939ff",
              paddingHorizontal: 15,
              paddingVertical: 10,
              borderRadius: 10,
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            {/* Driver image */}
            <Image
              source={require("../../../assets/images/black-profile.jpeg")}
              style={{ height: 50, width: 50, borderRadius: 25 }}
            />

            {/* Driver details */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flex: 1,
              }}
            >
              {/* Driver name and ride */}
              <View>
                {/* Driver name and verified icon */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontFamily: "raleway-semibold" }}
                  >
                    Oputa Chidubem
                  </Text>
                  <Image
                    source={require("../../../assets/images/icons/verify-icon.png")}
                    style={{ height: 18, width: 18 }}
                  />
                </View>

                {/* Driver ride */}
                <Text
                  style={{
                    color: "#d0d0d0",
                    fontFamily: "raleway-regular",
                    fontSize: 12,
                    marginTop: 5,
                  }}
                >
                  Keke na Pep
                </Text>
              </View>

              {/* Ratings and reviews */}
              <View style={{ alignItems: "flex-end" }}>
                {/* Rating */}
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "poppins-regular",
                    }}
                  >
                    5
                  </Text>
                  <Image
                    source={require("../../../assets/images/icons/star-icon.png")}
                    style={{ height: 12, width: 12, marginBottom: 5 }}
                  />
                </View>
                {/* Reviews */}
                <Text
                  style={{
                    color: "#d0d0d0",
                    fontFamily: "raleway-regular",
                    fontSize: 12,
                  }}
                >
                  18 reviews
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default RideDetails;

import {
  Image,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useState, useEffect, FC } from "react";

import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import AntDesign from "@expo/vector-icons/AntDesign";
import { darkMapStyle } from "../../../data/map.dark";

import { router } from "expo-router";
import RideRoute from "../../../components/RideRoute";
import DriverCard from "../../../components/DriverCard";
import { useMapContext } from "../../../context/MapContext";

const RideDetails = () => {
  const { region } = useMapContext();

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
        style={{ height: "33%" }}
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

      {/* Ride details */}
      <ScrollView
        style={{
          marginTop: 20,
          paddingHorizontal: 20,
          paddingTop: 20,
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: "68%",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: "#121212",
        }}
      >
        <View style={{ marginBottom: 50 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Image
              source={require("../../../assets/images/icons/sedan-icon.png")}
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
                Igle ride with Nyash
              </Text>
              <Text
                style={{
                  fontFamily: "raleway-regular",
                  color: "#c6c5c5ff",
                  fontSize: 12,
                  textAlign: "right",
                }}
              >
                Thur, August 28
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
              <RideRoute
                from="Anglican girls grammar school"
                to="Konwea Plaza"
              />
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
                color: "#fff",
                fontFamily: "poppins-bold",
                fontSize: 20,
              }}
            >
              NGN 500
            </Text>
          </View>

          {/* Driver section */}
          <View
            style={{
              marginTop: 20,
              paddingTop: 20,
              borderColor: "#c3c3c3ff",
              borderTopWidth: 0.5,
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
            <DriverCard name="Bombom Nyash" />
          </View>
          {/* Timeline section */}
          <View
            style={{
              marginTop: 20,
              paddingTop: 20,
              borderColor: "#c3c3c3",
              borderTopWidth: 0.5,
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
              Ride timeline
            </Text>

            <View style={{ marginTop: 10 }}>
              <Timeline header="booked at" time="28 August, 2025, 2:51 pm" />
              <Timeline header="accepted at" time="28 August, 2025, 3:00 pm" />
              <Timeline header="started at" time="28 August, 2025, 3:07 pm" />
              <Timeline header="completed at" time="28 August, 2025, 3:50 pm" />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const TimeLineThread = () => {
  return (
    <View
      style={{
        width: 10,
        marginTop: 0,
        alignItems: "center",
      }}
    >
      <View
        style={{
          backgroundColor: "#fff",
          width: 10,
          height: 10,
          borderRadius: 10,
        }}
      />
      <View
        style={{
          height: 35,
          borderColor: "#fff",
          borderStyle: "dashed",
          borderLeftWidth: 1,
        }}
      />
    </View>
  );
};

const Timeline: FC<{ header: string; time: string }> = ({ header, time }) => {
  return (
    <View style={{ flexDirection: "row" }}>
      <TimeLineThread />
      <View style={{ marginTop: 0, marginLeft: 10 }}>
        <Text
          style={{
            color: "#d7d7d7",
            fontFamily: "raleway-bold",
            fontSize: 10,
            textTransform: "capitalize",
          }}
        >
          {`${header}:`}
        </Text>
        <Text
          style={{
            color: "#d7d7d7",
            fontFamily: "poppins-regular",
            fontSize: 12,
          }}
        >
          {time}
        </Text>
      </View>
    </View>
  );
};

export default RideDetails;

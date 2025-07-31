import { StyleSheet, Text, View, TextInput } from "react-native";
import React, { useState, useEffect } from "react";

import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import EvilIcons from "@expo/vector-icons/EvilIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Feather from "@expo/vector-icons/Feather";

import { darkMapStyle } from "../../data/map.dark";

import * as Location from "expo-location";

const Home = () => {
  const [region, setRegion] = useState<any>(null);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  return (
    <View style={{ backgroundColor: "#121212", flex: 1 }}>
      {/* Map */}
      <MapView
        style={{ height: "85%" }}
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
      {/* Nav */}
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          paddingHorizontal: 20,
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 1,
          position: "absolute",
          top: 50,
        }}
      >
        <View
          style={{
            width: 45,
            height: 45,
            backgroundColor: "#121212",
            borderRadius: 7,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="menu" size={22} color="white" />
        </View>
        <View
          style={{
            width: 45,
            height: 45,
            backgroundColor: "#121212",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 7,
          }}
        >
          <Feather name="bell" size={22} color="white" />
        </View>
      </View>
      {/* Modal */}
      <View
        style={{
          height: "20%",
          width: "100%",
          backgroundColor: "#121212",
          position: "absolute",
          bottom: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: 20,
          paddingTop: 12,
        }}
      >
        {/* Expand line */}
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              height: 5,
              width: 40,
              borderRadius: 10,
              backgroundColor: "grey",
            }}
          />
        </View>

        {/* Header text */}
        <Text
          style={{
            fontFamily: "raleway-bold",
            color: "#fff",
            fontSize: 20,
            marginTop: 10,
          }}
        >
          Let's go places...
        </Text>

        {/* Form */}
        <View>
          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <TextInput
              placeholder="Where we dey go?"
              placeholderTextColor={"grey"}
              editable={false}
              style={{
                backgroundColor: "#3f3f3f",
                borderBottomWidth: 0,
                outlineWidth: 0,
                marginTop: 20,
                borderRadius: 7,
                flex: 1,
                fontFamily: "raleway-bold",
                fontSize: 18,
                paddingHorizontal: 10,
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default Home;

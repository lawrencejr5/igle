import { StyleSheet, Text, View } from "react-native";
import React, { useState, useEffect } from "react";

import MapView, { Marker } from "react-native-maps";

import { darkStyle } from "../../data/map.dark";

import * as Location from "expo-location";

const Home = () => {
  const [ready, setReady] = useState(false);

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

  useEffect(() => {
    const timeout = setTimeout(() => setReady(true), 100); // wait 100ms
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={{ backgroundColor: "#121212", flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        customMapStyle={darkStyle}
      >
        <Marker
          coordinate={{ latitude: 6.5244, longitude: 3.3792 }}
          title="You are here"
        />
      </MapView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

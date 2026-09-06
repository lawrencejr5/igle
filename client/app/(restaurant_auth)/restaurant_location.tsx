import {
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import React, { useRef, useState } from "react";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { driver_reg_styles } from "../../styles/driver_reg_styles";
import { darkMapStyle } from "../../data/map.dark";

const RADIUS_OPTIONS = [1, 2, 3, 5, 7, 10, 15, 20];

const RestaurantLocation = () => {
  const styles = driver_reg_styles();
  const mapRef = useRef<MapView>(null);

  const [streetAddress, setStreetAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [deliveryRadius, setDeliveryRadius] = useState(5);

  const [pinCoords, setPinCoords] = useState({
    latitude: 6.5244,
    longitude: 3.3792,
  });

  const initialRegion = {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const handleNext = () => {
    router.push("/(restaurant_auth)/restaurant_bank");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#121212" }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.header_text}>Restaurant Registration</Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/home")}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text
              style={{
                color: "#ff453a",
                fontFamily: "raleway-bold",
                fontSize: 14,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress — step 2 of 4 */}
        <View style={styles.progress_bar_container}>
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#484848" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#484848" }]} />
        </View>

        <ScrollView
          style={{ flex: 1, backgroundColor: "#121212" }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={{ marginTop: 20 }}>
            <Text style={styles.form_header_text}>Restaurant Location</Text>
            <Text style={styles.form_subheader_text}>
              Help customers find you — drop a pin on the map and fill in your
              address
            </Text>
          </View>

          {/* ── Map Pin Drop ── */}
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.inp_label, { marginBottom: 8 }]}>
              Drop a Pin on Your Location
            </Text>
            <View style={localStyles.map_container}>
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                provider={PROVIDER_GOOGLE}
                initialRegion={initialRegion}
                customMapStyle={darkMapStyle}
                onPress={(e) => setPinCoords(e.nativeEvent.coordinate)}
              >
                <Marker
                  coordinate={pinCoords}
                  draggable
                  onDragEnd={(e) => setPinCoords(e.nativeEvent.coordinate)}
                >
                  <View style={localStyles.pin_marker}>
                    <Feather name="map-pin" size={20} color="#fff" />
                  </View>
                </Marker>
              </MapView>
              <View style={localStyles.map_hint_badge}>
                <Feather name="info" size={12} color="#aaa" />
                <Text style={localStyles.map_hint_text}>
                  Tap map or drag pin to set location
                </Text>
              </View>
            </View>

            {/* Coords display */}
            <View style={localStyles.coords_row}>
              <View style={localStyles.coord_box}>
                <Text style={localStyles.coord_label}>Latitude</Text>
                <Text style={localStyles.coord_value}>
                  {pinCoords.latitude.toFixed(6)}
                </Text>
              </View>
              <View style={localStyles.coord_box}>
                <Text style={localStyles.coord_label}>Longitude</Text>
                <Text style={localStyles.coord_value}>
                  {pinCoords.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Street Address ── */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Street Address</Text>
            <View style={styles.inp_holder}>
              <Feather name="map-pin" size={18} color="white" />
              <TextInput
                style={styles.text_input}
                placeholder="e.g. 88 Isaac John Street, Ikeja GRA"
                placeholderTextColor="#c5c5c5"
                value={streetAddress}
                onChangeText={setStreetAddress}
              />
            </View>
          </View>

          {/* ── Landmark ── */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Nearest Landmark</Text>
            <View style={styles.inp_holder}>
              <Feather name="navigation" size={18} color="white" />
              <TextInput
                style={styles.text_input}
                placeholder="e.g. Beside Access Bank, opposite Shoprite"
                placeholderTextColor="#c5c5c5"
                value={landmark}
                onChangeText={setLandmark}
              />
            </View>
          </View>

          {/* ── Delivery Radius ── */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Delivery Radius Limit</Text>
            <Text
              style={[
                styles.form_subheader_text,
                { marginTop: 4, marginBottom: 10 },
              ]}
            >
              Maximum distance you are willing to serve customers
            </Text>
            <View style={localStyles.radius_grid}>
              {RADIUS_OPTIONS.map((km) => (
                <TouchableOpacity
                  key={km}
                  style={[
                    localStyles.radius_chip,
                    deliveryRadius === km && localStyles.radius_chip_selected,
                  ]}
                  onPress={() => setDeliveryRadius(km)}
                >
                  <Text
                    style={[
                      localStyles.radius_chip_text,
                      deliveryRadius === km &&
                        localStyles.radius_chip_text_selected,
                    ]}
                  >
                    {km} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Next Button */}
        <View
          style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 }}
        >
          <TouchableWithoutFeedback onPress={handleNext}>
            <View style={styles.sign_btn}>
              <Text style={styles.sign_btn_text}>Next: Bank Details</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RestaurantLocation;

// ─── Local Styles ──────────────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  map_container: {
    height: 240,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#2a2a2a",
  },
  pin_marker: {
    backgroundColor: "#121212",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  map_hint_badge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#121212cc",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  map_hint_text: {
    color: "#aaa",
    fontFamily: "raleway-regular",
    fontSize: 11,
  },
  coords_row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  coord_box: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  coord_label: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 10,
    marginBottom: 3,
    letterSpacing: 0.4,
  },
  coord_value: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  radius_grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  radius_chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  radius_chip_selected: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  radius_chip_text: {
    color: "#aaa",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  radius_chip_text_selected: {
    color: "#121212",
  },
});

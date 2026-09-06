import axios from "axios";
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
  Modal,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Location from "expo-location";
import { driver_reg_styles } from "../../styles/driver_reg_styles";
import { darkMapStyle } from "../../data/map.dark";

const RADIUS_OPTIONS = [1, 2, 3, 5, 7, 10, 15, 20];
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API;

interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const RestaurantLocation = () => {
  const styles = driver_reg_styles();
  const mapRef = useRef<MapView>(null);
  const fullMapRef = useRef<MapView>(null);

  const [streetAddress, setStreetAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [deliveryRadius, setDeliveryRadius] = useState(5);

  const [pinCoords, setPinCoords] = useState({
    latitude: 6.2059, // Asaba default fallback
    longitude: 6.6959,
  });

  // Modal map state
  const [showFullMap, setShowFullMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<GooglePlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddressText, setSelectedAddressText] = useState("");
  const [tempCoords, setTempCoords] = useState({
    latitude: 6.2059,
    longitude: 6.6959,
  });

  // Automatically fetch user's current location on mount
  useEffect(() => {
    getUserCurrentLocation();
  }, []);

  const getUserCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      const current = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setPinCoords(current);
      setTempCoords(current);
      fetchAddressForCoords(current);
    } catch (err) {
      console.log("Error getting user location:", err);
    }
  };

  // Reverse geocode coords to get readable address string
  const fetchAddressForCoords = async (coords: { latitude: number; longitude: number }) => {
    try {
      if (API_KEY) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${API_KEY}`;
        const { data } = await axios.get(url);
        if (data.results && data.results.length > 0) {
          const formatted = data.results[0].formatted_address;
          setSelectedAddressText(formatted);
          return formatted;
        }
      }
      const addresses = await Location.reverseGeocodeAsync(coords);
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const formatted = [addr.name || addr.streetNumber, addr.street, addr.district || addr.subregion, addr.city]
          .filter(Boolean)
          .join(", ");
        setSelectedAddressText(formatted || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
        return formatted;
      }
    } catch (err) {
      console.log("Reverse geocode error:", err);
    }
    setSelectedAddressText(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
    return "";
  };

  const openFullMap = () => {
    setTempCoords(pinCoords);
    setShowFullMap(true);
    fetchAddressForCoords(pinCoords);
  };

  const confirmLocation = () => {
    setPinCoords(tempCoords);
    setShowFullMap(false);
    if (selectedAddressText) {
      setStreetAddress(selectedAddressText);
    }
    mapRef.current?.animateToRegion({
      ...tempCoords,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleMapPointChange = (coords: { latitude: number; longitude: number }) => {
    Keyboard.dismiss();
    setTempCoords(coords);
    fetchAddressForCoords(coords);
  };

  // Fetch Google Places Autocomplete Suggestions (matching MapContext.tsx getSuggestions pattern)
  const handleSearchTextChange = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearching(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        text
      )}&key=${API_KEY}&location=${tempCoords.latitude},${
        tempCoords.longitude
      }&radius=10000&components=country:ng`;

      const { data } = await axios.get(url);
      if (data && data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.log("Google Places autocomplete error:", error);
    } finally {
      setSearching(false);
    }
  };

  // Fetch Place details (lat/lng) on suggestion click (matching MapContext.tsx getPlaceCoords pattern)
  const selectSuggestion = async (item: GooglePlacePrediction) => {
    Keyboard.dismiss();
    const mainText = item.structured_formatting.main_text;
    const fullText = item.description;
    setSearchQuery(fullText);
    setSelectedAddressText(fullText);
    setShowSuggestions(false);

    try {
      setSearching(true);
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&key=${API_KEY}`;
      const { data } = await axios.get(url);
      if (data.result && data.result.geometry) {
        const location = data.result.geometry.location;
        const newCoords = {
          latitude: location.lat,
          longitude: location.lng,
        };
        setTempCoords(newCoords);
        fullMapRef.current?.animateToRegion({
          ...newCoords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (err) {
      console.log("Place details error:", err);
    } finally {
      setSearching(false);
    }
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

          {/* ── Map Preview Box (Clickable to open full screen map) ── */}
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.inp_label, { marginBottom: 8 }]}>
              Location Map Pin Drop
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={openFullMap}
              style={localStyles.map_container}
            >
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  ...pinCoords,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                customMapStyle={darkMapStyle}
                pointerEvents="none"
              >
                <Marker coordinate={pinCoords}>
                  <View style={localStyles.pin_marker}>
                    <Feather name="map-pin" size={20} color="#fff" />
                  </View>
                </Marker>
              </MapView>
              
              <View style={localStyles.map_overlay_badge}>
                <Feather name="maximize-2" size={14} color="#fff" />
                <Text style={localStyles.map_overlay_text}>
                  Tap to open full screen map & search
                </Text>
              </View>
            </TouchableOpacity>

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
            <TouchableOpacity onPress={openFullMap}>
              <View style={[styles.inp_holder, { opacity: 0.9 }]}>
                <Feather name="map-pin" size={18} color="white" />
                <TextInput
                  style={[styles.text_input, { color: streetAddress ? "#fff" : "#c5c5c5" }]}
                  placeholder="Select location on map to set address..."
                  placeholderTextColor="#c5c5c5"
                  value={streetAddress}
                  editable={false}
                  pointerEvents="none"
                />
              </View>
            </TouchableOpacity>
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

      {/* ── Full Screen Map Modal ── */}
      <Modal
        visible={showFullMap}
        animationType="slide"
        onRequestClose={() => setShowFullMap(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#121212" }}>
          {/* Full Screen Map */}
          <MapView
            ref={fullMapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              ...tempCoords,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            customMapStyle={darkMapStyle}
            onPress={(e) => handleMapPointChange(e.nativeEvent.coordinate)}
          >
            <Marker
              coordinate={tempCoords}
              draggable
              onDragEnd={(e) => handleMapPointChange(e.nativeEvent.coordinate)}
            >
              <View style={localStyles.pin_marker_large}>
                <Feather name="map-pin" size={24} color="#fff" />
              </View>
            </Marker>
          </MapView>

          {/* Top Search Bar & Suggestions Header */}
          <View style={localStyles.full_map_header}>
            <View style={localStyles.search_input_box}>
              <Feather name="search" size={18} color="#aaa" />
              <TextInput
                style={localStyles.search_input}
                placeholder="Search address or area..."
                placeholderTextColor="#777"
                value={searchQuery}
                onChangeText={handleSearchTextChange}
                returnKeyType="search"
              />
              {searching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : searchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                >
                  <Feather name="x" size={16} color="#aaa" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Suggestions Dropdown Card */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={localStyles.suggestions_card}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  style={{ maxHeight: 220 }}
                >
                  {suggestions.map((item) => (
                    <TouchableOpacity
                      key={item.place_id}
                      style={localStyles.suggestion_row}
                      onPress={() => selectSuggestion(item)}
                    >
                      <Feather name="map-pin" size={16} color="#aaa" style={{ marginTop: 2 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={localStyles.suggestion_title} numberOfLines={1}>
                          {item.structured_formatting?.main_text || item.description}
                        </Text>
                        <Text style={localStyles.suggestion_subtitle} numberOfLines={1}>
                          {item.structured_formatting?.secondary_text || item.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Floating Instructions Badge */}
          {!showSuggestions && (
            <View style={localStyles.full_map_badge}>
              <Feather name="info" size={14} color="#fff" />
              <Text style={localStyles.full_map_badge_text}>
                Tap map or drag marker to set precise location
              </Text>
            </View>
          )}

          {/* Bottom Confirmation Bar */}
          <View style={localStyles.full_map_bottom}>
            <View style={{ marginBottom: 14 }}>
              {/* Location Address */}
              <Text style={{ color: "#aaa", fontFamily: "raleway-semibold", fontSize: 11, letterSpacing: 0.3 }}>
                LOCATION ADDRESS
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "raleway-bold",
                  fontSize: 14,
                  marginTop: 2,
                  marginBottom: 8,
                }}
                numberOfLines={2}
              >
                {selectedAddressText || "Tap map to get location address"}
              </Text>

              {/* Coordinates */}
              <Text style={{ color: "#777", fontFamily: "raleway-semibold", fontSize: 10, letterSpacing: 0.3 }}>
                COORDINATES
              </Text>
              <Text style={{ color: "#aaa", fontFamily: "raleway-bold", fontSize: 12, marginTop: 2 }}>
                {tempCoords.latitude.toFixed(6)}, {tempCoords.longitude.toFixed(6)}
              </Text>
            </View>

            <TouchableOpacity style={localStyles.done_btn} onPress={confirmLocation}>
              <Text style={localStyles.done_btn_text}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RestaurantLocation;

// ─── Local Styles ──────────────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  map_container: {
    height: 200,
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
  pin_marker_large: {
    backgroundColor: "#121212",
    padding: 10,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: "#fff",
  },
  map_overlay_badge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#000000cc",
    paddingVertical: 10,
    borderRadius: 10,
  },
  map_overlay_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
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

  // Full Screen Map Modal
  full_map_header: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  search_input_box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1ecc",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#333",
    gap: 10,
  },
  search_input: {
    flex: 1,
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 14,
  },
  suggestions_card: {
    backgroundColor: "#1e1e1ef2",
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  suggestion_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#282828",
  },
  suggestion_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  suggestion_subtitle: {
    color: "#aaa",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 2,
  },
  full_map_badge: {
    position: "absolute",
    top: Platform.OS === "ios" ? 115 : 95,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#000000bb",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    zIndex: 10,
  },
  full_map_badge_text: {
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  full_map_bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#181818",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    zIndex: 10,
    borderTopWidth: 1,
    borderColor: "#282828",
  },
  done_btn: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    width: "100%",
  },
  done_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
});

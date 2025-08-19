import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useDriverAuthContext } from "../context/DriverAuthContext";
import { useDriverContext } from "../context/DriverContext";
import { darkMapStyle } from "../data/map.dark";

import { useNotificationContext } from "../context/NotificationContext";

interface LocationUpdateModalProps {
  visible: boolean;
  onClose: () => void;
}

const LocationUpdateModal: React.FC<LocationUpdateModalProps> = ({
  visible,
  onClose,
}) => {
  const { updateLocation } = useDriverContext();
  const [region, setRegion] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { showNotification } = useNotificationContext()!;

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showNotification("Permission denied", "error");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      setSelectedLocation([
        location.coords.latitude,
        location.coords.longitude,
      ]);
      setManualLat(location.coords.latitude.toString());
      setManualLng(location.coords.longitude.toString());
    } catch (error) {
      console.error("Error getting current location:", error);
      showNotification("Failed to get current location", "error");
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation([latitude, longitude]);
    setManualLat(latitude.toString());
    setManualLng(longitude.toString());
  };

  const handleManualInputChange = (type: "lat" | "lng", value: string) => {
    if (type === "lat") {
      setManualLat(value);
      const lat = parseFloat(value);
      if (!isNaN(lat) && selectedLocation) {
        setSelectedLocation([lat, selectedLocation[1]]);
      }
    } else {
      setManualLng(value);
      const lng = parseFloat(value);
      if (!isNaN(lng) && selectedLocation) {
        setSelectedLocation([selectedLocation[0], lng]);
      }
    }
  };

  const handleUpdateLocation = async () => {
    if (!selectedLocation) {
      showNotification("Please select a location first", "error");
      return;
    }

    setIsLoading(true);
    try {
      await updateLocation(selectedLocation);
      showNotification("Location updated successfully", "success");
      onClose();
    } catch (error) {
      showNotification("An error occured", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    getCurrentLocation();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Location</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {region && (
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={region}
              customMapStyle={darkMapStyle}
              onPress={handleMapPress}
            >
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation[0],
                    longitude: selectedLocation[1],
                  }}
                  title="Selected Location"
                  pinColor="#33b735"
                />
              )}
            </MapView>
          )}
        </View>

        {/* Manual Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Manual Coordinates</Text>
          <View style={styles.coordinateInputs}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={manualLat}
                onChangeText={(value) => handleManualInputChange("lat", value)}
                placeholder="Enter latitude"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={manualLng}
                onChangeText={(value) => handleManualInputChange("lng", value)}
                placeholder="Enter longitude"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={handleUseCurrentLocation}
          >
            <Ionicons name="location" size={20} color="#33b735" />
            <Text style={styles.currentLocationText}>Use Current Location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.updateButton,
              !selectedLocation && styles.updateButtonDisabled,
            ]}
            onPress={handleUpdateLocation}
            disabled={!selectedLocation || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.updateButtonText}>Update Location</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "raleway-bold",
  },
  placeholder: {
    width: 34,
  },
  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 15,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  inputSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "raleway-semibold",
    marginBottom: 15,
  },
  coordinateInputs: {
    flexDirection: "row",
    gap: 15,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    color: "#d7d7d7",
    fontSize: 12,
    fontFamily: "raleway-medium",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 14,
    fontFamily: "raleway-regular",
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 15,
  },
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#33b735",
    borderRadius: 25,
    paddingVertical: 15,
    gap: 10,
  },
  currentLocationText: {
    color: "#33b735",
    fontSize: 16,
    fontFamily: "raleway-semibold",
  },
  updateButton: {
    backgroundColor: "#33b735",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
  },
  updateButtonDisabled: {
    backgroundColor: "#666",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "raleway-bold",
  },
});

export default LocationUpdateModal;

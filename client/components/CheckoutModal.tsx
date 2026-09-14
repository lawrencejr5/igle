import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { Image } from "expo-image";
import {
  Feather,
  Entypo,
  FontAwesome,
  FontAwesome6,
  Ionicons,
} from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import axios from "axios";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useBasketContext } from "../context/BasketContext";
import { useFoodOrderContext } from "../context/FoodOrderContext";
import { useWalletContext } from "../context/WalletContext";
import { useAuthContext } from "../context/AuthContext";
import { useSavedPlaceContext } from "../context/SavedPlaceContext";
import { darkMapStyle } from "../data/map.dark";

interface Props {
  visible: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  onOrderPlacedSuccess: (orderId: string) => void;
}

interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const FLAT_DELIVERY_FEE = 1500;
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API;

const CheckoutModal: React.FC<Props> = ({
  visible,
  onClose,
  restaurantId,
  restaurantName,
  onOrderPlacedSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { basket, updateItemQuantity, clearBasket } = useBasketContext();
  const { placeFoodOrder, loading: orderLoading } = useFoodOrderContext();
  const { userWalletBal, getWalletBalance } = useWalletContext();
  const { signedIn } = useAuthContext();
  const {
    savedPlaces,
    homePlace,
    officePlace,
    getSavedPlaces,
    savePlace,
  } = useSavedPlaceContext();

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<[number, number]>([
    3.3792, 6.5244,
  ]);

  // Map View Overlay State (matching restaurant_location.tsx)
  const fullMapRef = useRef<MapView>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<GooglePlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddressText, setSelectedAddressText] = useState("");
  const [selectedSubText, setSelectedSubText] = useState("");
  const [placeHeaderLabel, setPlaceHeaderLabel] = useState("home");
  const [customHeader, setCustomHeader] = useState("");
  const [savingPlace, setSavingPlace] = useState(false);
  const [tempCoords, setTempCoords] = useState({
    latitude: 6.5244,
    longitude: 3.3792,
  });

  useEffect(() => {
    if (visible) {
      getWalletBalance("User");
      getSavedPlaces();
      if (signedIn) {
        setContactName(signedIn.name || "");
        setContactPhone(signedIn.phone || "");
      }
    } else {
      setShowMapModal(false);
    }
  }, [visible, signedIn]);

  // Auto-select first/default saved place when savedPlaces loads
  useEffect(() => {
    if (savedPlaces && savedPlaces.length > 0) {
      const existing = savedPlaces.find((p) => p._id === selectedPlaceId);
      if (!existing) {
        const defaultPlace = homePlace || officePlace || savedPlaces[0];
        selectPlace(defaultPlace);
      }
    }
  }, [savedPlaces]);

  const selectPlace = (place: any) => {
    setSelectedPlaceId(place._id);
    const fullAddr = place.place_sub_name
      ? `${place.place_name}, ${place.place_sub_name}`
      : place.place_name;
    setAddress(fullAddr);
    if (place.place_coords && place.place_coords.length === 2) {
      setSelectedCoords(place.place_coords);
    }
  };

  const getUserCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      const current = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setTempCoords(current);
      fetchAddressForCoords(current);
    } catch (err) {
      console.log("Error getting user location:", err);
    }
  };

  const fetchAddressForCoords = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    try {
      if (API_KEY) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${API_KEY}`;
        const { data } = await axios.get(url);
        if (data.results && data.results.length > 0) {
          const formatted = data.results[0].formatted_address;
          setSelectedAddressText(formatted);
          setSelectedSubText("");
          return formatted;
        }
      }
      const addresses = await Location.reverseGeocodeAsync(coords);
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const main = addr.name || addr.streetNumber || addr.street || "";
        const sub = [addr.district || addr.subregion, addr.city]
          .filter(Boolean)
          .join(", ");
        const formatted = [main, sub].filter(Boolean).join(", ");
        setSelectedAddressText(
          formatted || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
        );
        setSelectedSubText(sub);
        return formatted;
      }
    } catch (err) {
      console.log("Reverse geocode error:", err);
    }
    setSelectedAddressText(
      `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
    );
    setSelectedSubText("");
    return "";
  };

  const openMapModal = () => {
    const initCoords = {
      latitude: selectedCoords[1] || 6.5244,
      longitude: selectedCoords[0] || 3.3792,
    };
    setTempCoords(initCoords);
    setShowMapModal(true);
    getUserCurrentLocation();
  };

  const handleMapPointChange = (coords: {
    latitude: number;
    longitude: number;
  }) => {
    Keyboard.dismiss();
    setTempCoords(coords);
    fetchAddressForCoords(coords);
  };

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

  const selectSuggestion = async (item: GooglePlacePrediction) => {
    Keyboard.dismiss();
    const mainText = item.structured_formatting.main_text;
    const subText = item.structured_formatting.secondary_text || "";
    const fullText = item.description;
    setSearchQuery(fullText);
    setSelectedAddressText(mainText);
    setSelectedSubText(subText);
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

  const handleSaveMapLocation = async () => {
    if (!selectedAddressText.trim()) {
      Alert.alert("Required", "Please select a location on the map.");
      return;
    }

    const finalHeader =
      placeHeaderLabel === "other" && customHeader.trim()
        ? customHeader.trim().toLowerCase()
        : placeHeaderLabel;

    setSavingPlace(true);
    try {
      const coords: [number, number] = [
        tempCoords.longitude,
        tempCoords.latitude,
      ];
      const placeId = `custom_${Date.now()}`;
      const mainText = selectedAddressText;
      const subText = selectedSubText;

      await savePlace(finalHeader, placeId, mainText, subText, coords);
      await getSavedPlaces();

      const fullAddr = subText ? `${mainText}, ${subText}` : mainText;
      setAddress(fullAddr);
      setSelectedCoords(coords);

      setShowMapModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log("Error saving place from checkout:", error);
      Alert.alert("Error", "Could not save place. Please try again.");
    } finally {
      setSavingPlace(false);
    }
  };

  const items = basket?.items || [];
  const subtotal = basket?.subtotal || 0;
  const deliveryFee = subtotal > 0 ? FLAT_DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const hasInsufficientWallet = userWalletBal < total;

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert("Required", "Please select a valid delivery address.");
      return;
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert("Required", "Contact name and phone number are required.");
      return;
    }
    if (hasInsufficientWallet) {
      Alert.alert(
        "Insufficient Wallet Balance",
        `Order total is ₦${total.toLocaleString()}, but your balance is ₦${userWalletBal.toLocaleString()}. Please fund your wallet first.`
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const payload = {
      restaurant_id: restaurantId,
      delivery_address: {
        address: address.trim(),
        landmark: landmark.trim(),
        coordinates: selectedCoords,
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim(),
      },
      payment_method: "wallet" as const,
    };

    const newOrder = await placeFoodOrder(payload);
    if (newOrder) {
      await clearBasket(restaurantId);
      onClose();
      onOrderPlacedSuccess(newOrder._id);
    }
  };

  const renderPlaceIcon = (header: string, isSelected: boolean) => {
    const iconColor = isSelected ? "#fff" : "#9CA3AF";
    const lower = header.toLowerCase();
    if (lower === "home") {
      return <Entypo name="home" size={18} color={iconColor} />;
    } else if (lower === "office" || lower === "work") {
      return <FontAwesome name="briefcase" size={16} color={iconColor} />;
    } else {
      return <FontAwesome6 name="location-dot" size={16} color={iconColor} />;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)" }}
      >
        <View style={styles.modal_overlay}>
          <View
            style={[
              styles.modal_container,
              {
                paddingBottom: Platform.OS === "ios" ? insets.bottom + 16 : 24,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.header_title}>Review Order</Text>
                <Text style={styles.header_sub}>{restaurantName}</Text>
              </View>
              <TouchableOpacity style={styles.close_btn} onPress={onClose}>
                <Feather name="x" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.scroll_content}
            >
              {/* Basket Items List */}
              <View style={styles.card}>
                <View style={styles.card_header}>
                  <Text style={styles.card_title}>Order Summary</Text>
                  <Text style={styles.item_count}>{items.length} item(s)</Text>
                </View>

                {items.length === 0 ? (
                  <Text style={styles.empty_text}>Your basket is empty</Text>
                ) : (
                  items.map((item, idx) => {
                    const menuItemObj =
                      typeof item.menu_item === "object"
                        ? item.menu_item
                        : null;
                    const name = menuItemObj?.name || "Menu Item";
                    const image = menuItemObj?.image;

                    return (
                      <View key={item._id || idx} style={styles.item_row}>
                        {image ? (
                          <Image
                            source={{ uri: image }}
                            style={styles.item_thumb}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.item_thumb_placeholder}>
                            <Feather name="coffee" size={16} color="#777" />
                          </View>
                        )}

                        <View style={{ flex: 1 }}>
                          <Text style={styles.item_name}>{name}</Text>
                          {item.selected_options &&
                            item.selected_options.length > 0 && (
                              <Text style={styles.item_options}>
                                {item.selected_options
                                  .map((o) => o.option_name)
                                  .join(", ")}
                              </Text>
                            )}
                          <Text style={styles.item_price}>
                            ₦{item.item_total.toLocaleString()}
                          </Text>
                        </View>

                        {/* Quantity Controls */}
                        <View style={styles.qty_controls}>
                          <TouchableOpacity
                            style={styles.qty_btn}
                            onPress={() => {
                              if (item._id) {
                                Haptics.impactAsync(
                                  Haptics.ImpactFeedbackStyle.Light
                                );
                                updateItemQuantity(
                                  item._id,
                                  item.quantity - 1,
                                  restaurantId
                                );
                              }
                            }}
                          >
                            <Feather
                              name={item.quantity === 1 ? "trash-2" : "minus"}
                              size={13}
                              color={item.quantity === 1 ? "#f44336" : "#fff"}
                            />
                          </TouchableOpacity>
                          <Text style={styles.qty_text}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.qty_btn}
                            onPress={() => {
                              if (item._id) {
                                Haptics.impactAsync(
                                  Haptics.ImpactFeedbackStyle.Light
                                );
                                updateItemQuantity(
                                  item._id,
                                  item.quantity + 1,
                                  restaurantId
                                );
                              }
                            }}
                          >
                            <Feather name="plus" size={13} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* Delivery Location Section */}
              <View style={styles.card}>
                <View style={styles.card_header}>
                  <Text style={styles.card_title}>Delivery Location</Text>
                  {savedPlaces && savedPlaces.length > 0 && (
                    <TouchableOpacity
                      style={styles.add_place_header_btn}
                      onPress={openMapModal}
                    >
                      <Feather name="plus" size={14} color="#fff" />
                      <Text style={styles.add_place_header_btn_text}>
                        Add New
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Saved Places list or Empty State */}
                {savedPlaces && savedPlaces.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.saved_places_scroll}
                  >
                    {savedPlaces.map((place) => {
                      const isSelected = selectedPlaceId === place._id;
                      return (
                        <TouchableOpacity
                          key={place._id}
                          style={[
                            styles.place_chip,
                            isSelected && styles.place_chip_selected,
                          ]}
                          onPress={() => selectPlace(place)}
                        >
                          <View style={styles.place_chip_header_row}>
                            {renderPlaceIcon(place.place_header, isSelected)}
                            <Text
                              style={[
                                styles.place_chip_title,
                                isSelected && styles.place_chip_title_selected,
                              ]}
                            >
                              {place.place_header}
                            </Text>
                            {isSelected && (
                              <Ionicons
                                name="checkmark-circle"
                                size={16}
                                color="#4caf50"
                              />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.place_chip_sub,
                              isSelected && styles.place_chip_sub_selected,
                            ]}
                            numberOfLines={2}
                          >
                            {place.place_sub_name
                              ? `${place.place_name}, ${place.place_sub_name}`
                              : place.place_name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    <TouchableOpacity
                      style={styles.add_place_chip}
                      onPress={openMapModal}
                    >
                      <View style={styles.add_place_icon_box}>
                        <Feather name="map-pin" size={18} color="#fff" />
                      </View>
                      <Text style={styles.add_place_chip_text}>
                        Pin on Map
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                ) : (
                  <View style={styles.empty_places_container}>
                    <Feather name="map-pin" size={24} color="#777" />
                    <Text style={styles.empty_places_title}>
                      No Saved Delivery Places
                    </Text>
                    <Text style={styles.empty_places_sub}>
                      Add your home, office or delivery location on the map
                    </Text>
                    <TouchableOpacity
                      style={styles.add_place_cta}
                      onPress={openMapModal}
                    >
                      <Feather name="plus" size={16} color="#121212" />
                      <Text style={styles.add_place_cta_text}>
                        Add Location on Map
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Selected Address Display */}
                {address ? (
                  <View style={styles.selected_address_box}>
                    <Feather name="map-pin" size={16} color="#4caf50" />
                    <Text style={styles.selected_address_text} numberOfLines={2}>
                      {address}
                    </Text>
                  </View>
                ) : null}

                {/* Optional Landmark */}
                <View style={[styles.input_box, { marginTop: 10 }]}>
                  <Feather name="flag" size={16} color="#777" />
                  <TextInput
                    style={styles.input}
                    placeholder="Landmark / Flat / Suite (Optional)"
                    placeholderTextColor="#555"
                    value={landmark}
                    onChangeText={setLandmark}
                    returnKeyType="next"
                  />
                </View>

                {/* Contact Inputs */}
                <View style={styles.row_inputs}>
                  <View style={[styles.input_box, { flex: 1 }]}>
                    <Feather name="user" size={16} color="#777" />
                    <TextInput
                      style={styles.input}
                      placeholder="Contact Name"
                      placeholderTextColor="#555"
                      value={contactName}
                      onChangeText={setContactName}
                      returnKeyType="next"
                    />
                  </View>

                  <View style={[styles.input_box, { flex: 1 }]}>
                    <Feather name="phone" size={16} color="#777" />
                    <TextInput
                      style={styles.input}
                      placeholder="Phone Number"
                      placeholderTextColor="#555"
                      keyboardType="phone-pad"
                      value={contactPhone}
                      onChangeText={setContactPhone}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>
                </View>
              </View>

              {/* Payment Breakdown */}
              <View style={styles.card}>
                <Text style={styles.card_title}>Payment Breakdown</Text>

                <View style={styles.breakdown_row}>
                  <Text style={styles.breakdown_label}>Subtotal</Text>
                  <Text style={styles.breakdown_val}>
                    ₦{subtotal.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.breakdown_row}>
                  <Text style={styles.breakdown_label}>Delivery Fee (Flat)</Text>
                  <Text style={styles.breakdown_val}>
                    ₦{deliveryFee.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.breakdown_row}>
                  <Text style={styles.total_label}>Total Amount</Text>
                  <Text style={styles.total_val}>₦{total.toLocaleString()}</Text>
                </View>

                {/* Wallet Info Tag */}
                <View
                  style={[
                    styles.wallet_tag,
                    hasInsufficientWallet && styles.wallet_tag_error,
                  ]}
                >
                  <Feather
                    name="credit-card"
                    size={15}
                    color={hasInsufficientWallet ? "#f44336" : "#4caf50"}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.wallet_title}>In-App Wallet Payment</Text>
                    <Text style={styles.wallet_sub}>
                      Available Balance: ₦{userWalletBal.toLocaleString()}
                    </Text>
                  </View>
                  {hasInsufficientWallet && (
                    <Text style={styles.insufficient_badge}>Low Balance</Text>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Place Order CTA */}
            <View style={styles.bottom_bar}>
              <TouchableOpacity
                style={[
                  styles.place_order_btn,
                  (orderLoading ||
                    items.length === 0 ||
                    hasInsufficientWallet) &&
                    styles.btn_disabled,
                ]}
                disabled={
                  orderLoading || items.length === 0 || hasInsufficientWallet
                }
                onPress={handlePlaceOrder}
              >
                {orderLoading ? (
                  <ActivityIndicator color="#121212" />
                ) : (
                  <Text style={styles.place_order_btn_text}>
                    {hasInsufficientWallet
                      ? "Insufficient Wallet Balance"
                      : `Place Order • ₦${total.toLocaleString()}`}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Full Screen Map Picker View Overlay (Guaranteed to render over CheckoutModal on iOS & Android) */}
            {showMapModal && (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { zIndex: 99999, backgroundColor: "#121212" },
                ]}
              >
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
                  onPress={(e) =>
                    handleMapPointChange(e.nativeEvent.coordinate)
                  }
                >
                  <Marker
                    coordinate={tempCoords}
                    draggable
                    onDragEnd={(e) =>
                      handleMapPointChange(e.nativeEvent.coordinate)
                    }
                  >
                    <View style={styles.pin_marker_large}>
                      <Feather name="map-pin" size={24} color="#fff" />
                    </View>
                  </Marker>
                </MapView>

                {/* Top Search Bar & Suggestions Header */}
                <View style={styles.full_map_header}>
                  <View style={styles.search_input_box}>
                    <Feather name="search" size={18} color="#aaa" />
                    <TextInput
                      style={styles.search_input}
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
                    <View style={styles.suggestions_card}>
                      <ScrollView
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                        style={{ maxHeight: 220 }}
                      >
                        {suggestions.map((item) => (
                          <TouchableOpacity
                            key={item.place_id}
                            style={styles.suggestion_row}
                            onPress={() => selectSuggestion(item)}
                          >
                            <Feather
                              name="map-pin"
                              size={16}
                              color="#aaa"
                              style={{ marginTop: 2 }}
                            />
                            <View style={{ flex: 1 }}>
                              <Text
                                style={styles.suggestion_title}
                                numberOfLines={1}
                              >
                                {item.structured_formatting?.main_text ||
                                  item.description}
                              </Text>
                              <Text
                                style={styles.suggestion_subtitle}
                                numberOfLines={1}
                              >
                                {item.structured_formatting?.secondary_text ||
                                  item.description}
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
                  <View style={styles.full_map_badge}>
                    <Feather name="info" size={14} color="#fff" />
                    <Text style={styles.full_map_badge_text}>
                      Tap map or drag marker to set precise location
                    </Text>
                  </View>
                )}

                {/* Bottom Confirmation & Save Place Bar */}
                <View style={styles.full_map_bottom}>
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.map_bottom_label}>
                      LOCATION ADDRESS
                    </Text>
                    <Text style={styles.map_bottom_address} numberOfLines={2}>
                      {selectedAddressText || "Tap map to set location address"}
                    </Text>
                    {selectedSubText ? (
                      <Text style={styles.map_bottom_sub}>
                        {selectedSubText}
                      </Text>
                    ) : null}
                  </View>

                  {/* Label Chips */}
                  <Text style={[styles.map_bottom_label, { marginBottom: 6 }]}>
                    SAVE PLACE AS
                  </Text>
                  <View style={styles.label_chips_row}>
                    {["home", "office", "other"].map((lbl) => (
                      <TouchableOpacity
                        key={lbl}
                        style={[
                          styles.label_chip,
                          placeHeaderLabel === lbl &&
                            styles.label_chip_selected,
                        ]}
                        onPress={() => setPlaceHeaderLabel(lbl)}
                      >
                        <Text
                          style={[
                            styles.label_chip_text,
                            placeHeaderLabel === lbl &&
                              styles.label_chip_text_selected,
                          ]}
                        >
                          {lbl.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {placeHeaderLabel === "other" && (
                    <TextInput
                      style={styles.custom_header_input}
                      placeholder="Custom Label e.g. Gym, Friend's house"
                      placeholderTextColor="#666"
                      value={customHeader}
                      onChangeText={setCustomHeader}
                    />
                  )}

                  <TouchableOpacity
                    style={[
                      styles.save_location_btn,
                      savingPlace && { opacity: 0.6 },
                    ]}
                    onPress={handleSaveMapLocation}
                    disabled={savingPlace}
                  >
                    {savingPlace ? (
                      <ActivityIndicator color="#121212" />
                    ) : (
                      <Text style={styles.save_location_btn_text}>
                        Save & Select Location
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancel_map_btn}
                    onPress={() => setShowMapModal(false)}
                  >
                    <Text style={styles.cancel_map_btn_text}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CheckoutModal;

const styles = StyleSheet.create({
  modal_overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modal_container: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingTop: 16,
    position: "relative",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  header_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  header_sub: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginTop: 2,
  },
  close_btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll_content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  card: {
    backgroundColor: "#222",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  card_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  card_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  add_place_header_btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  add_place_header_btn_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  item_count: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  empty_text: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 10,
  },
  item_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  item_thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
  },
  item_thumb_placeholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  item_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  item_options: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 2,
  },
  item_price: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 12,
    marginTop: 2,
  },
  qty_controls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 6,
  },
  qty_btn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  qty_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
    minWidth: 16,
    textAlign: "center",
  },

  // Saved Places Horizontal Chips
  saved_places_scroll: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  place_chip: {
    width: 150,
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  place_chip_selected: {
    backgroundColor: "#1e2e1e",
    borderColor: "#4caf50",
  },
  place_chip_header_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  place_chip_title: {
    color: "#aaa",
    fontFamily: "raleway-bold",
    fontSize: 13,
    textTransform: "capitalize",
    flex: 1,
  },
  place_chip_title_selected: {
    color: "#fff",
  },
  place_chip_sub: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 11,
  },
  place_chip_sub_selected: {
    color: "#c5e1a5",
  },
  add_place_chip: {
    width: 110,
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#333",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  add_place_icon_box: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  add_place_chip_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },

  // Empty Saved Places Container
  empty_places_container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginBottom: 10,
  },
  empty_places_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
    marginTop: 8,
  },
  empty_places_sub: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  add_place_cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  add_place_cta_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },

  // Selected Address Banner
  selected_address_box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1b271b",
    borderWidth: 1,
    borderColor: "#4caf5044",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  selected_address_text: {
    flex: 1,
    color: "#e8f5e9",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },

  // Inputs
  input_box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  row_inputs: {
    flexDirection: "row",
    gap: 8,
  },

  // Breakdown
  breakdown_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  breakdown_label: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  breakdown_val: {
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginVertical: 8,
  },
  total_label: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  total_val: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  wallet_tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#4caf5015",
    borderWidth: 1,
    borderColor: "#4caf503a",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  wallet_tag_error: {
    backgroundColor: "#f4433615",
    borderColor: "#f443363a",
  },
  wallet_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  wallet_sub: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 1,
  },
  insufficient_badge: {
    color: "#f44336",
    fontFamily: "raleway-bold",
    fontSize: 11,
  },

  // Bottom Bar
  bottom_bar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  place_order_btn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btn_disabled: {
    opacity: 0.5,
  },
  place_order_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },

  // Map Modal Styles (matching restaurant_location.tsx)
  pin_marker_large: {
    backgroundColor: "#121212",
    padding: 10,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: "#fff",
  },
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
  map_bottom_label: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 10,
    letterSpacing: 0.4,
  },
  map_bottom_address: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
    marginTop: 2,
  },
  map_bottom_sub: {
    color: "#aaa",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginTop: 2,
  },
  label_chips_row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  label_chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  label_chip_selected: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  label_chip_text: {
    color: "#aaa",
    fontFamily: "raleway-bold",
    fontSize: 11,
  },
  label_chip_text_selected: {
    color: "#121212",
  },
  custom_header_input: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  save_location_btn: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    width: "100%",
  },
  save_location_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  cancel_map_btn: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 6,
  },
  cancel_map_btn_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
});

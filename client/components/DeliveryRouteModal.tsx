import React, { FC, useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  PixelRatio,
  TextInput,
  Image,
  Pressable,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { Picker } from "@react-native-picker/picker";
import BottomSheet, {
  BottomSheetView,
  TouchableWithoutFeedback,
} from "@gorhom/bottom-sheet";

import { Feather, FontAwesome, FontAwesome6 } from "@expo/vector-icons";

import { useDeliverContext, Delivery } from "../context/DeliveryContext";
import { useMapContext } from "../context/MapContext";
import { useNotificationContext } from "../context/NotificationContext";
import { useAuthContext } from "../context/AuthContext";
import { useWalletContext } from "../context/WalletContext";
import { useRatingContext } from "../context/RatingContext";
import RideRoute from "./RideRoute";
import CustomDropdown from "./CustomDropdown";
import ReportDriverModal from "./ReportDriverModal";
import DeliveryInfoModal from "./DeliveryInfoModal";

const DeliveryRouteModal: FC = () => {
  const {
    deliveryStatus,
    setDeliveryStatus,
    deliveryModalRef,
    ongoingDeliveryData,
    fetchDeliveryRoute,
  } = useDeliverContext();

  const { setDestinationCoords, setDestination, setMapPadding } =
    useMapContext() as any;

  const windowHeight = Dimensions.get("window").height;
  const fontScale = PixelRatio.getFontScale();
  const snapPoints = useMemo(() => {
    // base snap percents (same as before)
    const base = [25, 32, 40, 60, 75, 94];

    // Determine adjustment factor from fontScale:
    // - fontScale <= 1 => no change
    // - larger fontScale increases sheet sizes up to a reasonable cap
    const factor =
      fontScale <= 1 ? 1 : Math.min(1.3, 1 + (fontScale - 1) * 0.7);

    // apply factor and clamp each percent between 20 and 98
    const adjusted = base.map((p) => {
      const v = Math.round(p * factor);
      return `${Math.min(94, Math.max(20, v))}%`;
    });

    return adjusted;
  }, [fontScale]);

  // Keep map destination and route in sync with delivery data
  useEffect(() => {
    if (!ongoingDeliveryData) return;

    // Set destination for map view
    if (ongoingDeliveryData.dropoff?.address) {
      setDestination(ongoingDeliveryData.dropoff.address);
    }
    if (ongoingDeliveryData.dropoff?.coordinates) {
      setDestinationCoords(ongoingDeliveryData.dropoff.coordinates);
    }

    // Fetch delivery route with pickup and dropoff coordinates
    if (
      ongoingDeliveryData.pickup?.coordinates &&
      ongoingDeliveryData.dropoff?.coordinates
    ) {
      fetchDeliveryRoute(
        ongoingDeliveryData.pickup.coordinates,
        ongoingDeliveryData.dropoff.coordinates
      );
    }
  }, [
    ongoingDeliveryData?.pickup?.coordinates,
    ongoingDeliveryData?.dropoff?.coordinates,
    ongoingDeliveryData?.dropoff?.address,
  ]);

  // Drive modal status from server status WITHOUT overriding user tracking views
  useEffect(() => {
    if (!ongoingDeliveryData) {
      const t = setTimeout(() => setDeliveryStatus("details"), 500);
      return () => clearTimeout(t);
    }

    const status = ongoingDeliveryData.status;

    // Do not override tracking screens on passive data updates
    if (
      (deliveryStatus === "track_driver" &&
        (status === "accepted" || status === "arrived")) ||
      (deliveryStatus === "track_delivery" && status === "in_transit")
    ) {
      return;
    }

    if (status === "pending") setDeliveryStatus("searching");
    if (status === "expired") setDeliveryStatus("expired");
    if (status === "accepted") setDeliveryStatus("accepted");
    if (status === "arrived")
      setDeliveryStatus(
        ongoingDeliveryData.payment_status === "paid" ? "paid" : "arrived"
      );
    if (status === "picked_up") setDeliveryStatus("picked_up");
    if (status === "in_transit") setDeliveryStatus("in_transit");
  }, [ongoingDeliveryData?.status]);

  const handleSheetChange = (index: number) => {
    const snapValue = snapPoints[index];
    let sheetHeight = 0;

    // your ride logic
    if (index === 0 && deliveryStatus === "details") {
      setDeliveryStatus("");
    }

    if (typeof snapValue === "string" && snapValue.includes("%")) {
      const percent = parseFloat(snapValue) / 100;
      sheetHeight = windowHeight * percent;
    } else if (typeof snapValue === "number") {
      sheetHeight = snapValue;
    }

    if (index === 3)
      setMapPadding((prev: any) => ({ ...prev, bottom: sheetHeight + 35 }));
    if (index === 2)
      setMapPadding((prev: any) => ({ ...prev, bottom: sheetHeight + 25 }));
    if (index < 2)
      setMapPadding((prev: any) => ({ ...prev, bottom: sheetHeight + 20 }));
  };

  // Get initial snap index based on delivery status
  const getInitialSnapIndex = () => {
    // If we have ongoing delivery data, use its status to determine initial index
    if (ongoingDeliveryData)
      switch (ongoingDeliveryData.status) {
        case "pending":
          return 2; // searching
        case "expired":
          return 1; // expired
        case "accepted":
          return 3; // accepted
        case "arrived":
          return 2; // arrived
        case "picked_up":
          return 2; // picked_up
        case "in_transit":
          return 3; // in_transit
        case "delivered":
          return 5; // rating
        default:
          return 2;
      }

    // Otherwise use deliveryStatus
    switch (deliveryStatus) {
      case "":
        return 0;
      case "details":
        return 5;
      case "route":
        return 5;
      case "vehicle":
        return 2;
      case "searching":
        return 2;
      case "expired":
        return 1;
      case "accepted":
        return 3;
      case "track_driver":
        return 2;
      case "arrived":
        return 2;
      case "paying":
        return 1;
      case "paid":
        return 1;
      case "picked_up":
        return 2;
      case "in_transit":
        return 3;
      case "track_delivery":
        return 2;
      case "rating":
        return 5;
      default:
        return 0;
    }
  };

  return (
    <BottomSheet
      index={getInitialSnapIndex()}
      snapPoints={snapPoints}
      ref={deliveryModalRef}
      onChange={handleSheetChange}
      enableContentPanningGesture={true}
      enableHandlePanningGesture={true}
      enableDynamicSizing={false}
      enableOverDrag={false}
      keyboardBehavior="interactive"
      backgroundStyle={{
        backgroundColor: "#121212",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
      handleIndicatorStyle={{
        width: 40,
        height: 5,
        backgroundColor: "grey",
        marginTop: 10,
        borderRadius: 10,
      }}
    >
      <BottomSheetView style={styles.modal}>
        {deliveryStatus === "" && <StartModal />}
        {deliveryStatus === "details" && <DetailsModal />}
        {deliveryStatus === "route" && <RouteModal />}
        {deliveryStatus === "vehicle" && <ChooseVehicleModal />}
        {deliveryStatus === "searching" && <SearchingModal />}
        {deliveryStatus === "expired" && <ExpiredModal />}
        {deliveryStatus === "accepted" && <AcceptedModal />}
        {deliveryStatus === "track_driver" && <TrackDriver />}
        {deliveryStatus === "arrived" && <ArrivedModal />}
        {deliveryStatus === "picked_up" && <PickedUpModal />}
        {deliveryStatus === "paying" && <PayingModal />}
        {deliveryStatus === "paid" && <PaidModal />}
        {deliveryStatus === "in_transit" && <InTransitModal />}
        {deliveryStatus === "track_delivery" && <PickedUpModal />}
        {deliveryStatus === "rating" && <RateModal />}
      </BottomSheetView>
    </BottomSheet>
  );
};

const StartModal = () => {
  const { signedIn } = useAuthContext();
  const { setDeliveryStatus } = useDeliverContext();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {signedIn?.name.split(" ")[1] || signedIn?.name.split(" ")[0]}, got
        something to deliver?
      </Text>

      <Pressable
        style={styles.form}
        onPress={() => setDeliveryStatus("details")}
      >
        <View style={styles.text_inp_container}>
          <FontAwesome6 name="truck" size={22} color="#8d8d8d" />

          <TextInput
            placeholder="Wetin we dey deliver?"
            value=""
            selection={{ start: 0, end: 0 }}
            placeholderTextColor={"#8d8d8d"}
            editable={false}
            style={[
              styles.start_text_input,
              { color: "#bfbfbf", backgroundColor: "#3f3f3f" },
            ]}
          />
        </View>
      </Pressable>
    </View>
  );
};

const DetailsModal = () => {
  const { setDeliveryStatus, deliveryData, setDeliveryData } =
    useDeliverContext();
  const { showNotification } = useNotificationContext() as any;

  // Initialize form values from deliveryData or empty defaults
  const recipientName = deliveryData?.to?.name || "";
  const recipientPhone = deliveryData?.to?.phone || "";
  const description = deliveryData?.package?.description || "";
  const pkgType = deliveryData?.package?.type || "document";
  const fragile = deliveryData?.package?.fragile || false;
  const amount = deliveryData?.package?.amount?.toString() || "";

  <Picker
    selectedValue={pkgType}
    onValueChange={(v) => setPkgType(v)}
    style={{ color: "#fff" }}
    itemStyle={{ color: "#fff" }}
  >
    <Picker.Item label="Document" value="document" />
    <Picker.Item label="Electronics" value="electronics" />
    <Picker.Item label="Clothing" value="clothing" />
    <Picker.Item label="Food" value="food" />
    <Picker.Item label="Furniture" value="furniture" />
    <Picker.Item label="Other" value="other" />
  </Picker>;

  const PACKAGE_TYPES = [
    { key: "document", label: "Document" },
    { key: "electronics", label: "Electronics" },
    { key: "clothing", label: "Clothing" },
    { key: "food", label: "Food" },
    { key: "furniture", label: "Furniture" },
    { key: "other", label: "Other" },
  ];

  const setRecipientName = (value: string) => {
    setDeliveryData(
      (prev) =>
        ({
          ...prev,
          to: {
            ...prev?.to,
            name: value,
          },
        } as any)
    );
  };

  const setRecipientPhone = (value: string) => {
    setDeliveryData(
      (prev) =>
        ({
          ...prev,
          to: {
            ...prev?.to,
            phone: value,
          },
        } as any)
    );
  };

  const setDescription = (value: string) => {
    setDeliveryData(
      (prev) =>
        ({
          ...prev,
          package: {
            ...prev?.package,
            description: value,
          },
        } as any)
    );
  };

  const setPkgType = (value: string) => {
    setDeliveryData(
      (prev) =>
        ({
          ...prev,
          package: {
            ...prev?.package,
            type: value as any,
          },
        } as any)
    );
  };

  const setFragile = (value: boolean) => {
    setDeliveryData(
      (prev) =>
        ({
          ...prev,
          package: {
            ...prev?.package,
            fragile: value,
          },
        } as any)
    );
  };

  const setAmount = (value: string) => {
    setDeliveryData(
      (prev) =>
        ({
          ...prev,
          package: {
            ...prev?.package,
            amount: value ? parseFloat(value) : undefined,
          },
        } as any)
    );
  };

  const submit = () => {
    if (!recipientName.trim()) {
      showNotification("Please enter recipient name", "error");
      return;
    }
    if (!recipientPhone.trim()) {
      showNotification("Please enter recipient phone", "error");
      return;
    }
    if (!description.trim()) {
      showNotification("Please enter package description", "error");
      return;
    }
    if (!amount.trim()) {
      showNotification("Please enter package amount", "error");
      return;
    }

    showNotification("Delivery details saved", "success");
    setDeliveryStatus("route");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={"padding"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 5,
          paddingTop: 12,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.header, { marginBottom: 12 }]}>
          Recipient info
        </Text>

        <View style={{ marginBottom: 14 }}>
          <Text
            style={{
              color: "#cfcfcf",
              marginBottom: 6,
              fontFamily: "raleway-semibold",
            }}
          >
            Name
          </Text>
          <TextInput
            placeholder="Recipient full name"
            placeholderTextColor="#b0b0b0"
            value={recipientName}
            onChangeText={setRecipientName}
            style={styles.text_input}
            selectionColor="#fff"
          />
        </View>

        <View style={{ marginBottom: 18 }}>
          <Text
            style={{
              color: "#cfcfcf",
              marginBottom: 6,
              fontFamily: "raleway-semibold",
            }}
          >
            Phone
          </Text>
          <TextInput
            placeholder="Recipient phone number"
            placeholderTextColor="#b0b0b0"
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            keyboardType="phone-pad"
            style={styles.text_input}
            selectionColor="#fff"
          />
        </View>

        <View
          style={{ height: 1, backgroundColor: "#2a2a2a", marginVertical: 8 }}
        />

        <Text style={[styles.header, { marginVertical: 12 }]}>
          Package details
        </Text>

        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              color: "#cfcfcf",
              marginBottom: 12,
              fontFamily: "raleway-semibold",
            }}
          >
            Type
          </Text>
          <View
            style={{
              backgroundColor: "#515151",
              borderRadius: 8,
              paddingHorizontal: 8,
            }}
          >
            <CustomDropdown
              options={PACKAGE_TYPES}
              value={pkgType}
              onChange={(k) => setPkgType(k)}
            />
          </View>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              color: "#cfcfcf",
              marginBottom: 6,
              fontFamily: "raleway-semibold",
            }}
          >
            Description
          </Text>
          <TextInput
            placeholder=" e.g. iPhone XR, Bag of oranges"
            placeholderTextColor="#b0b0b0"
            value={description}
            onChangeText={setDescription}
            style={[styles.text_input]}
            multiline
            selectionColor="#fff"
          />
        </View>

        <View style={{ marginVertical: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 30,
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text
                style={{
                  color: "#cfcfcf",
                  marginBottom: 6,
                  fontFamily: "raleway-bold",
                }}
              >
                Fragile?
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  flex: 1,
                }}
              >
                <Pressable
                  onPress={() => setFragile(true)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View
                    style={{
                      height: 18,
                      width: 18,
                      borderRadius: 9,
                      borderWidth: 1,
                      borderColor: fragile ? "#fff" : "#8d8d8d",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: fragile ? "#fff" : "transparent",
                    }}
                  />
                  <Text style={{ color: "#fff" }}>Yes</Text>
                </Pressable>

                <Pressable
                  onPress={() => setFragile(false)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View
                    style={{
                      height: 18,
                      width: 18,
                      borderRadius: 9,
                      borderWidth: 1,
                      borderColor: !fragile ? "#fff" : "#8d8d8d",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: !fragile ? "#fff" : "transparent",
                    }}
                  />
                  <Text style={{ color: "#fff" }}>No</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#cfcfcf",
                  marginBottom: 6,
                  fontFamily: "raleway-semibold",
                }}
              >
                Amount
              </Text>
              <TextInput
                placeholder="Amount"
                placeholderTextColor="#b0b0b0"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={[styles.text_input]}
                selectionColor="#fff"
              />
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 12,
            marginTop: 25,
            marginBottom: 20,
          }}
        >
          <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={submit}>
            <Text style={[styles.btnText, { textAlign: "center" }]}>
              Continue
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.btn,
              {
                paddingHorizontal: 20,
                backgroundColor: "transparent",
                borderColor: "#fff",
                borderWidth: 1,
              },
            ]}
            onPress={() => {
              setDeliveryStatus("");
              setDeliveryData(null);
            }}
          >
            <Text style={{ fontFamily: "raleway-semibold", color: "#fff" }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const RouteModal = () => {
  const { setDeliveryStatus, deliveryData, setDeliveryData } =
    useDeliverContext();
  const { getSuggestions, getPlaceCoords, calculateDelivery } =
    useMapContext() as any;
  const { showNotification } = useNotificationContext() as any;

  // Get pickup and dropoff from deliveryData
  const pickup = deliveryData?.pickup?.address || "";
  const dropoff = deliveryData?.dropoff?.address || "";

  // State for suggestions
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<
    "pickup" | "dropoff" | ""
  >("");

  // Update pickup in deliveryData
  const setPickup = (value: string) => {
    setDeliveryData(
      (prev) =>
        ({
          ...prev,
          pickup: {
            ...prev?.pickup,
            address: value,
          },
        } as any)
    );
  };

  // Update dropoff in deliveryData
  const setDropOff = (value: string) => {
    setDeliveryData(
      (prev) =>
        ({
          ...prev,
          dropoff: {
            ...prev?.dropoff,
            address: value,
          },
        } as any)
    );
  };

  // Focus handlers
  const pickupFocus = () => {
    setActiveSuggestion("pickup");
    setDropoffSuggestions([]);
  };

  const dropoffFocus = () => {
    setActiveSuggestion("dropoff");
    setPickupSuggestions([]);
  };

  // Get suggestions when pickup text changes
  React.useEffect(() => {
    if (pickup.trim() && activeSuggestion === "pickup") {
      getSuggestions(pickup)
        .then((suggestions: any) => {
          setPickupSuggestions(suggestions || []);
        })
        .catch(() => {
          setPickupSuggestions([]);
        });
    } else {
      setPickupSuggestions([]);
    }
  }, [pickup, activeSuggestion]);

  // Get suggestions when dropoff text changes
  React.useEffect(() => {
    if (dropoff.trim() && activeSuggestion === "dropoff") {
      getSuggestions(dropoff)
        .then((suggestions: any) => {
          setDropoffSuggestions(suggestions || []);
        })
        .catch(() => {
          setDropoffSuggestions([]);
        });
    } else {
      setDropoffSuggestions([]);
    }
  }, [dropoff, activeSuggestion]);

  // Handle pickup suggestion selection
  const setPickupFromSuggestion = async (place_id: string, address: string) => {
    try {
      const coords = await getPlaceCoords(place_id);
      if (coords) {
        setDeliveryData(
          (prev) =>
            ({
              ...prev,
              pickup: {
                address,
                coordinates: coords,
              },
            } as any)
        );
        setActiveSuggestion("");
        setPickupSuggestions([]);
      }
    } catch (error) {
      showNotification("Failed to get location coordinates", "error");
    }
  };

  // Handle dropoff suggestion selection
  const setDropoffFromSuggestion = async (
    place_id: string,
    address: string
  ) => {
    try {
      const coords = await getPlaceCoords(place_id);
      if (coords) {
        setDeliveryData(
          (prev) =>
            ({
              ...prev,
              dropoff: {
                address,
                coordinates: coords,
              },
            } as any)
        );
        setActiveSuggestion("");
        setDropoffSuggestions([]);
      }
    } catch (error) {
      showNotification("Failed to get location coordinates", "error");
    }
  };

  const submit = async () => {
    if (!pickup.trim()) {
      showNotification("Please enter pickup location", "error");
      return;
    }
    if (!dropoff.trim()) {
      showNotification("Please enter dropoff location", "error");
      return;
    }
    if (!deliveryData?.pickup?.coordinates) {
      showNotification("Please select pickup from suggestions", "error");
      return;
    }
    if (!deliveryData?.dropoff?.coordinates) {
      showNotification("Please select dropoff from suggestions", "error");
      return;
    }

    try {
      // Calculate delivery fares for all vehicle types
      const deliveryDetails = await calculateDelivery(
        deliveryData.pickup.coordinates,
        deliveryData.dropoff.coordinates
      );

      if (deliveryDetails) {
        // Store delivery details in deliveryData with the correct structure
        setDeliveryData(
          (prev) =>
            ({
              ...prev,
              deliveryDetails: {
                distanceKm: deliveryDetails.distanceKm,
                durationMins: deliveryDetails.durationMins,
                bikeAmount: deliveryDetails.bike.amount,
                cabAmount: deliveryDetails.cab.amount,
                vanAmount: deliveryDetails.van.amount,
                truckAmount: deliveryDetails.truck.amount,
              },
            } as any)
        );

        showNotification("Route details saved", "success");
        setDeliveryStatus("vehicle");
      } else {
        showNotification("Failed to calculate delivery fare", "error");
      }
    } catch (error) {
      showNotification("Error calculating delivery fare", "error");
    }
  };

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Choose your route...
      </Text>
      {/* Route selection form */}
      <View style={styles.form}>
        <View style={{ flex: 1, marginTop: 30, flexDirection: "row", gap: 15 }}>
          {/* Select pickup and drop off */}
          <View style={{ alignItems: "center", marginTop: 15 }}>
            <View
              style={{
                width: 15,
                height: 15,
                backgroundColor: "#9c9c9c",
                borderRadius: 20,
              }}
            />
            <View
              style={{
                width: 1,
                height: 40,
                borderLeftWidth: 1,
                borderColor: "#9c9c9c",
                borderStyle: "dashed",
              }}
            />
            <View
              style={{
                width: 14,
                height: 14,
                backgroundColor: "#9c9c9c",
              }}
            />
          </View>
          <View>
            <View style={styles.route_inp_container}>
              <TextInput
                style={[styles.route_input]}
                placeholder="Pickup"
                value={pickup}
                onFocus={pickupFocus}
                onChangeText={setPickup}
                editable={true}
                placeholderTextColor={"#b7b7b7"}
              />
            </View>
            <View style={styles.route_inp_container}>
              <TextInput
                style={styles.route_input}
                placeholder="Drop off"
                value={dropoff}
                onFocus={dropoffFocus}
                onChangeText={setDropOff}
                editable={true}
                placeholderTextColor={"#b7b7b7"}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Suggestions */}
      <View style={[styles.suggestions_container]}>
        {activeSuggestion === "pickup" && pickupSuggestions.length > 0 ? (
          <FlatList
            data={pickupSuggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.suggestion_box}
                onPress={() =>
                  setPickupFromSuggestion(
                    item.place_id,
                    item.structured_formatting.main_text
                  )
                }
              >
                <Feather name="map-pin" size={20} color="#b7b7b7" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestion_header_text} numberOfLines={1}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.suggestion_sub_text} numberOfLines={1}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        ) : activeSuggestion === "dropoff" && dropoffSuggestions.length > 0 ? (
          <FlatList
            data={dropoffSuggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.suggestion_box}
                onPress={() =>
                  setDropoffFromSuggestion(
                    item.place_id,
                    item.structured_formatting.main_text
                  )
                }
              >
                <Feather name="map-pin" size={20} color="#b7b7b7" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestion_header_text} numberOfLines={1}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.suggestion_sub_text} numberOfLines={1}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        ) : (
          <View
            style={{
              paddingVertical: 20,
              paddingHorizontal: 5,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <Feather name="search" size={20} color="#b7b7b7" />
              <View>
                <Text
                  style={[styles.suggestion_header_text, { color: "#b7b7b7" }]}
                >
                  Start typing to search locations
                </Text>
                <Text
                  style={[styles.suggestion_sub_text, { color: "#b7b7b7" }]}
                >
                  Enter pickup or dropoff location above
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={submit}
        style={{
          marginBottom: 50,
          padding: 10,
          borderRadius: 30,
          backgroundColor: "#fff",
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontFamily: "raleway-bold",
            color: "#121212",
          }}
        >
          Set route
        </Text>
      </TouchableOpacity>
    </>
  );
};

const ChooseVehicleModal = () => {
  const [selectedRideType, setSelectedRideType] = useState<
    "bike" | "cab" | "van" | "truck"
  >("bike");
  const { setDeliveryStatus, deliveryData, setDeliveryData, requestDelivery } =
    useDeliverContext();
  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Select Igle ride...
      </Text>

      {/* Ride type selection - horizontally scrollable with snapping */}
      <View style={{ marginTop: 20 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={240} // card width (220) + marginRight (20)
          snapToAlignment="start"
          contentContainerStyle={{ paddingHorizontal: 10 }}
        >
          <RideTypeCard
            id="bike"
            title="Motorcycle"
            icon={require("../assets/images/icons/motorcycle-icon.png")}
            subtext="For small and light items"
            amount={deliveryData?.deliveryDetails?.bikeAmount || 2500}
            selected={selectedRideType === "bike"}
            onPress={() => {
              setSelectedRideType("bike");
            }}
          />

          <RideTypeCard
            id="cab"
            title="Cab"
            icon={require("../assets/images/icons/sedan-icon.png")}
            subtext="For medium-sized packages"
            amount={deliveryData?.deliveryDetails?.cabAmount || 3500}
            selected={selectedRideType === "cab"}
            onPress={() => {
              setSelectedRideType("cab");
            }}
          />

          <RideTypeCard
            id="van"
            title="Van"
            icon={require("../assets/images/icons/van-icon.png")}
            subtext="For large or multiple packages"
            amount={deliveryData?.deliveryDetails?.vanAmount || 5000}
            selected={selectedRideType === "van"}
            onPress={() => {
              setSelectedRideType("van");
            }}
          />
          <RideTypeCard
            id="truck"
            title="Truck"
            icon={require("../assets/images/icons/truck-icon.png")}
            subtext="For heavy-duty deliveries"
            amount={deliveryData?.deliveryDetails?.truckAmount || 8000}
            selected={selectedRideType === "truck"}
            onPress={() => {
              setSelectedRideType("truck");
            }}
          />
        </ScrollView>
      </View>
      <TouchableWithoutFeedback>
        <TouchableOpacity
          onPress={async () => {
            // Create vehicle details object
            const vehicleDetails = {
              type: selectedRideType,
              amount:
                selectedRideType === "bike"
                  ? deliveryData?.deliveryDetails?.bikeAmount || 2500
                  : selectedRideType === "cab"
                  ? deliveryData?.deliveryDetails?.cabAmount || 3500
                  : selectedRideType === "van"
                  ? deliveryData?.deliveryDetails?.vanAmount || 5000
                  : deliveryData?.deliveryDetails?.truckAmount || 8000,
            };

            // Store selected vehicle details in deliveryData for future reference
            setDeliveryData(
              (prev) =>
                ({
                  ...prev,
                  selectedVehicle: vehicleDetails,
                } as any)
            );

            // Request the delivery with the vehicle details directly
            try {
              await requestDelivery(vehicleDetails);
              setDeliveryStatus("searching");
            } catch (error) {
              // Error is already handled in requestDelivery function
              console.error("Failed to request delivery:", error);
            }
          }}
          style={{
            marginVertical: 40,
            padding: 10,
            borderRadius: 30,
            backgroundColor: "#fff",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontFamily: "raleway-bold",
              color: "#121212",
            }}
          >
            Search for dispatch rider
          </Text>
        </TouchableOpacity>
      </TouchableWithoutFeedback>
    </>
  );
};

const SearchingModal = () => {
  const {
    deliveryStatus,
    setDeliveryStatus,
    resetDeliveryFlow,
    ongoingDeliveryData,
    cancelDelivery,
    cancelling,
  } = useDeliverContext();
  const { region, mapRef } = useMapContext() as any;
  const { showNotification } = useNotificationContext() as any;

  const [searchText, setSearchText] = useState<string>(
    "Searching for dispatch riders..."
  );

  React.useEffect(() => {
    // Only show progressive messages for active search (pending/scheduled status)
    const validStatuses = ["pending", "scheduled"];

    if (
      !validStatuses.includes(ongoingDeliveryData?.status!) ||
      deliveryStatus !== "searching"
    ) {
      return;
    }

    const messages = [
      {
        text: "We're trying to locate dispatch riders around you...",
        delay: 3000,
      },
      {
        text: "Please wait, still locating dispatch riders around you...",
        delay: 10000,
      },
      { text: "Expanding area of search...", delay: 10000 },
    ];

    let totalDelay = 0;
    const timeouts: NodeJS.Timeout[] = [];

    messages.forEach(({ text, delay }) => {
      totalDelay += delay;
      const id = setTimeout(() => {
        setSearchText(text);
      }, totalDelay);
      timeouts.push(id);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [deliveryStatus, ongoingDeliveryData?.status]);

  const cancel_delivery = async () => {
    const reason = "No reason";
    const by = "sender";
    const delivery_id = ongoingDeliveryData?._id;

    try {
      if (delivery_id) {
        await cancelDelivery(delivery_id, by, reason);
      } else {
        resetDeliveryFlow();
        showNotification("Delivery cancelled", "info");
      }
      if (region) mapRef.current?.animateToRegion(region, 1000);
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Searching
      </Text>

      <View style={{ marginTop: 20 }}>
        <ActivityIndicator
          size={"large"}
          color={"#fff"}
          style={{ marginBottom: 20, marginTop: 10 }}
        />
        <Text
          style={{
            fontFamily: "raleway-regular",
            color: "#fff",
            textAlign: "center",
          }}
        >
          {searchText}
        </Text>
      </View>

      <View style={{ marginTop: 30 }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={cancel_delivery}
          disabled={cancelling}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 50,
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: "#fff",
            opacity: cancelling ? 0.5 : 1,
          }}
        >
          <Text
            style={{
              fontFamily: "raleway-bold",
              color: "#fff",
              textAlign: "center",
            }}
          >
            {cancelling ? "Cancelling..." : "Cancel"}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const ExpiredModal = () => {
  const {
    setDeliveryStatus,
    resetDeliveryFlow,
    ongoingDeliveryData,
    retryDelivery,
    cancelDelivery,
    retrying,
    cancelling,
  } = useDeliverContext();
  const { region, mapRef } = useMapContext() as any;
  const { showNotification } = useNotificationContext() as any;

  const cancel_delivery = async () => {
    const reason = "No reason";
    const by = "sender";
    const delivery_id = ongoingDeliveryData?._id;

    try {
      if (delivery_id) {
        await cancelDelivery(delivery_id, by, reason);
      } else {
        resetDeliveryFlow();
        showNotification("Delivery cancelled", "info");
      }
      if (region) mapRef.current?.animateToRegion(region, 1000);
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  const retry_delivery = async () => {
    try {
      const delivery_id = ongoingDeliveryData?._id;
      if (delivery_id) {
        await retryDelivery(delivery_id);
        setDeliveryStatus("searching"); // Go back to searching after retry
        showNotification("Retrying delivery request...", "info");
      }
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Delivery timeout
      </Text>

      <View style={{ marginTop: 20 }}>
        <Text
          style={{
            fontFamily: "raleway-regular",
            color: "#fff",
            textAlign: "center",
          }}
        >
          No dispatch rider was found at this time to deliver to{" "}
          {ongoingDeliveryData?.dropoff?.address || "your destination"}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 30,
          gap: 20,
        }}
      >
        <TouchableOpacity
          onPress={retry_delivery}
          disabled={retrying}
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "center",
            backgroundColor: "#fff",
            opacity: retrying ? 0.5 : 1,
            borderRadius: 30,
            padding: 10,
          }}
        >
          <Text
            style={{
              color: "#121212",
              fontFamily: "raleway-bold",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {retrying ? "Retrying..." : "Retry"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={cancel_delivery}
          disabled={cancelling}
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "center",
            borderColor: "#fff",
            borderWidth: 1,
            borderRadius: 30,
            padding: 10,
          }}
        >
          <Text
            style={{
              color: cancelling ? "#d7d7d7" : "#fff",
              fontFamily: "raleway-bold",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {cancelling ? "Cancelling..." : "Cancel"}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const AcceptedModal = () => {
  const { setDeliveryStatus, ongoingDeliveryData, resetDeliveryFlow } =
    useDeliverContext();
  const { region, mapRef } = useMapContext() as any;
  const { showNotification } = useNotificationContext() as any;

  const [isDeliveryExpanded, setIsDeliveryExpanded] = useState<boolean>(false);

  const track_rider = () => {
    setDeliveryStatus("track_driver");
    // animate to driver location if available
    setTimeout(() => {
      try {
        if (mapRef?.current && ongoingDeliveryData?.driver?.current_location) {
          const driverCoords =
            ongoingDeliveryData.driver.current_location.coordinates;
          const target = {
            latitude: driverCoords[0],
            longitude: driverCoords[1],
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          };
          mapRef.current.animateToRegion(target, 1000);
        } else if (mapRef?.current && region) {
          // fall back to region if no driver location
          const target = {
            latitude: region.latitude || 6.5244,
            longitude: region.longitude || 3.3792,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          };
          mapRef.current.animateToRegion(target, 1000);
        }
      } catch (e) {
        // ignore in demo
      }
    }, 800);
  };

  // Extract driver data from ongoingDeliveryData
  const driverData = ongoingDeliveryData?.driver;
  const driverName = driverData?.user?.name || "Unknown Driver";
  const vehicleInfo = driverData?.vehicle
    ? `${driverData.vehicle.brand} ${driverData.vehicle.model}`
    : "Unknown Vehicle";
  const driverRating = driverData?.rating || 0;
  const totalTrips = driverData?.total_trips || 0;
  const deliveryFare = ongoingDeliveryData?.fare || 0;

  // Extract delivery details from ongoingDeliveryData
  const deliveryId = ongoingDeliveryData?._id || "N/A";
  const packageData = ongoingDeliveryData?.package;
  const packageDescription = packageData?.description || "Package";
  const packageType = packageData?.type || "other";
  const packageAmount = packageData?.amount || deliveryFare;
  const isFragile = packageData?.fragile || false;
  const recipientName = ongoingDeliveryData?.to?.name || "Unknown Recipient";
  const recipientPhone = ongoingDeliveryData?.to?.phone || "N/A";
  const vehicleType = ongoingDeliveryData?.vehicle || "bike";

  // Get vehicle icon based on vehicle type
  const getVehicleIcon = (vehicle: string) => {
    switch (vehicle) {
      case "bike":
      case "motorcycle":
        return require("../assets/images/icons/motorcycle-icon.png");
      case "cab":
      case "car":
        return require("../assets/images/icons/sedan-icon.png");
      case "van":
        return require("../assets/images/icons/van-icon.png");
      case "truck":
        return require("../assets/images/icons/truck-icon.png");
      default:
        return require("../assets/images/icons/motorcycle-icon.png");
    }
  };

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Dispatch rider found
      </Text>

      <Text style={[styles.rideStatusText, { marginTop: 20 }]}>
        This rider is on the way...
      </Text>

      {/* Driver card with real data */}
      <View
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 10,
          backgroundColor: "#1e1e1e",
          borderWidth: 0.5,
          borderColor: "#2a2a2a",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Image
            source={
              (driverData as any)?.profile_img
                ? { uri: (driverData as any).profile_img }
                : require("../assets/images/user.png")
            }
            style={{ width: 50, height: 50, borderRadius: 25 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontFamily: "raleway-semibold" }}>
              {driverName}
            </Text>
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 12,
                marginTop: 7,
              }}
            >
              {vehicleInfo} • {driverRating.toFixed(1)} ★ • {totalTrips} trips
            </Text>
          </View>
        </View>
      </View>

      {/* Delivery details card with real data */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsDeliveryExpanded(!isDeliveryExpanded)}
        style={{
          marginTop: 12,
          padding: 14,
          borderRadius: 12,
          backgroundColor: "#1e1e1e",
          borderWidth: 0.5,
          borderColor: "#2a2a2a",
        }}
      >
        {/* ID at the top */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <View
            style={{
              backgroundColor: "#2a2a2a",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: "poppins-regular",
                fontSize: 10,
              }}
            >
              ID: #{deliveryId.slice(-9).toUpperCase()}
            </Text>
          </View>
          <Text
            style={{
              color: "#fff",
              fontFamily: "poppins-bold",
              fontSize: 14,
            }}
          >
            NGN {deliveryFare.toLocaleString()}
          </Text>
        </View>

        {/* Main content */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              backgroundColor: "#2a2a2a",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={getVehicleIcon(vehicleType)}
              style={{
                width: 24,
                height: 24,
                tintColor: "#fff",
              }}
              resizeMode="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontFamily: "raleway-semibold" }}>
              {packageType.charAt(0).toUpperCase() + packageType.slice(1)}{" "}
              Package
            </Text>
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {packageDescription} ({packageAmount})
              {isFragile ? " • Fragile" : ""}
            </Text>
          </View>
          <Feather
            name={isDeliveryExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#cfcfcf"
          />
        </View>

        {/* Expanded content - recipient info */}
        {isDeliveryExpanded && (
          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 0.5,
              borderTopColor: "#2a2a2a",
            }}
          >
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 11,
              }}
            >
              Recipient: {recipientName}
            </Text>
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 11,
                marginTop: 2,
              }}
            >
              Phone: {recipientPhone}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 50,
          backgroundColor: "#fff",
          marginTop: 20,
        }}
        onPress={track_rider}
      >
        <Text
          style={{
            fontFamily: "raleway-bold",
            color: "#121212",
            textAlign: "center",
          }}
        >
          Track rider
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          resetDeliveryFlow();
          showNotification("Delivery cancelled", "info");
        }}
        style={{ marginTop: 18 }}
        activeOpacity={0.8}
      >
        <Text
          style={{
            color: "#ff4d4f",
            textAlign: "center",
            fontFamily: "raleway-bold",
          }}
        >
          Cancel this delivery
        </Text>
      </TouchableOpacity>
    </>
  );
};

const TrackDriver = () => {
  const { setDeliveryStatus, ongoingDeliveryData } = useDeliverContext();
  const { mapRef } = useMapContext() as any;

  // Extract driver and delivery data from ongoingDeliveryData
  const driverData = ongoingDeliveryData?.driver;
  const driverName = driverData?.user?.name || "Unknown Driver";
  const vehicleInfo = driverData?.vehicle
    ? `${driverData.vehicle.color} ${driverData.vehicle.brand} ${driverData.vehicle.model}`
    : "Unknown Vehicle";
  const driverLocation = driverData?.current_location?.coordinates;
  const pickupLocation = ongoingDeliveryData?.pickup?.coordinates;

  const see_delivery_info = () => {
    if (mapRef?.current && driverLocation) {
      try {
        const coordinatesToFit = [
          { latitude: driverLocation[0], longitude: driverLocation[1] },
        ];

        // Add pickup location if available
        if (pickupLocation) {
          coordinatesToFit.push({
            latitude: pickupLocation[0],
            longitude: pickupLocation[1],
          });
        }

        mapRef.current.fitToCoordinates(coordinatesToFit, {
          edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      } catch (e) {
        // ignore errors in demo
      }
    }
    setDeliveryStatus("accepted");
  };

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center", fontSize: 16 }]}>
        Tracking rider...
      </Text>

      <View style={{ marginTop: 20 }}>
        <View style={{ alignItems: "center" }}>
          <Image
            source={
              (driverData as any)?.profile_img
                ? { uri: (driverData as any).profile_img }
                : require("../assets/images/user.png")
            }
            style={{ width: 70, height: 70, borderRadius: 40, marginTop: 10 }}
          />
          <Text
            style={{
              color: "#fff",
              fontFamily: "raleway-semibold",
              marginTop: 10,
            }}
          >
            {driverName}
          </Text>
          <Text
            style={{
              color: "#cfcfcf",
              fontFamily: "poppins-regular",
              fontSize: 12,
            }}
          >
            {vehicleInfo}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={see_delivery_info}
          style={{
            marginVertical: 30,
            padding: 10,
            borderRadius: 30,
            backgroundColor: "#fff",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontFamily: "raleway-bold",
              color: "#121212",
            }}
          >
            See delivery info
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const ArrivedModal = () => {
  const { setDeliveryStatus, ongoingDeliveryData } = useDeliverContext();

  // Extract driver data from ongoingDeliveryData
  const driverData = ongoingDeliveryData?.driver;
  const driverName = driverData?.user?.name || "Unknown Driver";
  const vehicleInfo = driverData?.vehicle
    ? `${driverData.vehicle.color} ${driverData.vehicle.brand} ${driverData.vehicle.model}`
    : "Unknown Vehicle";
  const deliveryFare = ongoingDeliveryData?.fare || 0;

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Dispatch Rider arrived
      </Text>

      <Text style={[styles.rideStatusText, { marginTop: 20 }]}>
        Your rider has arrived!
      </Text>
      {/* Driver card (same layout as AcceptedModal) */}
      <View
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 10,
          backgroundColor: "#1e1e1e",
          borderWidth: 0.5,
          borderColor: "#2a2a2a",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Image
            source={
              (driverData as any)?.profile_img
                ? { uri: (driverData as any).profile_img }
                : require("../assets/images/user.png")
            }
            style={{ width: 50, height: 50, borderRadius: 25 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontFamily: "raleway-semibold" }}>
              {driverName}
            </Text>
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 12,
                marginTop: 7,
              }}
            >
              {vehicleInfo}
            </Text>
          </View>
          <Text style={{ color: "#fff", fontFamily: "poppins-bold" }}>
            NGN {deliveryFare.toLocaleString()}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 50,
          backgroundColor: "#fff",
          marginTop: 30,
        }}
        onPress={() => setDeliveryStatus("paying")}
      >
        <Text
          style={{
            fontFamily: "raleway-bold",
            color: "#121212",
            textAlign: "center",
          }}
        >
          Pay NGN {deliveryFare.toLocaleString()}
        </Text>
      </TouchableOpacity>
    </>
  );
};

const PickedUpModal = () => {
  const { setDeliveryStatus, ongoingDeliveryData } = useDeliverContext();

  // Extract driver and delivery data from ongoingDeliveryData
  const driverData = ongoingDeliveryData?.driver;
  const driverName = driverData?.user?.name || "Unknown Driver";
  const vehicleInfo = driverData?.vehicle
    ? `${driverData.vehicle.color} ${driverData.vehicle.brand} ${driverData.vehicle.model}`
    : "Unknown Vehicle";
  const deliveryFare = ongoingDeliveryData?.fare || 0;
  const packageData = ongoingDeliveryData?.package;
  const packageDescription = packageData?.description || "Package";
  const recipientName = ongoingDeliveryData?.to?.name || "Unknown Recipient";

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Package picked up
      </Text>

      <Text style={[styles.rideStatusText, { marginTop: 20 }]}>
        {driverName} has up your package and is about heading to drop off.
      </Text>

      {/* Route display */}
      <View
        style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 10,
          backgroundColor: "#1e1e1e",
          borderWidth: 0.5,
          borderColor: "#2a2a2a",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 10,
              }}
            >
              FROM
            </Text>
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-semibold",
                fontSize: 12,
              }}
              numberOfLines={1}
            >
              {ongoingDeliveryData?.pickup?.address || "Pickup location"}
            </Text>
          </View>
          <Feather name="arrow-right" size={18} color="#8d8d8d" />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 10,
              }}
            >
              TO
            </Text>
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-semibold",
                fontSize: 12,
              }}
              numberOfLines={1}
            >
              {ongoingDeliveryData?.dropoff?.address || "Drop off location"}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setDeliveryStatus("track_delivery")}
        style={{
          marginTop: 30,
          padding: 12,
          borderRadius: 30,
          backgroundColor: "#fff",
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontFamily: "raleway-bold",
            color: "#121212",
          }}
        >
          Track delivery
        </Text>
      </TouchableOpacity>
    </>
  );
};

const PayingModal = () => {
  const { setDeliveryStatus, ongoingDeliveryData, payForDelivery, paying } =
    useDeliverContext();
  const { userWalletBal, getWalletBalance } = useWalletContext();
  const { showNotification } = useNotificationContext() as any;

  const deliveryFare = ongoingDeliveryData?.fare || 0;
  const delivery_id = ongoingDeliveryData?._id;

  // Fetch wallet balance when modal loads
  React.useEffect(() => {
    getWalletBalance("User").catch(() => {
      // Handle error silently or show notification if needed
    });
  }, []);

  const pay_func = async () => {
    try {
      if (delivery_id) {
        if (userWalletBal < ongoingDeliveryData.fare) {
          showNotification("Insuficient balance, fund wallet", "error");
          setDeliveryStatus("arrived");
          return;
        }
        await payForDelivery(delivery_id);
        setDeliveryStatus("paid");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Text
        style={[
          styles.header_text,
          { textAlign: "center", fontFamily: "poppins-bold" },
        ]}
      >
        Confirm payment (NGN {deliveryFare.toLocaleString()})
      </Text>

      <View style={{ marginTop: 25, paddingHorizontal: 10 }}>
        <Text style={{ color: "#fff", fontFamily: "poppins-regular" }}>
          Wallet balance: {userWalletBal.toLocaleString()} NGN
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 20,
            marginTop: 25,
          }}
        >
          <TouchableOpacity
            onPress={pay_func}
            disabled={paying}
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              paddingHorizontal: 30,
              paddingVertical: 10,
              flex: 1,
              opacity: paying ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                color: "#121212",
                fontFamily: "raleway-bold",
                textAlign: "center",
              }}
            >
              {paying ? "Confirming..." : "Confirm"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDeliveryStatus("arrived")}
            style={{
              borderRadius: 20,
              paddingHorizontal: 30,
              paddingVertical: 10,
              borderStyle: "solid",
              borderWidth: 1,
              borderColor: "#fff",
              flex: 1,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-bold",
                textAlign: "center",
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const PaidModal = () => {
  const { setDeliveryStatus, ongoingDeliveryData } = useDeliverContext();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Payment successful
      </Text>
      <Text
        style={[styles.rideStatusText, { marginTop: 20, textAlign: "center" }]}
      >
        Thanks — your delivery has been paid for
      </Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setInfoModalOpen(true)}
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 30,
          backgroundColor: "#fff",
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontFamily: "raleway-bold",
            color: "#121212",
          }}
        >
          See delivery info
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setReportModalOpen(true)}
        style={{ marginTop: 20 }}
        activeOpacity={0.7}
      >
        <Text
          style={{
            textAlign: "center",
            fontFamily: "raleway-semibold",
            fontSize: 14,
            color: "#ff4444",
          }}
        >
          Report dispatch rider
        </Text>
      </TouchableOpacity>

      <ReportDriverModal
        visible={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        driverId={ongoingDeliveryData?.driver._id}
        rideId={undefined}
      />

      <DeliveryInfoModal
        visible={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        delivery={ongoingDeliveryData}
      />
    </>
  );
};

const InTransitModal = () => {
  const { setDeliveryStatus, ongoingDeliveryData } = useDeliverContext();
  const { mapRef } = useMapContext() as any;
  const { showNotification } = useNotificationContext() as any;

  // Extract real delivery data from ongoingDeliveryData
  const driverData = ongoingDeliveryData?.driver;
  const driverName = driverData?.user?.name || "Unknown Driver";
  const driverPhone = driverData?.user?.phone || "+234xxxxxxxxx";
  const vehicleInfo = driverData?.vehicle
    ? `${driverData.vehicle.color} ${driverData.vehicle.brand} ${driverData.vehicle.model}`
    : "Unknown Vehicle";
  const driverRating = driverData?.rating || 0;
  const driverLocation = driverData?.current_location?.coordinates;

  // Extract delivery details
  const deliveryId = ongoingDeliveryData?._id || "N/A";
  const deliveryFare = ongoingDeliveryData?.fare || 0;
  const packageData = ongoingDeliveryData?.package;
  const packageDescription = packageData?.description || "Package";
  const packageType = packageData?.type || "other";
  const packageAmount = packageData?.amount || deliveryFare;
  const isFragile = packageData?.fragile || false;
  const recipientName = ongoingDeliveryData?.to?.name || "Unknown Recipient";
  const recipientPhone = ongoingDeliveryData?.to?.phone || "N/A";
  const vehicleType = ongoingDeliveryData?.vehicle || "bike";
  const eta = ongoingDeliveryData?.duration_mins || 5;

  // Calculate estimated progress (this could be enhanced with real-time data)
  const [progress, setProgress] = React.useState<number>(0.45);
  const [isDeliveryExpanded, setIsDeliveryExpanded] =
    React.useState<boolean>(false);

  // Simulate progress while modal is open (replace with real progress tracking later)
  React.useEffect(() => {
    let id: any;
    id = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(0.98, +(p + Math.random() * 0.06).toFixed(2));
        return next;
      });
    }, 2500);

    return () => clearInterval(id);
  }, []);

  // Get vehicle icon based on vehicle type
  const getVehicleIcon = (vehicle: string) => {
    switch (vehicle) {
      case "bike":
      case "motorcycle":
        return require("../assets/images/icons/motorcycle-icon.png");
      case "cab":
      case "car":
        return require("../assets/images/icons/sedan-icon.png");
      case "van":
        return require("../assets/images/icons/van-icon.png");
      case "truck":
        return require("../assets/images/icons/truck-icon.png");
      default:
        return require("../assets/images/icons/motorcycle-icon.png");
    }
  };

  const focusOnRider = () => {
    try {
      if (mapRef?.current && driverLocation) {
        mapRef.current.animateToRegion(
          {
            latitude: driverLocation[0],
            longitude: driverLocation[1],
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          800
        );
        showNotification("Focusing on rider", "success");
      }
    } catch (e) {
      // ignore errors
    }
  };

  const callRider = async () => {
    try {
      const url = `tel:${driverPhone}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showNotification("Cannot open dialer on this device", "error");
      }
    } catch (e) {
      showNotification("Failed to initiate call", "error");
    }
  };

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Delivery in transit
      </Text>

      <Text style={[styles.rideStatusText, { marginTop: 12, fontSize: 13 }]}>
        ETA • {eta} mins
      </Text>

      {/* Driver card */}
      <View
        style={{
          marginTop: 18,
          padding: 14,
          borderRadius: 12,
          backgroundColor: "#1e1e1e",
          borderWidth: 0.5,
          borderColor: "#2a2a2a",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Image
          source={
            (driverData as any)?.profile_img
              ? { uri: (driverData as any).profile_img }
              : require("../assets/images/user.png")
          }
          style={{ width: 58, height: 58, borderRadius: 30 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontFamily: "raleway-semibold" }}>
            {driverName}
          </Text>
          <Text
            style={{
              color: "#cfcfcf",
              fontFamily: "poppins-regular",
              fontSize: 12,
            }}
          >
            {vehicleInfo}
          </Text>
          <Text
            style={{
              color: "#cfcfcf",
              fontFamily: "poppins-regular",
              fontSize: 12,
            }}
          >
            {driverRating.toFixed(1)} ★
          </Text>
        </View>
        <TouchableOpacity onPress={callRider} style={{ padding: 8 }}>
          <Feather name="phone" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Delivery details card */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsDeliveryExpanded(!isDeliveryExpanded)}
        style={{
          marginTop: 12,
          padding: 14,
          borderRadius: 12,
          backgroundColor: "#1e1e1e",
          borderWidth: 0.5,
          borderColor: "#2a2a2a",
        }}
      >
        {/* ID at the top */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <View
            style={{
              backgroundColor: "#2a2a2a",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: "poppins-regular",
                fontSize: 10,
              }}
            >
              ID: #{deliveryId.slice(-9).toUpperCase()}
            </Text>
          </View>
          <Text
            style={{
              color: "#fff",
              fontFamily: "poppins-bold",
              fontSize: 14,
            }}
          >
            NGN {deliveryFare.toLocaleString()}
          </Text>
        </View>

        {/* Main content */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              backgroundColor: "#2a2a2a",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={getVehicleIcon(vehicleType)}
              style={{
                width: 24,
                height: 24,
                tintColor: "#fff",
              }}
              resizeMode="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontFamily: "raleway-semibold" }}>
              {packageType.charAt(0).toUpperCase() + packageType.slice(1)}{" "}
              Package
            </Text>
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {packageDescription} ({packageAmount})
              {isFragile ? " • Fragile" : ""}
            </Text>
          </View>
          <Feather
            name={isDeliveryExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#cfcfcf"
          />
        </View>

        {/* Expanded content - recipient info */}
        {isDeliveryExpanded && (
          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 0.5,
              borderTopColor: "#2a2a2a",
            }}
          >
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 11,
              }}
            >
              Recipient: {recipientName}
            </Text>
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 11,
                marginTop: 2,
              }}
            >
              Phone: {recipientPhone}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 30 }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={focusOnRider}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            backgroundColor: "#fff",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontFamily: "raleway-bold",
              color: "#121212",
            }}
          >
            Focus on rider
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setDeliveryStatus("")}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#fff",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontFamily: "raleway-bold",
              color: "#fff",
            }}
          >
            Close
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const RateModal = () => {
  const { rating, review, setRating, setReview, createRating, ratingLoading } =
    useRatingContext();

  const { resetDeliveryFlow, ongoingDeliveryData } = useDeliverContext();

  const rate_driver = async () => {
    try {
      ongoingDeliveryData &&
        (await createRating(
          ongoingDeliveryData._id,
          ongoingDeliveryData.driver._id
        ));
      resetDeliveryFlow();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.header_text}>Delivery completed!</Text>
      <View
        style={{
          flex: 1,
          paddingBottom: 20,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Image
            source={
              ongoingDeliveryData?.driver.profile_img
                ? { uri: ongoingDeliveryData.driver.profile_img }
                : require("../assets/images/user.png")
            }
            style={{
              width: 70,
              height: 70,
              borderRadius: 40,
              marginTop: 20,
            }}
          />
          <Text
            style={{
              color: "#fff",
              fontFamily: "raleway-regular",
              marginTop: 10,
            }}
          >
            How was this driver?
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: 20,
              marginTop: 20,
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <FontAwesome
                  name={rating >= star ? "star" : "star-o"}
                  size={30}
                  color="#fff"
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ width: "100%" }}>
            <TextInput
              value={review}
              onChangeText={setReview}
              style={{
                backgroundColor: "transparent",
                borderColor: "#fff",
                borderWidth: 1,
                color: "#fff",
                borderRadius: 10,
                padding: 20,
                marginTop: 20,
                fontFamily: "raleway-regular",
              }}
              placeholder="Write a review"
              placeholderTextColor="#aaaaaa"
            />
          </View>
        </View>

        <View style={{ marginTop: 30 }}>
          <Text style={{ color: "#fff", fontFamily: "raleway-bold" }}>
            Delivery summary
          </Text>
          {ongoingDeliveryData && (
            <RideRoute
              from={ongoingDeliveryData?.pickup.address || "Pickup location"}
              to={ongoingDeliveryData.dropoff.address || "Drop-off location"}
            />
          )}

          <Text
            style={{
              color: "#d2ceceff",
              fontFamily: "raleway-bold",
              fontSize: 14,
              marginBottom: 10,
            }}
          >
            **Package delivered {ongoingDeliveryData?.distance_km}km in{" "}
            {ongoingDeliveryData?.duration_mins} mins
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-regular",
                fontSize: 18,
              }}
            >
              Total fare:
            </Text>
            <Text style={styles.priceText}>
              NGN {ongoingDeliveryData?.fare.toLocaleString()}(Paid)
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 20,
            marginTop: 50,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={resetDeliveryFlow}
            style={{
              backgroundColor: "transparent",
              borderColor: "#fff",
              borderWidth: 1,
              borderRadius: 50,
              width: 100,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-bold",
                textAlign: "center",
              }}
            >
              Skip
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={rate_driver}
            disabled={ratingLoading}
            activeOpacity={0.7}
            style={{
              backgroundColor: "#fff",
              borderRadius: 50,
              paddingHorizontal: 20,
              paddingVertical: 10,
              flex: 1,
              opacity: ratingLoading ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                color: "#121212",
                fontFamily: "raleway-bold",
                textAlign: "center",
              }}
            >
              {ratingLoading ? "Submitting" : "Submit review"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Reusable ride type card used in ChooseRideModal
const RideTypeCard: FC<{
  id: "bike" | "cab" | "van" | "truck";
  title: string;
  icon: any;
  subtext?: string;
  amount?: number;
  selected?: boolean;
  onPress?: () => void;
}> = ({ title, icon, subtext, amount, selected, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.rideCard, selected ? styles.rideCardSelected : null]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Image source={icon} style={{ height: 50, width: 50 }} />
        <View style={{ width: "100%", flexShrink: 1 }}>
          <Text
            style={[
              { color: "#fff", fontFamily: "raleway-semibold" },
              selected && styles.select_ride_text_active,
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              {
                color: "#fff",
                fontFamily: "poppins-regular",
                fontSize: 10,
              },
              selected && styles.select_ride_text_active,
            ]}
          >
            {subtext}
          </Text>
          <Text
            style={[
              {
                color: selected ? "#121212" : "#fff",
                textAlign: "right",
                fontFamily: "poppins-bold",
                fontSize: 16,
              },
            ]}
          >
            NGN {amount?.toLocaleString() ?? "----"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  modal: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 5,
    paddingHorizontal: 15,
  },
  container: {
    paddingHorizontal: 5,
    backgroundColor: "#121212",
  },
  header: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "raleway-bold",
    marginBottom: 8,
  },
  empty: {
    color: "#b0b0b0",
  },
  card: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
  },
  title: {
    color: "#fff",
    fontFamily: "raleway-semibold",
  },
  sub: {
    color: "#cfcfcf",
    fontSize: 12,
  },
  price: {
    color: "#fff",
    marginTop: 8,
    fontFamily: "poppins-bold",
  },
  actions: {
    justifyContent: "space-around",
    alignItems: "flex-end",
  },
  btn: {
    padding: 6,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#fff",
    marginBottom: 6,
  },
  cancelBtn: {
    backgroundColor: "#ff4d4f",
  },
  btnText: {
    color: "#121212",
    fontFamily: "raleway-bold",
  },

  form: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  text_inp_container: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    backgroundColor: "#3f3f3f",
    marginTop: 10,
    borderRadius: 7,
  },
  start_text_input: {
    backgroundColor: "#2a2a2a",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    fontFamily: "raleway-bold",
    fontSize: 16,
    color: "#fff",
  },
  text_input: {
    backgroundColor: "#515151",
    borderRadius: 5,
    marginTop: 5,
    width: "100%",
    color: "#ffffff",
    paddingHorizontal: 15,
    fontFamily: "raleway-semibold",
  },

  header_text: {
    fontFamily: "raleway-bold",
    color: "#fff",
    fontSize: 20,
  },
  rideStatusText: {
    color: "#ffffffff",
    fontSize: 14,
    fontFamily: "raleway-regular",
    marginBottom: 10,
    lineHeight: 22,
  },
  select_ride_container: {
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#515151",
    borderStyle: "solid",
    paddingBottom: 20,
  },
  select_ride_box: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 7,
    borderColor: "grey",
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: 20,
    padding: 5,
    paddingHorizontal: 10,
    backgroundColor: "grey",
  },
  rideCard: {
    width: 250,
    marginRight: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "grey",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rideCardSelected: {
    backgroundColor: "#fff",
  },
  select_ride_box_active: {
    backgroundColor: "#fff",
  },
  select_ride_text_active: {
    color: "#121212",
  },
  suggestions_container: {
    flex: 1,
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: "#515151",
    borderStyle: "solid",
    paddingVertical: 10,
  },
  suggestion_header_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  suggestion_sub_text: {
    color: "#b0b0b0",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginTop: 5,
  },
  suggestion_box: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 10,
    paddingRight: 10,
  },
  route_inp_container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  route_input: {
    backgroundColor: "#515151",
    borderRadius: 5,
    marginTop: 5,
    width: "95%",
    color: "#ffffff",
    paddingHorizontal: 20,
    fontFamily: "raleway-semibold",
  },
  priceText: {
    color: "#fff",
    fontFamily: "poppins-bold",
    fontSize: 18,
  },
});

export default DeliveryRouteModal;

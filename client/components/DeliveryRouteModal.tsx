import React, { FC, useRef, useMemo, useState } from "react";
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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import BottomSheet, {
  BottomSheetView,
  TouchableWithoutFeedback,
} from "@gorhom/bottom-sheet";
import { useDeliverContext, Delivery } from "../context/DeliverConrtext";
import { useMapContext } from "../context/MapContext";
import { useNotificationContext } from "../context/NotificationContext";
import { useAuthContext } from "../context/AuthContext";
import { useWalletContext } from "../context/WalletContext";
import { Feather, FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import { ScrollView } from "react-native-gesture-handler";

const DeliveryRouteModal: FC = () => {
  const {
    activeDeliveries,
    fetchUserActiveDeliveries,
    payForDelivery,
    updateDeliveryStatus,
    rebookDelivery,
    cancelDelivery,
    deliveryStatus,
    setDeliveryStatus,
    deliveryModalRef,
  } = useDeliverContext();

  const { setDestinationCoords, setDestination, setMapPadding } =
    useMapContext() as any;
  const { showNotification } = useNotificationContext() as any;

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

    if (index < 4)
      setMapPadding((prev: any) => ({ ...prev, bottom: sheetHeight + 20 }));
  };

  React.useEffect(() => {
    if (deliveryStatus !== "accepted") return;
    const t = setTimeout(() => {
      setDeliveryStatus("arrived");
      try {
        showNotification("Dispatch rider has arrived (demo)", "success");
      } catch (e) {
        // ignore if notification context isn't available
      }
    }, 5000);

    return () => clearTimeout(t);
  }, [deliveryStatus]);

  return (
    <BottomSheet
      index={0}
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
        {deliveryStatus === "accepted" && <AcceptedModal />}
        {deliveryStatus === "track_driver" && <TrackDriver />}
        {deliveryStatus === "arrived" && <ArrivedModal />}
        {deliveryStatus === "paying" && <PayingModal />}
        {deliveryStatus === "paid" && <PaidModal />}
        {deliveryStatus === "track_delivery" && <TrackDelivery />}
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
  const { setDeliveryStatus } = useDeliverContext();
  const { showNotification } = useNotificationContext() as any;

  const [recipientName, setRecipientName] = useState<string>("");
  const [recipientPhone, setRecipientPhone] = useState<string>("");

  const [description, setDescription] = useState<string>("");
  const [pkgType, setPkgType] = useState<string>("document");
  const [fragile, setFragile] = useState<boolean>(false);
  const [value, setValue] = useState<string>("");

  const submit = () => {
    if (!recipientName.trim()) {
      showNotification("Please enter recipient name", "error");
      return;
    }
    if (!recipientPhone.trim()) {
      showNotification("Please enter recipient phone", "error");
      return;
    }

    showNotification("Delivery details saved", "success");
    setDeliveryStatus("");
  };

  return (
    <View style={[styles.container, { paddingTop: 12 }]}>
      <Text style={[styles.header, { marginBottom: 12 }]}>Recipient info</Text>

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

      <View style={{ marginVertical: 12 }}>
        {/* Row: fragile selectors on the left, amount input on the right */}
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
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              style={[styles.text_input]}
              selectionColor="#fff"
            />
          </View>
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

      <View style={{ marginBottom: 12 }}>
        <Text
          style={{
            color: "#cfcfcf",
            marginBottom: 6,
            fontFamily: "raleway-semibold",
          }}
        >
          Type
        </Text>
        <View
          style={{
            backgroundColor: "#2a2a2a",
            borderRadius: 8,
            paddingHorizontal: 8,
          }}
        >
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
          </Picker>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 25 }}>
        <TouchableOpacity
          style={[styles.btn, { flex: 1 }]}
          onPress={() => setDeliveryStatus("route")}
        >
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
          onPress={() => setDeliveryStatus("")}
        >
          <Text style={{ fontFamily: "raleway-semibold", color: "#fff" }}>
            Close
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const RouteModal: FC = () => {
  const { setDeliveryStatus } = useDeliverContext();

  const [pickup, setPickup] = useState<string>("");
  const [dropoff, setDropOff] = useState<string>("");

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
        <Text style={styles.suggestion_header_text}>Saved places</Text>
        <Text style={styles.suggestion_sub_text}>— work, home, recent</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setDeliveryStatus("vehicle")}
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
  const { setDeliveryStatus } = useDeliverContext();
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
            amount={5000}
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
            amount={5000}
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
            amount={5000}
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
            amount={5000}
            selected={selectedRideType === "truck"}
            onPress={() => {
              setSelectedRideType("truck");
            }}
          />
        </ScrollView>
      </View>
      <TouchableWithoutFeedback>
        <TouchableOpacity
          onPress={() => setDeliveryStatus("searching")}
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
  const { deliveryStatus, setDeliveryStatus } = useDeliverContext();
  const { region, mapRef } = useMapContext() as any;
  const { showNotification } = useNotificationContext() as any;

  const [searchText, setSearchText] = useState<string>(
    "Searching for dispatch riders..."
  );

  React.useEffect(() => {
    // only run the dummy flow when the sheet is in searching state
    if (deliveryStatus !== "searching") return;

    setSearchText("Searching for dispatch riders...");
    const id = setTimeout(() => {
      setSearchText("Dispatch rider found!");
      // advance to accepted state (dummy)
      setDeliveryStatus("accepted");
      showNotification("Dispatch rider assigned (demo)", "success");
    }, 3000);

    return () => clearTimeout(id);
  }, [deliveryStatus]);

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Searching
      </Text>

      <View style={{ marginTop: 20 }}>
        {deliveryStatus === "searching" && (
          <ActivityIndicator
            size={"large"}
            color={"#fff"}
            style={{ marginBottom: 20, marginTop: 10 }}
          />
        )}
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

      {/* Simple cancel action while searching */}
      <View style={{ marginTop: 30 }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setDeliveryStatus("")}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 50,
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: "#fff",
          }}
        >
          <Text
            style={{
              fontFamily: "raleway-bold",
              color: "#fff",
              textAlign: "center",
            }}
          >
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const AcceptedModal = () => {
  const { deliveryStatus, setDeliveryStatus } = useDeliverContext();
  const { region, mapRef } = useMapContext() as any;
  const { showNotification } = useNotificationContext() as any;

  // Demo: once a dispatch rider is assigned (accepted), auto-transition to "arrived"
  // after ~5 seconds to simulate the rider reaching the pickup.
  React.useEffect(() => {
    if (deliveryStatus !== "accepted") return;
    const t = setTimeout(() => {
      setDeliveryStatus("arrived");
      try {
        showNotification("Dispatch rider has arrived (demo)", "success");
      } catch (e) {
        // ignore if notification context isn't available
      }
    }, 5000);

    return () => clearTimeout(t);
  }, [deliveryStatus]);

  const track_rider = () => {
    setDeliveryStatus("track_driver");
    // demo: animate to a mocked location if mapRef available
    setTimeout(() => {
      try {
        if (mapRef?.current) {
          // fall back to region or a small offset
          const target = region
            ? {
                latitude: region.latitude || 6.5244,
                longitude: region.longitude || 3.3792,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }
            : {
                latitude: 6.5244,
                longitude: 3.3792,
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

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Dispatch rider found
      </Text>

      <Text style={[styles.rideStatusText, { marginTop: 20 }]}>
        This rider is on the way...
      </Text>

      {/* Minimal driver card (demo data) */}
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
            source={require("../assets/images/black-profile.jpeg")}
            style={{ width: 50, height: 50, borderRadius: 25 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontFamily: "raleway-semibold" }}>
              John Doe
            </Text>
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 12,
              }}
            >
              Bike • 4.9 ★ • 120 trips
            </Text>
          </View>
          <Text style={{ color: "#fff", fontFamily: "poppins-bold" }}>
            NGN 1,200
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
        onPress={() => setDeliveryStatus("")}
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
  const { setDeliveryStatus } = useDeliverContext();
  const { mapRef } = useMapContext() as any;

  // Local demo delivery for tracking UI (no real API calls)
  const delivery: any = {
    driver: {
      user: { name: "John Doe" },
      vehicle: { brand: "Yamaha", model: "- MT-15" },
      current_location: { coordinates: [6.5244, 3.3792] },
    },
    pickup: { coordinates: [6.523, 3.38] },
  };

  const see_delivery_info = () => {
    if (mapRef?.current && delivery?.driver?.current_location) {
      const coords = delivery.driver.current_location.coordinates;
      try {
        mapRef.current.fitToCoordinates(
          [
            { latitude: coords[0], longitude: coords[1] },
            ...(delivery.pickup?.coordinates
              ? [
                  {
                    latitude: delivery.pickup.coordinates[0],
                    longitude: delivery.pickup.coordinates[1],
                  },
                ]
              : []),
          ],
          {
            edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
            animated: true,
          }
        );
      } catch (e) {
        // ignore in demo
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
            source={require("../assets/images/black-profile.jpeg")}
            style={{ width: 70, height: 70, borderRadius: 40, marginTop: 10 }}
          />
          <Text
            style={{
              color: "#fff",
              fontFamily: "raleway-semibold",
              marginTop: 10,
            }}
          >
            {delivery.driver.user.name}
          </Text>
          <Text
            style={{
              color: "#cfcfcf",
              fontFamily: "poppins-regular",
              fontSize: 12,
            }}
          >
            {delivery.driver.vehicle.brand} {delivery.driver.vehicle.model}
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
  const { setDeliveryStatus } = useDeliverContext();

  // Dummy delivery for demo
  const delivery: any = {
    fare: 1200,
    driver: {
      user: { name: "John Doe" },
      vehicle: { brand: "Yamaha", model: "MT-15" },
      rating: 4.9,
      trips: 120,
    },
  };

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
            source={require("../assets/images/black-profile.jpeg")}
            style={{ width: 50, height: 50, borderRadius: 25 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontFamily: "raleway-semibold" }}>
              {delivery.driver.user.name}
            </Text>
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 12,
              }}
            >
              {delivery.driver.vehicle.brand} • {delivery.driver.rating} ★ •{" "}
              {delivery.driver.trips} trips
            </Text>
          </View>
          <Text style={{ color: "#fff", fontFamily: "poppins-bold" }}>
            NGN {delivery.fare.toLocaleString()}
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
          Pay NGN {delivery.fare.toLocaleString()}
        </Text>
      </TouchableOpacity>
    </>
  );
};

const PayingModal = () => {
  const { setDeliveryStatus } = useDeliverContext();
  const { showNotification } = useNotificationContext() as any;

  const [paying, setPaying] = useState<boolean>(false);

  // Dummy delivery & wallet for demo
  const delivery: any = { fare: 1200, _id: "demo-delivery-1" };
  const userWalletBal = 5000;

  const pay_func = async () => {
    setPaying(true);
    // simulate initiating real payment then move to processing screen
    setTimeout(() => {
      setPaying(false);
      // move to processing state which will itself simulate completion
      setDeliveryStatus("paid");
    }, 600);
  };

  return (
    <>
      <Text
        style={[
          styles.header_text,
          { textAlign: "center", fontFamily: "poppins-bold" },
        ]}
      >
        Confirm payment (NGN {delivery.fare.toLocaleString()})
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
            onPress={() => setDeliveryStatus("paid")}
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

const ProcessingPaymentModal = () => {
  const { setDeliveryStatus } = useDeliverContext();
  const { showNotification } = useNotificationContext() as any;

  React.useEffect(() => {
    const id = setTimeout(() => {
      try {
        showNotification("Payment processed (demo)", "success");
      } catch (e) {}
      setDeliveryStatus("paid");
    }, 1500);

    return () => clearTimeout(id);
  }, []);

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Processing payment
      </Text>
      <Text style={[styles.rideStatusText, { marginTop: 20 }]}>
        Please wait while we confirm your payment...
      </Text>
      <View style={{ marginTop: 30, alignItems: "center" }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    </>
  );
};

const PaidModal = () => {
  const { setDeliveryStatus } = useDeliverContext();

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Payment successful
      </Text>
      <Text style={[styles.rideStatusText, { marginTop: 20 }]}>
        Thanks — your delivery has been paid (demo)
      </Text>
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

const TrackDelivery = () => {
  const { setDeliveryStatus } = useDeliverContext();
  const { mapRef } = useMapContext() as any;
  const { showNotification } = useNotificationContext() as any;

  // Dummy delivery data for demo
  const delivery: any = {
    id: "demo-delivery-1",
    status: "en_route",
    eta: "5 mins",
    progress: 0.45,
    driver: {
      name: "Jane Rider",
      phone: "+2348012345678",
      vehicle: "Yamaha MT-15",
      rating: 4.9,
      avatar: require("../assets/images/black-profile.jpeg"),
    },
    pickup: { latitude: 6.523, longitude: 3.38 },
    current_location: { latitude: 6.5244, longitude: 3.3792 },
  };

  const [progress, setProgress] = React.useState<number>(delivery.progress);
  const [isDeliveryExpanded, setIsDeliveryExpanded] =
    React.useState<boolean>(false);

  // Simulate progress while modal is open
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

  const focusOnRider = () => {
    try {
      if (mapRef?.current) {
        mapRef.current.animateToRegion(
          {
            latitude: delivery.current_location.latitude,
            longitude: delivery.current_location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          800
        );
        showNotification("Focusing on rider (demo)", "info");
      }
    } catch (e) {
      // ignore in demo
    }
  };

  const callRider = async () => {
    try {
      const url = `tel:${delivery.driver.phone}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showNotification("Cannot open dialer on this device", "error");
      }
    } catch (e) {
      showNotification("Failed to initiate call (demo)", "error");
    }
  };

  return (
    <>
      <Text style={[styles.header_text, { textAlign: "center" }]}>
        Delivery in transit
      </Text>

      <Text style={[styles.rideStatusText, { marginTop: 12, fontSize: 13 }]}>
        ETA • {delivery.eta}
      </Text>

      <View style={{ marginTop: 12 }}>
        <View
          style={{
            height: 10,
            backgroundColor: "#2a2a2a",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${Math.round(progress * 100)}%`,
              height: 10,
              backgroundColor: "#fff",
            }}
          />
        </View>
        <Text
          style={{
            color: "#cfcfcf",
            marginTop: 8,
            fontFamily: "poppins-regular",
            fontSize: 12,
          }}
        >
          {Math.round(progress * 100)}% completed
        </Text>
      </View>

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
          source={delivery.driver.avatar}
          style={{ width: 58, height: 58, borderRadius: 30 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontFamily: "raleway-semibold" }}>
            {delivery.driver.name}
          </Text>
          <Text
            style={{
              color: "#cfcfcf",
              fontFamily: "poppins-regular",
              fontSize: 12,
            }}
          >
            {delivery.driver.vehicle}
          </Text>
          <Text
            style={{
              color: "#cfcfcf",
              fontFamily: "poppins-regular",
              fontSize: 12,
            }}
          >
            {delivery.driver.rating} ★
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
              ID: #D001
            </Text>
          </View>
          <Text
            style={{
              color: "#fff",
              fontFamily: "poppins-bold",
              fontSize: 14,
            }}
          >
            NGN 250,000
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
            <FontAwesome6 name="box" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontFamily: "raleway-semibold" }}>
              Electronics Package
            </Text>
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 12,
                marginTop: 2,
              }}
            >
              iPhone XR • Fragile
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
              Recipient: John Smith
            </Text>
            <Text
              style={{
                color: "#cfcfcf",
                fontFamily: "poppins-regular",
                fontSize: 11,
                marginTop: 2,
              }}
            >
              Phone: +2348123456789
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
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
    color: "#fff",
    fontSize: 14,
    fontFamily: "raleway-bold",
    marginBottom: 10,
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
    fontFamily: "raleway-semibold",
    fontSize: 14,
  },
  suggestion_sub_text: {
    color: "#b0b0b0",
    fontFamily: "raleway-semibold",
    fontSize: 12,
    marginTop: 5,
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
});

export default DeliveryRouteModal;

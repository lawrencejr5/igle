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
import { Feather, FontAwesome6 } from "@expo/vector-icons";
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
        {deliveryStatus === "vehicle" && <ChooseVehicleModal />}
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

    // For now just close modal and show success. Integration with requestDelivery
    // (and persisting these details) can be wired later to DeliverContext.
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
        <Text
          style={{
            color: "#cfcfcf",
            marginBottom: 6,
            fontFamily: "raleway-bold",
          }}
        >
          Fragile?
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
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
          onPress={() => setDeliveryStatus("vehicle")}
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
          <Feather name="x" size={20} color={"#fff"} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ChooseVehicleModal = () => {
  const [selectedRideType, setSelectedRideType] = useState<
    "bike" | "cab" | "van" | "truck"
  >("bike");
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
        <View
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
        </View>
      </TouchableWithoutFeedback>
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
});

export default DeliveryRouteModal;

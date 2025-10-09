import React, { FC, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useDeliverContext, Delivery } from "../context/DeliverConrtext";
import { useMapContext } from "../context/MapContext";
import { useNotificationContext } from "../context/NotificationContext";

const DeliveryRouteModal: FC = () => {
  const {
    activeDeliveries,
    fetchUserActiveDeliveries,
    payForDelivery,
    updateDeliveryStatus,
    rebookDelivery,
    cancelDelivery,
  } = useDeliverContext();

  const { setDestinationCoords, setDestination, setMapPadding } =
    useMapContext() as any;
  const { showNotification } = useNotificationContext() as any;

  const deliveryRouteModalRef = useRef<BottomSheet | null>(null);

  const windowHeight = Dimensions.get("window").height;
  const snapPoints = useMemo(
    () => ["25%", "32%", "40%", "60%", "80%", "94%"],
    []
  );

  const handleSheetChange = (index: number) => {
    const snapValue = snapPoints[index];
    let sheetHeight = 0;

    if (typeof snapValue === "string" && snapValue.includes("%")) {
      const percent = parseFloat(snapValue) / 100;
      sheetHeight = windowHeight * percent;
    } else if (typeof snapValue === "number") {
      sheetHeight = snapValue;
    }

    if (index < 4)
      setMapPadding((prev: any) => ({ ...prev, bottom: sheetHeight }));
  };

  const onPay = async (id: string) => {
    try {
      await payForDelivery(id);
      showNotification("Payment successful", "success");
    } catch (err: any) {
      showNotification(
        err?.response?.data?.msg || err.message || "Payment failed",
        "error"
      );
    }
  };

  const onTrack = (d: Delivery) => {
    if (d && d.dropoff && d.dropoff.coordinates) {
      setDestination(d.dropoff.address || "");
      setDestinationCoords(d.dropoff.coordinates);
    }
  };

  const onCancel = async (id: string) => {
    try {
      await cancelDelivery(id, "sender", "User cancelled");
      showNotification("Delivery cancelled", "success");
    } catch (err: any) {
      showNotification(err?.response?.data?.msg || "Cancel failed", "error");
    }
  };

  const onRebook = async (id: string) => {
    try {
      await rebookDelivery(id);
      showNotification("Rebooked delivery", "success");
    } catch (err: any) {
      showNotification(err?.response?.data?.msg || "Rebook failed", "error");
    }
  };

  const renderItem = ({ item }: { item: Delivery }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          To: {item.to?.name || item.dropoff?.address}
        </Text>
        <Text style={styles.sub}>{item.dropoff?.address}</Text>
        <Text style={styles.sub}>Status: {item.status}</Text>
        <Text style={styles.price}>
          ₦{item.fare?.toFixed?.(0) ?? item.fare}
        </Text>
      </View>
      <View style={styles.actions}>
        {item.payment_status !== "paid" && (
          <TouchableOpacity style={styles.btn} onPress={() => onPay(item._id)}>
            <Text style={styles.btnText}>Pay</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.btn} onPress={() => onTrack(item)}>
          <Text style={styles.btnText}>Track</Text>
        </TouchableOpacity>
        {item.status === "expired" && (
          <TouchableOpacity
            style={styles.btn}
            onPress={() => onRebook(item._id)}
          >
            <Text style={styles.btnText}>Rebook</Text>
          </TouchableOpacity>
        )}
        {(item.status === "pending" || item.status === "scheduled") && (
          <TouchableOpacity
            style={[styles.btn, styles.cancelBtn]}
            onPress={() => onCancel(item._id)}
          >
            <Text style={[styles.btnText, { color: "#fff" }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <BottomSheet
      index={5}
      snapPoints={snapPoints}
      ref={deliveryRouteModalRef}
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
        <View style={styles.container}>
          <Text style={styles.header}>Active Deliveries</Text>
          {!activeDeliveries || activeDeliveries.length === 0 ? (
            <Text style={styles.empty}>You have no active deliveries.</Text>
          ) : (
            <FlatList
              data={activeDeliveries}
              keyExtractor={(i) => i._id}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  modal: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  container: { padding: 12, backgroundColor: "#121212" },
  header: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "raleway-bold",
    marginBottom: 8,
  },
  empty: { color: "#b0b0b0" },
  card: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
  },
  title: { color: "#fff", fontFamily: "raleway-semibold" },
  sub: { color: "#cfcfcf", fontSize: 12 },
  price: { color: "#fff", marginTop: 8, fontFamily: "poppins-bold" },
  actions: { justifyContent: "space-around", alignItems: "flex-end" },
  btn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#fff",
    marginBottom: 6,
  },
  cancelBtn: { backgroundColor: "#ff4d4f" },
  btnText: { color: "#121212", fontFamily: "raleway-bold" },
});

export default DeliveryRouteModal;

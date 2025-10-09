import React, { FC, useRef, useMemo } from "react";
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
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useDeliverContext, Delivery } from "../context/DeliverConrtext";
import { useMapContext } from "../context/MapContext";
import { useNotificationContext } from "../context/NotificationContext";
import { useAuthContext } from "../context/AuthContext";
import { Feather } from "@expo/vector-icons";

const DeliveryRouteModal: FC = () => {
  const {
    activeDeliveries,
    fetchUserActiveDeliveries,
    payForDelivery,
    updateDeliveryStatus,
    rebookDelivery,
    cancelDelivery,
  } = useDeliverContext();

  const { signedIn } = useAuthContext();

  const { setDestinationCoords, setDestination, setMapPadding } =
    useMapContext() as any;
  const { showNotification } = useNotificationContext() as any;

  const deliveryRouteModalRef = useRef<BottomSheet | null>(null);

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
          <Text style={styles.header}>
            {signedIn?.name.split(" ")[1] || signedIn?.name.split(" ")[0]}, got
            something to deliver?
          </Text>

          <Pressable style={styles.form}>
            <View style={styles.text_inp_container}>
              <Feather name="truck" size={25} color="#8d8d8d" />

              <TextInput
                placeholder="Wetin we dey deliver?"
                value=""
                selection={{ start: 0, end: 0 }}
                placeholderTextColor={"#8d8d8d"}
                editable={false}
                style={[styles.text_input, { color: "#8d8d8d" }]}
              />
            </View>
          </Pressable>
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
    paddingTop: 5,
    paddingHorizontal: 15,
  },
  container: { paddingHorizontal: 5, backgroundColor: "#121212" },
  header: {
    color: "#fff",
    fontSize: 16,
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
  text_input: {
    backgroundColor: "transparent",
    flex: 1,
    fontFamily: "raleway-bold",
    fontSize: 16,
    color: "#fff",
  },
});

export default DeliveryRouteModal;

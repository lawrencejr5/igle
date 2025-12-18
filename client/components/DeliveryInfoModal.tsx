import React, { FC } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";

import Feather from "@expo/vector-icons/Feather";

type DeliveryInfoModalProps = {
  visible: boolean;
  onClose: () => void;
  delivery?: any; // Shape based on ongoingDeliveryData
};

const LabelRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.rowBetween}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value} numberOfLines={1}>
      {value || "—"}
    </Text>
  </View>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

const StatusBadge = ({ text }: { text: string }) => (
  <View style={styles.statusBadge}>
    <Text style={styles.statusText}>{text}</Text>
  </View>
);

const DeliveryInfoModal: FC<DeliveryInfoModalProps> = ({
  visible,
  onClose,
  delivery,
}) => {
  const driver = delivery?.driver;
  const driverName = driver?.user?.name || "Unknown Driver";
  const driverImg = (driver as any)?.profile_img;
  const vehicle = driver?.vehicle
    ? `${driver.vehicle.color || ""} ${driver.vehicle.brand || ""} ${
        driver.vehicle.model || ""
      }`.trim()
    : delivery?.vehicle || "Unknown Vehicle";
  const rating = driver?.rating;
  const trips = driver?.total_trips;

  const packageData = delivery?.package || {};
  const pkgType = packageData?.type || delivery?.vehicle || "other";
  const pkgDesc = packageData?.description || "—";
  const fragile = packageData?.fragile ? "Yes" : "No";
  const declaredAmt =
    packageData?.amount != null
      ? `NGN ${Number(packageData.amount).toLocaleString()}`
      : "—";

  const id = delivery?._id || "";
  const fare =
    delivery?.fare != null
      ? `NGN ${Number(delivery.fare).toLocaleString()}`
      : "—";
  const status = delivery?.status || "—";
  const payStatus = delivery?.payment_status || "—";
  const distance =
    delivery?.distance_km != null ? `${delivery.distance_km} km` : "—";
  const duration =
    delivery?.duration_mins != null ? `${delivery.duration_mins} mins` : "—";
  const created = delivery?.createdAt
    ? new Date(delivery.createdAt).toLocaleString()
    : undefined;
  const updated = delivery?.updatedAt
    ? new Date(delivery.updatedAt).toLocaleString()
    : undefined;
  const pickupAddr = delivery?.pickup?.address;
  const dropoffAddr = delivery?.dropoff?.address;
  const recipientName = delivery?.to?.name;
  const recipientPhone = delivery?.to?.phone;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Delivery details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Summary */}
            <View style={styles.summaryRow}>
              <StatusBadge text={String(status)} />
              <View style={styles.idPill}>
                <Text style={styles.idText}>
                  ID: #{id ? id.slice(-9).toUpperCase() : "—"}
                </Text>
              </View>
            </View>

            <Section title="Driver">
              <View style={styles.driverRow}>
                <Image
                  source={
                    driverImg
                      ? { uri: driverImg }
                      : require("../assets/images/user.png")
                  }
                  style={styles.driverImg}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverName}>{driverName}</Text>
                  <Text style={styles.driverSub}>{vehicle}</Text>
                  {(rating != null || trips != null) && (
                    <Text style={styles.driverSub}>
                      {rating != null ? `${Number(rating).toFixed(1)} ★` : ""}
                      {rating != null && trips != null ? " • " : ""}
                      {trips != null ? `${trips} trips` : ""}
                    </Text>
                  )}
                </View>
              </View>
            </Section>

            <Section title="Package">
              <LabelRow label="Type" value={String(pkgType)} />
              <LabelRow label="Description" value={String(pkgDesc)} />
              <LabelRow label="Fragile" value={fragile} />
              <LabelRow label="Declared value" value={declaredAmt} />
            </Section>

            <Section title="Route">
              <LabelRow label="From" value={pickupAddr} />
              <LabelRow label="To" value={dropoffAddr} />
            </Section>

            <Section title="Stats">
              <LabelRow label="Fare" value={fare} />
              <LabelRow label="Payment" value={String(payStatus)} />
              <LabelRow label="Distance" value={distance} />
              <LabelRow label="Duration" value={duration} />
            </Section>

            <Section title="Recipient">
              <LabelRow label="Name" value={recipientName} />
              <LabelRow label="Phone" value={recipientPhone} />
            </Section>

            {(created || updated) && (
              <Section title="Timestamps">
                {created && <LabelRow label="Created" value={created} />}
                {updated && <LabelRow label="Updated" value={updated} />}
              </Section>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default DeliveryInfoModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  headerText: {
    fontSize: 20,
    fontFamily: "raleway-bold",
    color: "#fff",
  },
  closeButton: { padding: 6 },
  section: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    color: "#b0b0b0",
    fontFamily: "raleway-semibold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#242424",
  },
  label: {
    color: "#b0b0b0",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginRight: 10,
  },
  value: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 13,
    flexShrink: 1,
    textAlign: "right",
  },
  summaryRow: {
    paddingHorizontal: 20,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#232323",
  },
  statusText: {
    color: "#E5E7EB",
    fontSize: 12,
    fontFamily: "raleway-semibold",
    textTransform: "capitalize",
  },
  idPill: {
    marginLeft: "auto",
    backgroundColor: "#232323",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  idText: {
    color: "#fff",
    fontFamily: "poppins-regular",
    fontSize: 10,
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  driverImg: { width: 50, height: 50, borderRadius: 25 },
  driverName: { color: "#fff", fontFamily: "raleway-semibold" },
  driverSub: { color: "#cfcfcf", fontFamily: "poppins-regular", fontSize: 12 },
});

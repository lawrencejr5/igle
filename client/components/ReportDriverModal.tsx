import React, { FC, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useReportContext } from "../context/ReportContext";
import { useNotificationContext } from "../context/NotificationContext";

interface ReportDriverModalProps {
  visible: boolean;
  onClose: () => void;
  driverId?: string;
  rideId?: string;
}

const reportReasons = [
  {
    id: "reckless",
    label: "Driver was reckless",
    icon: "alert-triangle",
  },
  {
    id: "demanded_more",
    label: "Driver demanded more money",
    icon: "dollar-sign",
  },
  {
    id: "rude",
    label: "Rude and unprofessional",
    icon: "frown",
  },
  {
    id: "suspicious",
    label: "Suspicious or fraudulent activities",
    icon: "shield-off",
  },
  {
    id: "refused_end",
    label: "Refused to end trip or failed to reach destination",
    icon: "x-circle",
  },
  {
    id: "poor_vehicle",
    label: "Vehicle condition was poor",
    icon: "tool",
  },
  {
    id: "unsafe_driving",
    label: "Unsafe driving behavior",
    icon: "zap",
  },
  {
    id: "harassment",
    label: "Harassment or inappropriate behavior",
    icon: "alert-octagon",
  },
  {
    id: "other",
    label: "Other",
    icon: "more-horizontal",
  },
];

const ReportDriverModal: FC<ReportDriverModalProps> = ({
  visible,
  onClose,
  driverId,
  rideId,
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [reasonDescription, setReasonDescription] = useState<string | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  const { submitReport } = useReportContext();
  const { showNotification } = useNotificationContext();

  const handleSubmit = async () => {
    if (!selectedReason) return;
    if (!driverId) {
      showNotification("Driver not available", "error");
      return;
    }

    setSubmitting(true);
    try {
      await submitReport(
        driverId,
        rideId || null,
        selectedReason,
        reasonDescription!,
        true
      );
      showNotification("Report submitted. Thank you.", "success");
      setSelectedReason(null);
      onClose();
    } catch (err: any) {
      showNotification(err.message || "Failed to submit report", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Report Driver</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Anonymous message */}
          <View style={styles.messageContainer}>
            <Feather name="shield" size={16} color="#b0b0b0" />
            <Text style={styles.messageText}>
              Your report is completely anonymous and will be reviewed by our
              team.
            </Text>
          </View>

          {/* Report options */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Select a reason</Text>
            {reportReasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonOption,
                  selectedReason === reason.id && styles.reasonOptionSelected,
                ]}
                onPress={() => {
                  setSelectedReason(reason.id);
                  setReasonDescription(reason.label);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.reasonContent}>
                  <Feather
                    name={reason.icon as any}
                    size={20}
                    color={selectedReason === reason.id ? "#121212" : "#fff"}
                  />
                  <Text
                    style={[
                      styles.reasonText,
                      selectedReason === reason.id && styles.reasonTextSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                </View>
                <View style={styles.radioOuter}>
                  {selectedReason === reason.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Submit button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              !selectedReason && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedReason}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Submit Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ReportDriverModal;

const windowHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "100%",
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  headerText: {
    fontSize: 22,
    fontFamily: "raleway-bold",
    color: "#fff",
  },
  closeButton: {
    padding: 4,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1a1a1a",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "raleway-regular",
    color: "#b0b0b0",
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "raleway-semibold",
    color: "#b0b0b0",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reasonOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  reasonOptionSelected: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  reasonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  reasonText: {
    fontSize: 13,
    fontFamily: "raleway-regular",
    color: "#fff",
    flex: 1,
  },
  reasonTextSelected: {
    color: "#121212",
  },
  radioOuter: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#515151",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: "#121212",
  },
  submitButton: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: "raleway-bold",
    color: "#121212",
  },
});

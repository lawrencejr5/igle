import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useDriverAuthContext } from "../../context/DriverAuthContext";
import CustomDropdown from "../../components/CustomDropdown";

const BANK = [
  { key: "058", label: "GTBank" },
  { key: "044", label: "Access Bank" },
  { key: "057", label: "Zenith Bank" },
  { key: "033", label: "UBA" },
  { key: "011", label: "First Bank" },
  { key: "070", label: "Fidelity" },
  { key: "076", label: "Polaris" },
  { key: "035", label: "Wema" },
  { key: "232", label: "Sterling" },
  { key: "032", label: "Union Bank" },
  { key: "50515", label: "Moniepoint MFB" },
  { key: "999992", label: "Opay (Paycom)" },
  { key: "999991", label: "PalmPay" },
  { key: "50211", label: "Kuda" },
];

type BankInformationModalProps = {
  visible: boolean;
  onClose: () => void;
};

const BankInformationModal: React.FC<BankInformationModalProps> = ({
  visible,
  onClose,
}) => {
  const { driver, saveBankInfo } = useDriverAuthContext();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: driver?.bank?.bank_name || "",
    bank_code: driver?.bank?.bank_code || "",
    account_number: driver?.bank?.account_number || "",
    account_name: driver?.bank?.account_name || "",
  });

  useEffect(() => {
    if (visible && driver?.bank) {
      setFormData({
        bank_name: driver.bank.bank_name || "",
        bank_code: driver.bank.bank_code || "",
        account_number: driver.bank.account_number || "",
        account_name: driver.bank.account_name || "",
      });
    }
  }, [visible, driver]);

  const handleUpdate = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (
      !formData.bank_name ||
      !formData.bank_code ||
      !formData.account_number ||
      !formData.account_name
    ) {
      return;
    }
    setLoading(true);
    try {
      await saveBankInfo({
        bank_name: formData.bank_name,
        bank_code: formData.bank_code,
        account_number: formData.account_number,
        account_name: formData.account_name,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save bank info:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasSavedBank = !!driver?.bank?.account_number;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Bank Information</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{ padding: 10, paddingTop: 0 }}
              onPress={onClose}
            >
              <FontAwesome name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Current bank info banner if already saved */}
            {hasSavedBank && (
              <View style={styles.savedBanner}>
                <MaterialCommunityIcons
                  name="bank-check"
                  size={20}
                  color="#4CAF50"
                />
                <View style={styles.savedBannerText}>
                  <Text style={styles.savedBannerTitle}>
                    {driver.bank?.bank_name}
                  </Text>
                  <Text style={styles.savedBannerSub}>
                    {driver.bank?.account_number} · {driver.bank?.account_name}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.form}>
              {/* Bank Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bank</Text>
                <View style={[styles.inputContainer, { paddingVertical: 0 }]}>
                  <MaterialCommunityIcons
                    name="bank-outline"
                    size={20}
                    color="#666"
                  />
                  <View style={{ flex: 1, paddingLeft: 12 }}>
                    <CustomDropdown
                      options={BANK}
                      value={formData.bank_code}
                      onChange={(k) => {
                        const selectedBank = BANK.find((x) => x.key === k);
                        setFormData((prev) => ({
                          ...prev,
                          bank_code: k,
                          bank_name: selectedBank ? selectedBank.label : "",
                        }));
                      }}
                    />
                  </View>
                </View>
              </View>

              {/* Account Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Number</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="card-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    value={formData.account_number}
                    onChangeText={(v) => handleUpdate("account_number", v)}
                    placeholder="10-digit account number"
                    placeholderTextColor="#666"
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* Account Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    value={formData.account_name}
                    onChangeText={(v) => handleUpdate("account_name", v)}
                    placeholder="Name on the account"
                    placeholderTextColor="#666"
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                loading && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {hasSavedBank ? "Update Bank Info" : "Save Bank Info"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerText: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "raleway-bold",
  },
  savedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a2e1a",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "#2a5c2a",
  },
  savedBannerText: {
    flex: 1,
  },
  savedBannerTitle: {
    color: "#4CAF50",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  savedBannerSub: {
    color: "#aaa",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginTop: 2,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "raleway-semibold",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 14,
    paddingVertical: 16,
    paddingLeft: 12,
  },
  hintText: {
    color: "#888",
    fontSize: 12,
    fontFamily: "raleway-regular",
    marginTop: 4,
    fontStyle: "italic",
  },
  saveButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "raleway-bold",
  },
});

export default BankInformationModal;

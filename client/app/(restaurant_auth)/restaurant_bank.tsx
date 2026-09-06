import {
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";
import { driver_reg_styles } from "../../styles/driver_reg_styles";
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

const RestaurantBank = () => {
  const styles = driver_reg_styles();

  const [bankCode, setBankCode] = useState<string>("058");
  const [bankName, setBankName] = useState<string>(
    BANK.find((b) => b.key === "058")?.label || "",
  );
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");

  const handleNext = () => {
    router.push("/(restaurant_auth)/restaurant_verification");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#121212" }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.header_text}>Restaurant Registration</Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/home")}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text
              style={{
                color: "#ff453a",
                fontFamily: "raleway-bold",
                fontSize: 14,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress — step 3 of 4 */}
        <View style={styles.progress_bar_container}>
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#484848" }]} />
        </View>

        <ScrollView
          style={{ flex: 1, backgroundColor: "#121212" }}
          contentContainerStyle={{
            backgroundColor: "#121212",
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Header */}
          <View style={{ marginTop: 20 }}>
            <Text style={styles.form_header_text}>Bank Details</Text>
            <Text style={styles.form_subheader_text}>
              Provide your restaurant's bank account for receiving payouts
            </Text>
          </View>

          {/* Form */}
          <View style={{ marginTop: 20 }}>
            {/* Bank Dropdown */}
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Bank</Text>
              <View style={[styles.inp_holder, { paddingVertical: 0 }]}>
                <FontAwesome name="university" size={20} color="white" />
                <View style={{ flex: 1 }}>
                  <CustomDropdown
                    options={BANK}
                    value={bankCode}
                    onChange={(k) => {
                      setBankCode(k);
                      const b = BANK.find((x) => x.key === k);
                      if (b) setBankName(b.label);
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Account Number */}
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Account Number</Text>
              <View style={styles.inp_holder}>
                <FontAwesome name="credit-card" size={20} color="white" />
                <TextInput
                  style={styles.text_input}
                  autoCapitalize="none"
                  keyboardType="numeric"
                  placeholder="e.g. 1234567890"
                  placeholderTextColor="#c5c5c5"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  maxLength={10}
                />
              </View>
            </View>

            {/* Account Name */}
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Account Name</Text>
              <View style={styles.inp_holder}>
                <FontAwesome name="user" size={20} color="white" />
                <TextInput
                  style={styles.text_input}
                  autoCapitalize="words"
                  placeholder="e.g. Mama's Kitchen Ltd"
                  placeholderTextColor="#c5c5c5"
                  value={accountName}
                  onChangeText={setAccountName}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Next Button */}
        <View
          style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 }}
        >
          <TouchableWithoutFeedback onPress={handleNext}>
            <View style={styles.sign_btn}>
              <Text style={styles.sign_btn_text}>Next: Verification</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RestaurantBank;

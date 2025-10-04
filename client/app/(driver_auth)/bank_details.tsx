import {
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";

import FontAwesome from "@expo/vector-icons/FontAwesome";

import { router } from "expo-router";

import { driver_reg_styles } from "../../styles/driver_reg_styles";
import Header from "../../components/driver_reg/Header";

import { useDriverAuthContext } from "../../context/DriverAuthContext";
import { useAuthContext } from "../../context/AuthContext";
import { useNotificationContext } from "../../context/NotificationContext";
import Notification from "../../components/Notification";

const BankDetails = () => {
  const styles = driver_reg_styles();
  const { saveBankInfo } = useDriverAuthContext();
  const { getUserData, updateDriverApplication } = useAuthContext();
  const { showNotification, notification } = useNotificationContext()!;

  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [bankCode, setBankCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleNext = async (): Promise<void> => {
    if (
      !bankName.trim() ||
      !accountNumber.trim() ||
      !accountName.trim() ||
      !bankCode.trim()
    ) {
      showNotification("All fields are required", "error");
      return;
    }

    setLoading(true);
    try {
      const bankInfo = {
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
        bank_code: bankCode.trim(),
      };

      await saveBankInfo(bankInfo);
      await updateDriverApplication("submitted");
      await getUserData();
      setSuccess(true);
      setTimeout(() => {
        router.push("/reviewing_message");
      }, 1500);
    } catch (err: any) {
      showNotification(
        err.message || "Failed to save bank information",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      {notification.visible && <Notification notification={notification} />}
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#121212" }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <Header />

        <View style={styles.progress_bar_container}>
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
        </View>

        <ScrollView
          style={{ flex: 1, backgroundColor: "#121212" }}
          contentContainerStyle={{
            backgroundColor: "#121212",
            flexGrow: 1,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ marginTop: 20 }}>
            <Text style={styles.form_header_text}>Bank Details</Text>
            <Text style={styles.form_subheader_text}>
              Please provide your bank account information for payments
            </Text>
          </View>

          {/* Form */}
          <View style={{ marginTop: 20 }}>
            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Bank Name</Text>
              <View style={styles.inp_holder}>
                <FontAwesome name="university" size={20} color="white" />
                <TextInput
                  style={styles.text_input}
                  autoCapitalize="words"
                  placeholder="e.g. First Bank, GT Bank"
                  placeholderTextColor="#c5c5c5"
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>
            </View>

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

            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Account Name</Text>
              <View style={styles.inp_holder}>
                <FontAwesome name="user" size={20} color="white" />
                <TextInput
                  style={styles.text_input}
                  autoCapitalize="words"
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#c5c5c5"
                  value={accountName}
                  onChangeText={setAccountName}
                />
              </View>
            </View>

            <View style={styles.inp_container}>
              <Text style={styles.inp_label}>Bank Code</Text>
              <View style={styles.inp_holder}>
                <FontAwesome name="code" size={20} color="white" />
                <TextInput
                  style={styles.text_input}
                  autoCapitalize="none"
                  keyboardType="numeric"
                  placeholder="e.g. GTB - 058"
                  placeholderTextColor="#c5c5c5"
                  value={bankCode}
                  onChangeText={setBankCode}
                  maxLength={3}
                />
              </View>
            </View>

            <TouchableWithoutFeedback onPress={handleNext} disabled={loading}>
              <View style={[styles.sign_btn, loading && { opacity: 0.6 }]}>
                <Text style={styles.sign_btn_text}>
                  {loading ? "Saving..." : "Submit"}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default BankDetails;

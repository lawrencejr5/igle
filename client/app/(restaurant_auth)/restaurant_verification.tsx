import {
  Text,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { driver_reg_styles } from "../../styles/driver_reg_styles";
import { useRestaurantContext } from "../../context/RestaurantContext";
import { useNotificationContext } from "../../context/NotificationContext";

// ─── Document Upload Card Component ───────────────────────────────────────────

interface DocUploadCardProps {
  title: string;
  description: string;
  uri: string;
  onPress: () => void;
  required?: boolean;
  badge?: string;
}

const DocUploadCard = ({
  title,
  description,
  uri,
  onPress,
  required = true,
  badge,
}: DocUploadCardProps) => (
  <TouchableOpacity style={localStyles.doc_card} onPress={onPress}>
    {uri ? (
      <Image
        source={{ uri }}
        style={localStyles.doc_preview}
        contentFit="cover"
      />
    ) : (
      <View style={localStyles.doc_placeholder}>
        <Feather name="upload" size={24} color="#777" />
      </View>
    )}
    <View style={{ flex: 1 }}>
      <View style={localStyles.doc_title_row}>
        <Text style={localStyles.doc_title}>{title}</Text>
        {badge && (
          <View style={localStyles.verified_badge}>
            <Feather name="star" size={9} color="#f5c518" />
            <Text style={localStyles.verified_badge_text}>{badge}</Text>
          </View>
        )}
        {!required && (
          <View style={localStyles.optional_badge}>
            <Text style={localStyles.optional_badge_text}>Optional</Text>
          </View>
        )}
      </View>
      <Text style={localStyles.doc_desc}>{description}</Text>
      <Text style={localStyles.doc_action}>
        {uri ? "✓ Uploaded — tap to change" : "Tap to upload"}
      </Text>
    </View>
  </TouchableOpacity>
);

// ─── Screen ────────────────────────────────────────────────────────────────────

const RestaurantVerification = () => {
  const styles = driver_reg_styles();
  const {
    restaurant,
    registrationDraft,
    updateRegistrationDraft,
    populateDraftFromRestaurant,
    submitStageVerification,
    loading: isSubmitting,
  } = useRestaurantContext();
  const { showNotification } = useNotificationContext()!;

  const [govIdUri, setGovIdUri] = useState<string>(
    registrationDraft.government_id_uri || ""
  );
  const [cacUri, setCacUri] = useState<string>(
    registrationDraft.cac_document_uri || ""
  );
  const [submitted, setSubmitted] = useState(false);

  const pickDoc = async (
    setter: (uri: string) => void,
    fieldKey: "government_id_uri" | "cac_document_uri"
  ) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.length) {
      const uri = result.assets[0].uri;
      setter(uri);
      updateRegistrationDraft({ [fieldKey]: uri });
    }
  };

  const handleSubmit = async () => {
    if (!govIdUri) {
      showNotification(
        "Please upload a Government-issued ID to submit your application",
        "error"
      );
      return;
    }
    try {
      const draftData = {
        government_id_uri: govIdUri,
        cac_document_uri: cacUri,
      };
      updateRegistrationDraft(draftData);
      await submitStageVerification(draftData);
      setSubmitted(true);
    } catch (err) {
      console.log("Restaurant application submit error:", err);
    }
  };

  React.useEffect(() => {
    if (restaurant?.application === "approved" || restaurant?.is_verified) {
      router.replace("/(restaurant)/home");
    }
  }, [restaurant]);

  const isAlreadySubmitted =
    submitted ||
    (restaurant?.application === "submitted" &&
      !!restaurant?.verification?.government_id) ||
    restaurant?.application === "approved";

  // ── Success / Submitted Screen ──────────────────────────────────────────────

  if (isAlreadySubmitted) {
    return (
      <View style={{ flex: 1, backgroundColor: "#121212" }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.header_text}>Restaurant Registration</Text>
        </View>

        {/* Progress — all complete */}
        <View style={styles.progress_bar_container}>
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
        </View>

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Image
            source={require("../../assets/images/illustrations/confirmed.png")}
            style={{ height: 280, width: 280, borderRadius: 15 }}
          />

          <Text
            style={{
              color: "#fff",
              fontFamily: "raleway-bold",
              fontSize: 24,
              textAlign: "center",
              marginTop: 20,
              marginBottom: 10,
            }}
          >
            Application Submitted!
          </Text>
          <Text
            style={{
              color: "#9CA3AF",
              fontFamily: "raleway-regular",
              fontSize: 14,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            Your restaurant details are under review. We'll notify you within{" "}
            <Text style={{ color: "#fff", fontFamily: "raleway-bold" }}>
              2–4 working days
            </Text>
            . Once approved, you'll be able to start receiving orders.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 30, alignItems: "center", gap: 14 }}>
          <TouchableWithoutFeedback
            onPress={() => router.replace("/(tabs)/home")}
          >
            <View style={[styles.sign_btn, { width: "100%" }]}>
              <Text style={styles.sign_btn_text}>Go back home</Text>
            </View>
          </TouchableWithoutFeedback>

          <TouchableOpacity
            onPress={() => {
              if (restaurant) {
                populateDraftFromRestaurant(restaurant);
              }
              router.push({
                pathname: "/(restaurant_auth)/restaurant_details",
                params: { mode: "edit" },
              });
            }}
            hitSlop={{ top: 10, bottom: 10, left: 15, right: 15 }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-bold",
                fontSize: 14,
                textDecorationLine: "underline",
              }}
            >
              Edit application details
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Upload Screen ───────────────────────────────────────────────────────────

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

        {/* Progress — step 4 of 4 */}
        <View style={styles.progress_bar_container}>
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#484848" }]} />
        </View>

        <ScrollView
          style={{ flex: 1, backgroundColor: "#121212" }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: 20 }}>
            <Text style={styles.form_header_text}>Verification Documents</Text>
            <Text style={styles.form_subheader_text}>
              Upload the required documents to verify your restaurant
            </Text>
          </View>

          {/* ── Government ID ── */}
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.inp_label, { marginBottom: 10 }]}>
              Government-Issued ID of Owner / Manager
            </Text>
            <DocUploadCard
              title="Government ID"
              description="National ID, Passport, or Driver's Licence"
              uri={govIdUri}
              onPress={() => pickDoc(setGovIdUri, "government_id_uri")}
              required
            />
          </View>

          {/* ── CAC Document ── */}
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.inp_label, { marginBottom: 10 }]}>
              CAC Registration Document
            </Text>
            <DocUploadCard
              title="CAC Certificate / Business Registration"
              description="Certificate of Incorporation or Business Name certificate"
              uri={cacUri}
              onPress={() => pickDoc(setCacUri, "cac_document_uri")}
              required={false}
            />
          </View>

          {/* ── Required field note ── */}
          {!govIdUri && (
            <View style={localStyles.warning_note}>
              <Feather name="alert-circle" size={13} color="#ff453a" />
              <Text style={localStyles.warning_text}>
                A Government-issued ID is required to submit your application
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Submit Button */}
        <View
          style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 }}
        >
          <TouchableWithoutFeedback
            onPress={handleSubmit}
            disabled={!govIdUri || isSubmitting}
          >
            <View
              style={[
                styles.sign_btn,
                (!govIdUri || isSubmitting) && { opacity: 0.5 },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#121212" />
              ) : (
                <Text style={styles.sign_btn_text}>Submit Application</Text>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RestaurantVerification;

// ─── Local Styles ──────────────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  doc_card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 14,
  },
  doc_placeholder: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  doc_preview: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  doc_title_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  doc_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  verified_badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f5c51822",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f5c51844",
  },
  verified_badge_text: {
    color: "#f5c518",
    fontFamily: "raleway-bold",
    fontSize: 10,
  },
  optional_badge: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  optional_badge_text: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 10,
  },
  doc_desc: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginBottom: 4,
  },
  doc_action: {
    color: "#aaa",
    fontFamily: "raleway-semibold",
    fontSize: 11,
  },
  cac_notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#f5c51811",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f5c51833",
    marginBottom: 12,
  },
  cac_notice_text: {
    flex: 1,
    color: "#ccc",
    fontFamily: "raleway-regular",
    fontSize: 12,
    lineHeight: 18,
  },
  warning_note: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ff453a18",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ff453a33",
    marginTop: 16,
  },
  warning_text: {
    flex: 1,
    color: "#ff453a",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  cac_tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#f5c51811",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f5c51833",
    marginTop: 20,
  },
  cac_tip_text: {
    flex: 1,
    color: "#ccc",
    fontFamily: "raleway-regular",
    fontSize: 13,
    lineHeight: 20,
  },
});

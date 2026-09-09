import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Switch,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import {
  useRestaurantContext,
  OperatingHour,
} from "../../../context/RestaurantContext";
import { useNotificationContext } from "../../../context/NotificationContext";

// ─── Available Category Tags Preset ──────────────────────────────────────────

const AVAILABLE_TAGS = [
  "Jollof & Rice",
  "Fast Food",
  "African & Soups",
  "Grill & Suya",
  "Burgers & Sandwiches",
  "Pastries & Bakery",
  "Pizza & Pasta",
  "Seafood & Fish",
  "Smoothies & Drinks",
  "Healthy & Salad",
];

const DEFAULT_HOURS: OperatingHour[] = [
  { day: "Mon", open: "08:00 AM", close: "10:00 PM", closed: false },
  { day: "Tue", open: "08:00 AM", close: "10:00 PM", closed: false },
  { day: "Wed", open: "08:00 AM", close: "10:00 PM", closed: false },
  { day: "Thu", open: "08:00 AM", close: "10:00 PM", closed: false },
  { day: "Fri", open: "08:00 AM", close: "10:00 PM", closed: false },
  { day: "Sat", open: "08:00 AM", close: "10:00 PM", closed: false },
  { day: "Sun", open: "09:00 AM", close: "09:00 PM", closed: true },
];

// ─── Component ───────────────────────────────────────────────────────────────

const EditRestaurantDetails = () => {
  const insets = useSafeAreaInsets();
  const {
    restaurant,
    saveStageDetails,
    saveStageLocation,
    fetchRestaurantProfile,
  } = useRestaurantContext();
  const { showNotification } = useNotificationContext();

  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [logoUri, setLogoUri] = useState("");
  const [bannerUri, setBannerUri] = useState("");
  const [categoryTags, setCategoryTags] = useState<string[]>([]);
  const [operatingHours, setOperatingHours] =
    useState<OperatingHour[]>(DEFAULT_HOURS);

  // Location State
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [deliveryRadius, setDeliveryRadius] = useState(5);

  // Time Picker Modal State
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [activeHourIndex, setActiveHourIndex] = useState<number | null>(null);
  const [activeTimeField, setActiveTimeField] = useState<"open" | "close">("open");
  const [tempTimeInput, setTempTimeInput] = useState("08:00 AM");

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || "");
      setPhone(restaurant.phone || "");
      setEmail(restaurant.email || "");
      setDescription(restaurant.description || "");
      setLogoUri(restaurant.logo || "");
      setBannerUri(restaurant.banner || "");
      setCategoryTags(restaurant.category_tags || []);
      setOperatingHours(
        restaurant.operating_hours?.length
          ? restaurant.operating_hours
          : DEFAULT_HOURS
      );
      setAddress(restaurant.location?.address || "");
      setLandmark(restaurant.location?.landmark || "");
      setDeliveryRadius(restaurant.location?.delivery_radius_km || 5);
    }
  }, [restaurant]);

  // Image Pickers
  const pickBannerImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setBannerUri(result.assets[0].uri);
    }
  };

  const pickLogoImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setLogoUri(result.assets[0].uri);
    }
  };

  // Category Tag Toggle
  const toggleCategoryTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategoryTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Operating Hours Actions
  const toggleDayClosed = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOperatingHours((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, closed: !item.closed } : item
      )
    );
  };

  const openTimePicker = (index: number, field: "open" | "close") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveHourIndex(index);
    setActiveTimeField(field);
    setTempTimeInput(operatingHours[index][field] || "08:00 AM");
    setTimePickerVisible(true);
  };

  const confirmTimePicker = () => {
    if (activeHourIndex !== null) {
      setOperatingHours((prev) =>
        prev.map((item, idx) =>
          idx === activeHourIndex
            ? { ...item, [activeTimeField]: tempTimeInput.trim() }
            : item
        )
      );
    }
    setTimePickerVisible(false);
    setActiveHourIndex(null);
  };

  const applyMondayHoursToAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const monday = operatingHours[0];
    setOperatingHours((prev) =>
      prev.map((item) => ({
        ...item,
        open: monday.open,
        close: monday.close,
        closed: item.day === "Sun" ? item.closed : monday.closed,
      }))
    );
    showNotification("Monday hours copied to all weekdays!", "info");
  };

  // Save All Details Handler
  const handleSaveDetails = async () => {
    if (!name.trim()) {
      showNotification("Restaurant name is required", "error");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      // 1. Save Basic Details & Operating Hours
      await saveStageDetails({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        description: description.trim(),
        category_tags: categoryTags,
        operating_hours: operatingHours,
        logoUri,
        bannerUri,
      });

      // 2. Save Location & Delivery Radius
      await saveStageLocation({
        address: address.trim(),
        landmark: landmark.trim(),
        delivery_radius_km: deliveryRadius,
      });

      await fetchRestaurantProfile();
      showNotification("Restaurant profile updated successfully!", "success");
      router.back();
    } catch (err: any) {
      console.log("Failed to update restaurant profile", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "ios" ? insets.top + 10 : insets.top + 14 },
      ]}
    >
      {/* ── Top Nav Header ── */}
      <View style={styles.top_header}>
        <TouchableOpacity
          style={styles.back_btn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header_center}>
          <Text style={styles.header_title}>Restaurant Profile</Text>
          <Text style={styles.header_sub}>Edit banner, name & hours</Text>
        </View>

        <TouchableOpacity
          style={[styles.save_header_btn, saving && styles.save_btn_disabled]}
          disabled={saving}
          onPress={handleSaveDetails}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#121212" />
          ) : (
            <Text style={styles.save_header_text}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll_content,
          { paddingBottom: Platform.OS === "ios" ? insets.bottom + 40 : 50 },
        ]}
      >
        {/* ── Banner & Logo Upload Header ── */}
        <View style={styles.hero_card}>
          {/* Banner Container */}
          <TouchableOpacity
            style={styles.banner_container}
            activeOpacity={0.88}
            onPress={pickBannerImage}
          >
            {bannerUri ? (
              <Image
                source={{ uri: bannerUri }}
                style={styles.banner_image}
                contentFit="cover"
              />
            ) : (
              <View style={styles.banner_placeholder}>
                <Feather name="image" size={32} color="#666" />
                <Text style={styles.banner_placeholder_text}>
                  Tap to add store banner
                </Text>
              </View>
            )}
            <View style={styles.banner_overlay}>
              <View style={styles.change_banner_pill}>
                <Feather name="camera" size={14} color="#fff" />
                <Text style={styles.change_banner_text}>Change Banner</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Logo Container (Overlapping) */}
          <View style={styles.logo_meta_row}>
            <TouchableOpacity
              style={styles.logo_wrapper}
              activeOpacity={0.88}
              onPress={pickLogoImage}
            >
              {logoUri ? (
                <Image
                  source={{ uri: logoUri }}
                  style={styles.logo_image}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.logo_placeholder}>
                  <FontAwesome5 name="store" size={26} color="#fff" />
                </View>
              )}
              <View style={styles.logo_camera_badge}>
                <Feather name="camera" size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={styles.hero_meta_info}>
              <Text style={styles.hero_store_name} numberOfLines={1}>
                {name || "Your Restaurant Name"}
              </Text>
              <Text style={styles.hero_store_sub}>
                Tap photos to update logo & banner
              </Text>
            </View>
          </View>
        </View>

        {/* ── Basic Information Section ── */}
        <View style={styles.section_card}>
          <View style={styles.section_title_row}>
            <View style={styles.section_icon_box}>
              <Feather name="info" size={16} color="#fff" />
            </View>
            <Text style={styles.section_title}>Basic Information</Text>
          </View>

          {/* Store Name */}
          <View style={styles.input_group}>
            <Text style={styles.input_label}>RESTAURANT NAME *</Text>
            <TextInput
              style={styles.text_input}
              placeholder="e.g. Chicken Republic Lekki"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Phone & Email Row */}
          <View style={styles.row_inputs}>
            <View style={[styles.input_group, { flex: 1 }]}>
              <Text style={styles.input_label}>PHONE NUMBER</Text>
              <TextInput
                style={styles.text_input}
                placeholder="+234 812 345 6789"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={[styles.input_group, { flex: 1 }]}>
              <Text style={styles.input_label}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.text_input}
                placeholder="store@example.com"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.input_group}>
            <Text style={styles.input_label}>STORE DESCRIPTION / BIO</Text>
            <TextInput
              style={[styles.text_input, styles.multiline_input]}
              multiline
              numberOfLines={3}
              placeholder="Tell customers about your signature dishes, spices, and cuisine..."
              placeholderTextColor="#666"
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* ── Cuisine & Category Tags ── */}
        <View style={styles.section_card}>
          <View style={styles.section_title_row}>
            <View style={styles.section_icon_box}>
              <Feather name="tag" size={16} color="#fff" />
            </View>
            <Text style={styles.section_title}>Cuisine & Category Tags</Text>
          </View>

          <Text style={styles.section_hint}>
            Select all tags that best describe your store's food menu
          </Text>

          <View style={styles.tags_container}>
            {AVAILABLE_TAGS.map((tag) => {
              const isSelected = categoryTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag_chip, isSelected && styles.tag_chip_selected]}
                  onPress={() => toggleCategoryTag(tag)}
                >
                  <Text
                    style={[
                      styles.tag_chip_text,
                      isSelected && styles.tag_chip_text_selected,
                    ]}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Operating Hours Section ── */}
        <View style={styles.section_card}>
          <View style={styles.section_title_row}>
            <View style={styles.section_icon_box}>
              <Feather name="clock" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.section_title}>Operating Hours</Text>
            </View>
            <TouchableOpacity
              style={styles.copy_mon_btn}
              onPress={applyMondayHoursToAll}
            >
              <Text style={styles.copy_mon_text}>Copy Mon to All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hours_list}>
            {operatingHours.map((item, index) => (
              <View key={item.day} style={styles.hour_row}>
                {/* Day & Closed Switch */}
                <View style={styles.hour_left}>
                  <Text style={styles.day_name_text}>{item.day}</Text>
                  <Switch
                    value={!item.closed}
                    onValueChange={() => toggleDayClosed(index)}
                    trackColor={{ false: "#333", true: "#4caf5055" }}
                    thumbColor={!item.closed ? "#4caf50" : "#9CA3AF"}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                  <Text
                    style={[
                      styles.open_closed_status,
                      item.closed ? styles.text_closed : styles.text_open,
                    ]}
                  >
                    {item.closed ? "Closed" : "Open"}
                  </Text>
                </View>

                {/* Opening & Closing Times */}
                {!item.closed ? (
                  <View style={styles.time_buttons_row}>
                    <TouchableOpacity
                      style={styles.time_pill}
                      onPress={() => openTimePicker(index, "open")}
                    >
                      <Text style={styles.time_pill_label}>FROM</Text>
                      <Text style={styles.time_pill_val}>{item.open}</Text>
                    </TouchableOpacity>

                    <Text style={styles.time_dash}>-</Text>

                    <TouchableOpacity
                      style={styles.time_pill}
                      onPress={() => openTimePicker(index, "close")}
                    >
                      <Text style={styles.time_pill_label}>TO</Text>
                      <Text style={styles.time_pill_val}>{item.close}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.closed_label_text}>Store Closed All Day</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ── Location & Delivery Settings ── */}
        <View style={styles.section_card}>
          <View style={styles.section_title_row}>
            <View style={styles.section_icon_box}>
              <Feather name="map-pin" size={16} color="#fff" />
            </View>
            <Text style={styles.section_title}>Location & Delivery Radius</Text>
          </View>

          <View style={styles.input_group}>
            <Text style={styles.input_label}>STREET ADDRESS</Text>
            <TextInput
              style={styles.text_input}
              placeholder="e.g. 14 Admiralty Way, Lekki Phase 1, Lagos"
              placeholderTextColor="#666"
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <View style={styles.input_group}>
            <Text style={styles.input_label}>LANDMARK / BUILDING SUITE</Text>
            <TextInput
              style={styles.text_input}
              placeholder="e.g. Opposite Ebeano Supermarket"
              placeholderTextColor="#666"
              value={landmark}
              onChangeText={setLandmark}
            />
          </View>

          {/* Delivery Radius Selector */}
          <View style={styles.input_group}>
            <View style={styles.radius_header_row}>
              <Text style={styles.input_label}>MAX DELIVERY RADIUS</Text>
              <Text style={styles.radius_value_text}>{deliveryRadius} KM</Text>
            </View>

            <View style={styles.radius_stepper_row}>
              {[3, 5, 10, 15, 20, 30].map((km) => (
                <TouchableOpacity
                  key={km}
                  style={[
                    styles.radius_chip,
                    deliveryRadius === km && styles.radius_chip_active,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDeliveryRadius(km);
                  }}
                >
                  <Text
                    style={[
                      styles.radius_chip_text,
                      deliveryRadius === km && styles.radius_chip_text_active,
                    ]}
                  >
                    {km} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── Bank Payout Summary Card ── */}
        <View style={styles.section_card}>
          <View style={styles.section_title_row}>
            <View style={styles.section_icon_box}>
              <Feather name="credit-card" size={16} color="#fff" />
            </View>
            <Text style={styles.section_title}>Bank Payout Details</Text>
          </View>

          {restaurant?.bank?.account_number ? (
            <View style={styles.bank_info_card}>
              <View style={styles.bank_row}>
                <Text style={styles.bank_label}>Bank Name:</Text>
                <Text style={styles.bank_val}>{restaurant.bank.bank_name}</Text>
              </View>
              <View style={styles.bank_row}>
                <Text style={styles.bank_label}>Account Number:</Text>
                <Text style={styles.bank_val}>{restaurant.bank.account_number}</Text>
              </View>
              <View style={styles.bank_row}>
                <Text style={styles.bank_label}>Account Name:</Text>
                <Text style={styles.bank_val}>{restaurant.bank.account_name}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.no_bank_text}>
              No verified bank account linked yet. Complete verification in
              onboarding.
            </Text>
          )}
        </View>

        {/* ── Big Submit / Save Button ── */}
        <TouchableOpacity
          style={[styles.big_save_btn, saving && styles.save_btn_disabled]}
          disabled={saving}
          onPress={handleSaveDetails}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#121212" />
          ) : (
            <>
              <Feather name="check-circle" size={18} color="#121212" />
              <Text style={styles.big_save_text}>Save All Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── Time Picker Modal ── */}
      <Modal
        visible={timePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <View style={styles.modal_overlay}>
          <Pressable
            style={styles.modal_backdrop}
            onPress={() => setTimePickerVisible(false)}
          />
          <View style={styles.modal_content}>
            <Text style={styles.modal_title}>
              Set {activeTimeField === "open" ? "Opening" : "Closing"} Time
            </Text>
            <Text style={styles.modal_sub}>
              Enter time in format (e.g. 08:00 AM or 10:00 PM)
            </Text>

            <TextInput
              style={styles.time_modal_input}
              value={tempTimeInput}
              onChangeText={setTempTimeInput}
              autoFocus
              placeholder="08:00 AM"
              placeholderTextColor="#666"
            />

            {/* Preset Time Quick Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.time_presets_row}
            >
              {[
                "07:00 AM",
                "08:00 AM",
                "09:00 AM",
                "10:00 AM",
                "06:00 PM",
                "08:00 PM",
                "10:00 PM",
                "11:00 PM",
              ].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={styles.preset_chip}
                  onPress={() => setTempTimeInput(t)}
                >
                  <Text style={styles.preset_chip_text}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modal_actions_row}>
              <TouchableOpacity
                style={styles.modal_cancel_btn}
                onPress={() => setTimePickerVisible(false)}
              >
                <Text style={styles.modal_cancel_text}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modal_confirm_btn}
                onPress={confirmTimePicker}
              >
                <Text style={styles.modal_confirm_text}>Set Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EditRestaurantDetails;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },

  // Top Nav Header
  top_header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: "#1a1a1a",
  },
  back_btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  header_center: {
    alignItems: "center",
  },
  header_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 17,
  },
  header_sub: {
    color: "#888",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 1,
  },
  save_header_btn: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  save_header_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  save_btn_disabled: {
    opacity: 0.5,
  },

  scroll_content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 18,
  },

  // Hero Card
  hero_card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  banner_container: {
    height: 130,
    width: "100%",
    backgroundColor: "#222",
    position: "relative",
  },
  banner_image: {
    width: "100%",
    height: "100%",
  },
  banner_placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1f1f1f",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  banner_placeholder_text: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  banner_overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    padding: 12,
  },
  change_banner_pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#00000088",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffffff33",
  },
  change_banner_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 11,
  },

  logo_meta_row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: -36,
    gap: 14,
  },
  logo_wrapper: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "#1a1a1a",
    borderWidth: 3,
    borderColor: "#121212",
    position: "relative",
    overflow: "hidden",
  },
  logo_image: {
    width: "100%",
    height: "100%",
  },
  logo_placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  logo_camera_badge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },
  hero_meta_info: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: 10,
  },
  hero_store_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 17,
  },
  hero_store_sub: {
    color: "#888",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 2,
  },

  // Section Cards
  section_card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 14,
  },
  section_title_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  section_icon_box: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
  section_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  section_hint: {
    color: "#888",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginTop: -6,
  },

  // Form Inputs
  input_group: {
    gap: 6,
  },
  input_label: {
    color: "#888",
    fontFamily: "raleway-semibold",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  text_input: {
    backgroundColor: "#121212",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  multiline_input: {
    minHeight: 80,
  },
  row_inputs: {
    flexDirection: "row",
    gap: 12,
  },

  // Tags Container
  tags_container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag_chip: {
    backgroundColor: "#121212",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  tag_chip_selected: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  tag_chip_text: {
    color: "#aaa",
    fontFamily: "raleway-medium",
    fontSize: 12,
  },
  tag_chip_text_selected: {
    color: "#121212",
    fontFamily: "raleway-bold",
  },

  // Operating Hours
  copy_mon_btn: {
    backgroundColor: "#262626",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  copy_mon_text: {
    color: "#aaa",
    fontFamily: "raleway-semibold",
    fontSize: 10,
  },
  hours_list: {
    gap: 10,
  },
  hour_row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#121212",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  hour_left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  day_name_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
    width: 36,
  },
  open_closed_status: {
    fontFamily: "raleway-semibold",
    fontSize: 11,
    marginLeft: 2,
  },
  text_open: {
    color: "#4CAF50",
  },
  text_closed: {
    color: "#F44336",
  },
  time_buttons_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  time_pill: {
    backgroundColor: "#1f1f1f",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  time_pill_label: {
    color: "#666",
    fontFamily: "raleway-semibold",
    fontSize: 8,
  },
  time_pill_val: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 11,
    marginTop: 1,
  },
  time_dash: {
    color: "#666",
    fontSize: 12,
  },
  closed_label_text: {
    color: "#666",
    fontFamily: "raleway-italic",
    fontSize: 12,
  },

  // Location & Radius
  radius_header_row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  radius_value_text: {
    color: "#4CAF50",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  radius_stepper_row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  radius_chip: {
    flex: 1,
    backgroundColor: "#121212",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  radius_chip_active: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  radius_chip_text: {
    color: "#aaa",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  radius_chip_text_active: {
    color: "#121212",
    fontFamily: "raleway-bold",
  },

  // Bank Info Card
  bank_info_card: {
    backgroundColor: "#121212",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 6,
  },
  bank_row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bank_label: {
    color: "#888",
    fontFamily: "raleway-medium",
    fontSize: 12,
  },
  bank_val: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  no_bank_text: {
    color: "#888",
    fontFamily: "raleway-italic",
    fontSize: 12,
  },

  // Big Save Button
  big_save_btn: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  big_save_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },

  // Modal
  modal_overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modal_backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modal_content: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333",
    gap: 14,
  },
  modal_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 17,
  },
  modal_sub: {
    color: "#888",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginTop: -8,
  },
  time_modal_input: {
    backgroundColor: "#121212",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  time_presets_row: {
    gap: 8,
    paddingVertical: 4,
  },
  preset_chip: {
    backgroundColor: "#262626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  preset_chip_text: {
    color: "#ccc",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  modal_actions_row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  modal_cancel_btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#262626",
    alignItems: "center",
  },
  modal_cancel_text: {
    color: "#aaa",
    fontFamily: "raleway-semibold",
    fontSize: 14,
  },
  modal_confirm_btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  modal_confirm_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
});

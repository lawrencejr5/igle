import {
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { driver_reg_styles } from "../../styles/driver_reg_styles";
import { useRestaurantContext } from "../../context/RestaurantContext";
import { useNotificationContext } from "../../context/NotificationContext";

// ─── Category Tags ─────────────────────────────────────────────────────────────

const ALL_CATEGORIES = [
  "Nigerian",
  "Fast Food",
  "Pizza",
  "Burgers",
  "Chicken",
  "Shawarma",
  "Chinese",
  "Asian",
  "Continental",
  "Seafood",
  "Grills & BBQ",
  "Soups & Swallow",
  "Rice Dishes",
  "Pasta",
  "Salads",
  "Wraps & Sandwiches",
  "Breakfast",
  "Desserts",
  "Ice Cream",
  "Drinks & Smoothies",
  "Pastries & Bakery",
  "Vegan",
  "Healthy",
  "Sushi",
  "Indian",
  "Lebanese",
  "Street Food",
  "Snacks",
  "Noodles",
  "Pepper Soup",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Helper to parse time string like "08:00 AM" into a Date object
const parseTimeString = (timeStr: string): Date => {
  const d = new Date();
  if (!timeStr) return d;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return d;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  d.setHours(hours, minutes, 0, 0);
  return d;
};

// Helper to format Date object into "08:00 AM" string
const formatTimeDate = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${formattedHours}:${formattedMinutes} ${period}`;
};

// ─── Screen ────────────────────────────────────────────────────────────────────

const RestaurantDetails = () => {
  const styles = driver_reg_styles();
  const params = useLocalSearchParams<{ mode?: string }>();
  const {
    restaurant,
    registrationDraft,
    updateRegistrationDraft,
    saveStageDetails,
    loading: isSavingStage,
  } = useRestaurantContext();
  const { showNotification } = useNotificationContext()!;

  // Automatically navigate to verification screen if application is already submitted
  React.useEffect(() => {
    if (
      params.mode !== "edit" &&
      restaurant?.application &&
      restaurant.application !== "none"
    ) {
      router.replace("/(restaurant_auth)/restaurant_verification");
    }
  }, [restaurant, params.mode]);

  // Image states
  const [logoUri, setLogoUri] = useState<string>(registrationDraft.logoUri || "");
  const [bannerUri, setBannerUri] = useState<string>(registrationDraft.bannerUri || "");

  // Form states
  const [restaurantName, setRestaurantName] = useState(registrationDraft.name || "");
  const [phone, setPhone] = useState(registrationDraft.phone || "");
  const [email, setEmail] = useState(registrationDraft.email || "");
  const [description, setDescription] = useState(registrationDraft.description || "");

  // Sync state if draft changes (e.g., after populateDraftFromRestaurant)
  React.useEffect(() => {
    if (registrationDraft.name) setRestaurantName(registrationDraft.name);
    if (registrationDraft.phone) setPhone(registrationDraft.phone);
    if (registrationDraft.email) setEmail(registrationDraft.email);
    if (registrationDraft.description) setDescription(registrationDraft.description);
    if (registrationDraft.logoUri) setLogoUri(registrationDraft.logoUri);
    if (registrationDraft.bannerUri) setBannerUri(registrationDraft.bannerUri);
    if (registrationDraft.category_tags?.length) setSelectedCategories(registrationDraft.category_tags);
  }, [registrationDraft]);

  // Category tags
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    registrationDraft.category_tags || []
  );
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Operating hours: per day { open: string, close: string, closed: bool }
  const [hours, setHours] = useState<
    Record<string, { open: string; close: string; closed: boolean }>
  >(() => {
    if (registrationDraft.operating_hours?.length > 0) {
      const map: Record<string, { open: string; close: string; closed: boolean }> = {};
      registrationDraft.operating_hours.forEach((h) => {
        map[h.day] = { open: h.open, close: h.close, closed: h.closed };
      });
      return map;
    }
    return Object.fromEntries(
      DAYS.map((d) => [
        d,
        { open: "08:00 AM", close: "10:00 PM", closed: false },
      ])
    );
  });

  // Time Picker modal state
  const [timePickerState, setTimePickerState] = useState<{
    show: boolean;
    day: string;
    field: "open" | "close";
    date: Date;
  }>({
    show: false,
    day: "Mon",
    field: "open",
    date: new Date(),
  });

  const openTimePicker = (day: string, field: "open" | "close") => {
    const timeStr = hours[day][field];
    setTimePickerState({
      show: true,
      day,
      field,
      date: parseTimeString(timeStr),
    });
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (event?.type === "dismissed") {
      setTimePickerState((prev) => ({ ...prev, show: false }));
      return;
    }
    if (Platform.OS === "android") {
      setTimePickerState((prev) => ({ ...prev, show: false }));
    }
    if (selectedDate) {
      const formatted = formatTimeDate(selectedDate);
      updateHour(timePickerState.day, timePickerState.field, formatted);
      setTimePickerState((prev) => ({ ...prev, date: selectedDate }));
    }
  };

  // ── Image Pickers ──────────────────────────────────────────────────────────

  const pickImage = async (
    setter: (uri: string) => void,
    aspect: [number, number],
  ) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length) {
      setter(result.assets[0].uri);
    }
  };

  // ── Category helpers ───────────────────────────────────────────────────────

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const filteredCategories = ALL_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  // ── Hours helpers ──────────────────────────────────────────────────────────

  const updateHour = (day: string, field: "open" | "close", value: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const toggleDayClosed = (day: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day].closed },
    }));
  };

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (!logoUri) {
      showNotification("Please upload a logo image for your restaurant", "error");
      return;
    }
    if (!restaurantName.trim()) {
      showNotification("Please enter your restaurant name", "error");
      return;
    }
    if (!phone.trim()) {
      showNotification("Please enter a contact phone number", "error");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      showNotification("Please enter a valid contact email address", "error");
      return;
    }
    if (selectedCategories.length === 0) {
      showNotification("Please select at least one category tag", "error");
      return;
    }

    const operatingHoursArray = DAYS.map((d) => ({
      day: d,
      open: hours[d]?.open || "08:00 AM",
      close: hours[d]?.close || "10:00 PM",
      closed: !!hours[d]?.closed,
    }));

    const draftData = {
      logoUri,
      bannerUri,
      name: restaurantName,
      phone,
      email,
      description,
      category_tags: selectedCategories,
      operating_hours: operatingHoursArray,
    };

    updateRegistrationDraft(draftData);

    try {
      await saveStageDetails(draftData);
      router.push("/(restaurant_auth)/restaurant_location");
    } catch (e) {
      // Error toast already displayed by context
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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

        {/* Progress — step 1 of 4 */}
        <View style={styles.progress_bar_container}>
          <View style={[styles.progress_bar, { backgroundColor: "#fff" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#484848" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#484848" }]} />
          <View style={[styles.progress_bar, { backgroundColor: "#484848" }]} />
        </View>

        <ScrollView
          style={{ flex: 1, backgroundColor: "#121212" }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 400 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={{ marginTop: 20 }}>
            <Text style={styles.form_header_text}>Restaurant Details</Text>
            <Text style={styles.form_subheader_text}>
              Tell customers who you are and what you serve
            </Text>
          </View>

          {/* ── Banner ── */}
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.inp_label, { marginBottom: 8 }]}>
              Restaurant Banner
            </Text>
            <TouchableOpacity
              onPress={() => pickImage(setBannerUri, [16, 9])}
              style={localStyles.banner_picker}
            >
              {bannerUri ? (
                <Image
                  source={{ uri: bannerUri }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                />
              ) : null}
              <View
                style={[
                  localStyles.banner_overlay,
                  bannerUri ? { backgroundColor: "#00000066" } : {},
                ]}
              >
                <Feather name="image" size={28} color="#fff" />
                <Text style={localStyles.picker_hint}>
                  {bannerUri
                    ? "Tap to change banner"
                    : "Tap to upload banner photo"}
                </Text>
                <Text style={localStyles.picker_sub}>
                  Recommended: 1200 × 675px
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Logo ── */}
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.inp_label, { marginBottom: 8 }]}>
              Restaurant Logo / Profile Picture
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
            >
              <TouchableOpacity
                onPress={() => pickImage(setLogoUri, [1, 1])}
                style={localStyles.logo_picker}
              >
                {logoUri ? (
                  <Image
                    source={{ uri: logoUri }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                  />
                ) : (
                  <Feather name="camera" size={22} color="#aaa" />
                )}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "raleway-semibold",
                    fontSize: 13,
                  }}
                >
                  {logoUri ? "Logo uploaded ✓" : "Upload your restaurant logo"}
                </Text>
                <Text
                  style={{
                    color: "#777",
                    fontFamily: "raleway-regular",
                    fontSize: 11,
                    marginTop: 3,
                  }}
                >
                  Shown as your profile icon to customers
                </Text>
              </View>
            </View>
          </View>

          {/* ── Restaurant Name ── */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Restaurant Name</Text>
            <View style={styles.inp_holder}>
              <Feather name="shopping-bag" size={18} color="white" />
              <TextInput
                style={styles.text_input}
                placeholder="e.g. Mama's Kitchen & Grill"
                placeholderTextColor="#c5c5c5"
                value={restaurantName}
                onChangeText={setRestaurantName}
              />
            </View>
          </View>

          {/* ── Category Tags ── */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Category Tags</Text>

            {/* Inline Input Container with Pills */}
            <View
              style={[
                styles.inp_holder,
                {
                  alignItems:
                    selectedCategories.length > 0 ? "flex-start" : "center",
                },
              ]}
            >
              <Feather
                name="tag"
                size={18}
                color="white"
                style={{
                  marginTop:
                    selectedCategories.length > 0
                      ? Platform.OS === "ios"
                        ? 4
                        : 6
                      : 0,
                }}
              />

              <View style={localStyles.category_input_wrap}>
                {/* Pill Tags */}
                {selectedCategories.map((cat) => (
                  <View key={cat} style={localStyles.tag_chip}>
                    <Text style={localStyles.tag_chip_text}>{cat}</Text>
                    <TouchableOpacity
                      onPress={() => toggleCategory(cat)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="x" size={12} color="#121212" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Inline Search Input */}
                <TextInput
                  style={localStyles.category_text_input}
                  placeholder={
                    selectedCategories.length === 0
                      ? "Search & add categories..."
                      : "Add more..."
                  }
                  placeholderTextColor="#c5c5c5"
                  value={categorySearch}
                  onChangeText={setCategorySearch}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => {
                    // Small delay to allow tapping suggestions
                    setTimeout(() => setIsInputFocused(false), 200);
                  }}
                />
              </View>
            </View>

            {/* Suggestions Dropdown */}
            {(isInputFocused || categorySearch.trim().length > 0) && (
              <View style={localStyles.suggestions_container}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  style={{ maxHeight: 180 }}
                >
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            localStyles.suggestion_item,
                            isSelected && localStyles.suggestion_item_selected,
                          ]}
                          onPress={() => {
                            toggleCategory(cat);
                            setCategorySearch("");
                          }}
                        >
                          <Text
                            style={[
                              localStyles.suggestion_text,
                              isSelected &&
                                localStyles.suggestion_text_selected,
                            ]}
                          >
                            {cat}
                          </Text>
                          {isSelected && (
                            <Feather name="check" size={14} color="#fff" />
                          )}
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <Text style={localStyles.no_suggestions_text}>
                      No matching categories found
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* ── Phone ── */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Contact Phone</Text>
            <View style={styles.inp_holder}>
              <Feather name="phone" size={18} color="white" />
              <TextInput
                style={styles.text_input}
                placeholder="+234 800 000 0000"
                placeholderTextColor="#c5c5c5"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* ── Email ── */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Contact Email</Text>
            <View style={styles.inp_holder}>
              <Feather name="mail" size={18} color="white" />
              <TextInput
                style={styles.text_input}
                placeholder="restaurant@email.com"
                placeholderTextColor="#c5c5c5"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* ── Operating Hours ── */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Operating Hours</Text>
            <View style={localStyles.hours_card}>
              {DAYS.map((day) => (
                <View key={day} style={localStyles.hours_row}>
                  <Text style={localStyles.hours_day}>{day}</Text>
                  {hours[day].closed ? (
                    <Text style={localStyles.hours_closed_text}>Closed</Text>
                  ) : (
                    <View style={localStyles.hours_inputs}>
                      <TouchableOpacity
                        style={localStyles.hours_btn}
                        onPress={() => openTimePicker(day, "open")}
                      >
                        <Text style={localStyles.hours_btn_text}>
                          {hours[day].open}
                        </Text>
                      </TouchableOpacity>
                      <Text style={{ color: "#777" }}>–</Text>
                      <TouchableOpacity
                        style={localStyles.hours_btn}
                        onPress={() => openTimePicker(day, "close")}
                      >
                        <Text style={localStyles.hours_btn_text}>
                          {hours[day].close}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => toggleDayClosed(day)}>
                    <View
                      style={[
                        localStyles.closed_toggle,
                        hours[day].closed && localStyles.closed_toggle_active,
                      ]}
                    >
                      <Text style={localStyles.closed_toggle_text}>
                        {hours[day].closed ? "Open" : "Close"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* ── Description ── */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Restaurant Description</Text>
            <View
              style={[
                styles.inp_holder,
                { alignItems: "flex-start", paddingTop: 12 },
              ]}
            >
              <TextInput
                style={[
                  styles.text_input,
                  { minHeight: 90, textAlignVertical: "top" },
                ]}
                placeholder="Describe your restaurant, signature dishes, vibe..."
                placeholderTextColor="#c5c5c5"
                multiline
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>
        </ScrollView>

        {/* Next Button */}
        <View
          style={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 }}
        >
          <TouchableWithoutFeedback
            onPress={handleNext}
            disabled={isSavingStage}
          >
            <View style={[styles.sign_btn, isSavingStage && { opacity: 0.6 }]}>
              {isSavingStage ? (
                <ActivityIndicator size="small" color="#121212" />
              ) : (
                <Text style={styles.sign_btn_text}>Next: Location</Text>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </KeyboardAvoidingView>

      {/* ── Time Picker ── */}
      {timePickerState.show &&
        (Platform.OS === "ios" ? (
          <Modal
            transparent
            animationType="fade"
            visible={timePickerState.show}
            onRequestClose={() =>
              setTimePickerState((prev) => ({ ...prev, show: false }))
            }
          >
            <TouchableOpacity
              style={localStyles.time_picker_overlay}
              activeOpacity={1}
              onPress={() =>
                setTimePickerState((prev) => ({ ...prev, show: false }))
              }
            >
              <View
                style={localStyles.time_picker_sheet}
                onStartShouldSetResponder={() => true}
              >
                <View style={localStyles.time_picker_header}>
                  <Text style={localStyles.time_picker_title}>
                    Select{" "}
                    {timePickerState.field === "open" ? "Opening" : "Closing"}{" "}
                    Time ({timePickerState.day})
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setTimePickerState((prev) => ({ ...prev, show: false }))
                    }
                  >
                    <Text style={localStyles.time_picker_done}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={timePickerState.date}
                  mode="time"
                  is24Hour={false}
                  display="spinner"
                  textColor="#ffffff"
                  onChange={handleTimeChange}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        ) : (
          <DateTimePicker
            value={timePickerState.date}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={handleTimeChange}
          />
        ))}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default RestaurantDetails;

// ─── Local Styles ──────────────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  // Banner
  banner_picker: {
    height: 160,
    borderRadius: 14,
    backgroundColor: "#2a2a2a",
    overflow: "hidden",
    position: "relative",
  },
  banner_overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  picker_hint: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 14,
  },
  picker_sub: {
    color: "#aaa",
    fontFamily: "raleway-regular",
    fontSize: 11,
  },
  // Logo
  logo_picker: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#3a3a3a",
  },
  // Tags
  // Tags & Suggestions
  category_input_box: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#757575",
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 10,
    borderRadius: 7,
  },
  category_input_wrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  category_text_input: {
    flex: 1,
    minWidth: 120,
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 14,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
  },
  tag_chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tag_chip_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  suggestions_container: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  suggestion_item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  suggestion_item_selected: {
    backgroundColor: "#2a2a2a",
  },
  suggestion_text: {
    color: "#ccc",
    fontFamily: "raleway-semibold",
    fontSize: 14,
  },
  suggestion_text_selected: {
    color: "#fff",
    fontFamily: "raleway-bold",
  },
  no_suggestions_text: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 13,
    padding: 14,
    textAlign: "center",
  },
  // Hours
  hours_card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    marginTop: 10,
    overflow: "hidden",
  },
  hours_row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
    gap: 8,
  },
  hours_day: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
    width: 34,
  },
  hours_inputs: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hours_btn: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  hours_btn_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  hours_closed_text: {
    flex: 1,
    color: "#555",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  closed_toggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
  },
  closed_toggle_active: {
    backgroundColor: "#ffffff22",
  },
  closed_toggle_text: {
    color: "#aaa",
    fontFamily: "raleway-semibold",
    fontSize: 11,
  },
  // Modal
  modal_overlay: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "flex-end",
  },
  modal_sheet: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: "80%",
  },
  modal_handle: {
    width: 40,
    height: 4,
    backgroundColor: "#3a3a3a",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  modal_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
    marginBottom: 14,
  },
  modal_search_box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 14,
  },
  modal_search_input: {
    flex: 1,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 14,
  },
  cat_grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 16,
  },
  cat_option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  cat_option_selected: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  cat_option_text: {
    color: "#ccc",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  cat_option_text_selected: {
    color: "#121212",
  },
  modal_done_btn: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 12,
  },
  modal_done_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  time_picker_overlay: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "flex-end",
  },
  time_picker_sheet: {
    backgroundColor: "#1e1e1e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    paddingTop: 16,
  },
  time_picker_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  time_picker_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  time_picker_done: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
});

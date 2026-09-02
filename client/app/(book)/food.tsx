import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Image } from "expo-image";
import React, { useState, useMemo } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// ─── Restaurant Data ──────────────────────────────────────────────────────────

const RESTAURANTS = [
  {
    id: "1",
    name: "Pizza Palace",
    cuisine: "Italian · Gourmet Pizza",
    category: "Pizza",
    rating: 4.9,
    deliveryTime: "20–30 min",
    deliveryFee: "₦550",
    image: require("../../assets/images/restaurants/ivan-torres-MQUqbmszGGM-unsplash.jpg"),
  },
  {
    id: "2",
    name: "Smokey BBQ & Ribs",
    cuisine: "American · BBQ & Grill",
    category: "Burgers",
    rating: 4.5,
    deliveryTime: "25–35 min",
    deliveryFee: "₦600",
    image: require("../../assets/images/restaurants/alexandru-bogdan-ghita-UeYkqQh4PoI-unsplash.jpg"),
  },
  {
    id: "3",
    name: "Crispy Crunch Chicken",
    cuisine: "Fast Food · Fried Chicken",
    category: "Chicken",
    rating: 4.8,
    deliveryTime: "15–25 min",
    deliveryFee: "₦450",
    image: require("../../assets/images/restaurants/brian-chan-NbXjZomyNEM-unsplash.jpg"),
  },
  {
    id: "4",
    name: "Prime Steakhouse",
    cuisine: "Gourmet · Steaks & Salads",
    category: "Rice",
    rating: 4.6,
    deliveryTime: "25–40 min",
    deliveryFee: "₦700",
    image: require("../../assets/images/restaurants/edward-howell-vvUy1hWVYEA-unsplash.jpg"),
  },

  {
    id: "5",
    name: "Wok & Noodle House",
    cuisine: "Asian · Stir-Fry & Noodles",
    category: "Asian",
    rating: 4.4,
    deliveryTime: "15–25 min",
    deliveryFee: "₦400",
    image: require("../../assets/images/restaurants/orijit-chatterjee-wEBg_pYtynw-unsplash.jpg"),
  },
  {
    id: "6",
    name: "Tokyo Bento & Grill",
    cuisine: "Asian · Japanese & Seafood",
    category: "Asian",
    rating: 4.7,
    deliveryTime: "30–45 min",
    deliveryFee: "₦800",
    image: require("../../assets/images/restaurants/vinn-koonyosying-vBOxsZrfiCw-unsplash.jpg"),
  },
  {
    id: "7",
    name: "The Social Bistro",
    cuisine: "Continental · Drinks & Bites",
    category: "Fast Food",
    rating: 4.7,
    deliveryTime: "20–30 min",
    deliveryFee: "₦500",
    image: require("../../assets/images/restaurants/alex-haney-CAhjZmVk5H4-unsplash.jpg"),
  },
];

const CATEGORIES = [
  "All",
  "Chicken",
  "Pizza",
  "Burgers",
  "Fast Food",
  "Rice",
  "Asian",
];

// ─── Root Screen ──────────────────────────────────────────────────────────────

const OrderFood = () => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(() => {
    return RESTAURANTS.filter((r) => {
      const matchesCategory =
        activeCategory === "All" || r.category === activeCategory;
      const matchesSearch =
        search.trim() === "" ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View
        style={[
          styles.container,
          {
            paddingTop: Platform.OS === "ios" ? insets.top : insets.top + 10,
          },
        ]}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable
            style={styles.back_btn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
          >
            <Feather name="arrow-left" size={25} color="#fff" />
          </Pressable>
          <Text style={styles.header_title}>Order Food</Text>
          <View style={{ width: 45 }} />
        </View>

        {/* ── Search ── */}
        <View style={styles.search_container}>
          <Feather
            name="search"
            size={16}
            color="#777"
            style={{ marginLeft: 4 }}
          />
          <TextInput
            style={styles.search_input}
            placeholder="Search restaurants or dishes…"
            placeholderTextColor="#555"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
                Keyboard.dismiss();
              }}
            >
              <Feather
                name="x"
                size={16}
                color="#777"
                style={{ marginRight: 4 }}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Category Pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.category_scroll}
          keyboardShouldPersistTaps="handled"
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => {
                Keyboard.dismiss();
                setActiveCategory(cat);
              }}
              style={[
                styles.category_pill,
                activeCategory === cat && styles.category_pill_active,
              ]}
            >
              <Text
                style={[
                  styles.category_pill_text,
                  activeCategory === cat && styles.category_pill_text_active,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Restaurant List ── */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.list_content,
            Platform.OS === "ios"
              ? { paddingBottom: insets.bottom + 20 }
              : { paddingBottom: 40 },
          ]}
        >
          <Text style={styles.section_label}>Restaurants Around You</Text>

          {filtered.length === 0 ? (
            <View style={styles.no_results}>
              <Image
                source={require("../../assets/images/icons/no-results.png")}
                style={styles.no_results_img}
                contentFit="contain"
              />
              <Text style={styles.no_results_text}>No restaurants found</Text>
              <Text style={styles.no_results_sub}>
                Try a different search or category
              </Text>
            </View>
          ) : (
            filtered.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))
          )}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default OrderFood;

// ─── Restaurant Card ──────────────────────────────────────────────────────────

const RestaurantCard = ({
  restaurant,
}: {
  restaurant: (typeof RESTAURANTS)[0];
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
          pathname: "/(book)/restaurant/[id]",
          params: { id: restaurant.id },
        });
      }}
    >
      {/* Banner Image on Left */}
      <View style={styles.card_left}>
        <Image
          source={restaurant.image}
          style={styles.card_image}
          contentFit="cover"
        />
        <View style={styles.cuisine_badge}>
          <Text style={styles.cuisine_badge_text}>{restaurant.category}</Text>
        </View>
      </View>

      {/* Content on Right */}
      <View style={styles.card_right}>
        <View style={styles.card_top_row}>
          <Text style={styles.card_name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          {/* Rating */}
          <View style={styles.rating_box}>
            <Image
              source={require("../../assets/images/icons/star-icon.png")}
              style={{ width: 11, height: 11, tintColor: "#fff" }}
              contentFit="contain"
            />
            <Text style={styles.rating_text}>{restaurant.rating}</Text>
          </View>
        </View>

        <Text style={styles.card_cuisine} numberOfLines={1}>
          {restaurant.cuisine}
        </Text>

        {/* Bottom row */}
        <View style={styles.card_bottom_row}>
          <View style={styles.card_meta_item}>
            <Feather name="clock" size={11} color="#9CA3AF" />
            <Text style={styles.card_meta_text}>{restaurant.deliveryTime}</Text>
          </View>
          <View style={styles.dot_separator} />
          <View style={styles.card_meta_item}>
            <Feather name="truck" size={11} color="#9CA3AF" />
            <Text style={styles.card_meta_text}>
              {restaurant.deliveryFee} delivery
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  back_btn: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  header_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  // Search
  search_container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 14,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginBottom: 14,
  },
  search_input: {
    flex: 1,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 14,
  },
  // Categories
  category_scroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  category_pill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    height: 36,
  },
  category_pill_active: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  category_pill_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 13,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  category_pill_text_active: {
    color: "#121212",
  },
  // List
  list_content: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  section_label: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 17,
    marginBottom: 14,
  },
  // Horizontal Restaurant Card
  card: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    padding: 10,
    alignItems: "center",
    gap: 12,
  },
  card_left: {
    position: "relative",
    width: 105,
    height: 95,
    borderRadius: 12,
    overflow: "hidden",
  },
  card_image: {
    width: "100%",
    height: "100%",
  },
  cuisine_badge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "#121212cc",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cuisine_badge_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 10,
  },
  card_right: {
    flex: 1,
    justifyContent: "center",
  },
  card_top_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  card_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
    flex: 1,
    marginRight: 6,
  },
  rating_box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rating_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 11,
  },
  card_cuisine: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginBottom: 10,
  },
  card_bottom_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  card_meta_item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  card_meta_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 11,
  },
  dot_separator: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#555",
  },
  // No results
  no_results: {
    alignItems: "center",
    paddingVertical: 60,
  },
  no_results_img: {
    width: 80,
    height: 80,
    marginBottom: 16,
    tintColor: "#333",
  },
  no_results_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
    marginBottom: 6,
  },
  no_results_sub: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 13,
    textAlign: "center",
  },
});

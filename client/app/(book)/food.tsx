import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import React, { useState, useMemo } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

// ─── Restaurant Data ──────────────────────────────────────────────────────────

const RESTAURANTS = [
  {
    id: "1",
    name: "KFC Naija",
    cuisine: "Chicken",
    category: "Chicken",
    rating: 4.7,
    deliveryTime: "20–30 min",
    deliveryFee: "₦500",
    image: require("../../assets/images/restaurants/alex-haney-CAhjZmVk5H4-unsplash.jpg"),
  },
  {
    id: "2",
    name: "Pizza Palace",
    cuisine: "Italian · Pizza",
    category: "Pizza",
    rating: 4.5,
    deliveryTime: "25–35 min",
    deliveryFee: "₦600",
    image: require("../../assets/images/restaurants/alexandru-bogdan-ghita-UeYkqQh4PoI-unsplash.jpg"),
  },
  {
    id: "3",
    name: "Burger Barn",
    cuisine: "American · Burgers",
    category: "Burgers",
    rating: 4.4,
    deliveryTime: "15–25 min",
    deliveryFee: "₦450",
    image: require("../../assets/images/restaurants/brian-chan-NbXjZomyNEM-unsplash.jpg"),
  },
  {
    id: "4",
    name: "Spice Route",
    cuisine: "Fast Food · Snacks",
    category: "Fast Food",
    rating: 4.3,
    deliveryTime: "20–30 min",
    deliveryFee: "₦400",
    image: require("../../assets/images/restaurants/edward-howell-vvUy1hWVYEA-unsplash.jpg"),
  },
  {
    id: "5",
    name: "Mama's Kitchen",
    cuisine: "Nigerian · Rice & Stew",
    category: "Rice",
    rating: 4.8,
    deliveryTime: "30–45 min",
    deliveryFee: "₦350",
    image: require("../../assets/images/restaurants/ivan-torres-MQUqbmszGGM-unsplash.jpg"),
  },
  {
    id: "6",
    name: "Street Bites",
    cuisine: "Fast Food · Shawarma",
    category: "Fast Food",
    rating: 4.2,
    deliveryTime: "15–20 min",
    deliveryFee: "₦300",
    image: require("../../assets/images/restaurants/orijit-chatterjee-wEBg_pYtynw-unsplash.jpg"),
  },
  {
    id: "7",
    name: "Sushi Stop",
    cuisine: "Asian · Japanese",
    category: "Asian",
    rating: 4.6,
    deliveryTime: "35–50 min",
    deliveryFee: "₦800",
    image: require("../../assets/images/restaurants/vinn-koonyosying-vBOxsZrfiCw-unsplash.jpg"),
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
        <TouchableOpacity style={styles.back_btn} onPress={() => router.back()}>
          <Feather name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.header_title}>Order Food</Text>
        <View style={{ width: 38 }} />
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
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
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
        contentContainerStyle={styles.category_scroll}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setActiveCategory(cat)}
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
        showsVerticalScrollIndicator={false}
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
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      {/* Image */}
      <Image
        source={restaurant.image}
        style={styles.card_image}
        contentFit="cover"
      />

      {/* Cuisine badge */}
      <View style={styles.cuisine_badge}>
        <Text style={styles.cuisine_badge_text}>{restaurant.category}</Text>
      </View>

      {/* Card body */}
      <View style={styles.card_body}>
        <View style={styles.card_top_row}>
          <Text style={styles.card_name}>{restaurant.name}</Text>
          {/* Rating */}
          <View style={styles.rating_box}>
            <Image
              source={require("../../assets/images/icons/star-icon.png")}
              style={{ width: 12, height: 12, tintColor: "#FFB800" }}
              contentFit="contain"
            />
            <Text style={styles.rating_text}>{restaurant.rating}</Text>
          </View>
        </View>

        <Text style={styles.card_cuisine}>{restaurant.cuisine}</Text>

        {/* Bottom row */}
        <View style={styles.card_bottom_row}>
          <View style={styles.card_meta_item}>
            <Feather name="clock" size={12} color="#9CA3AF" />
            <Text style={styles.card_meta_text}>{restaurant.deliveryTime}</Text>
          </View>
          <View style={styles.dot_separator} />
          <View style={styles.card_meta_item}>
            <Feather name="truck" size={12} color="#9CA3AF" />
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#1e1e1e",
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
    paddingBottom: 14,
  },
  category_pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#1a1a1a",
  },
  category_pill_active: {
    backgroundColor: "#ff9d00",
    borderColor: "#ff9d00",
  },
  category_pill_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  category_pill_text_active: {
    color: "#121212",
  },
  // List
  list_content: {
    paddingHorizontal: 16,
  },
  section_label: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 17,
    marginBottom: 14,
  },
  // Restaurant card
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  card_image: {
    width: "100%",
    height: 160,
  },
  cuisine_badge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#121212cc",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  cuisine_badge_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 11,
  },
  card_body: {
    padding: 14,
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
    fontSize: 16,
  },
  rating_box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rating_text: {
    color: "#FFB800",
    fontFamily: "raleway-bold",
    fontSize: 12,
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
    gap: 5,
  },
  card_meta_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
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

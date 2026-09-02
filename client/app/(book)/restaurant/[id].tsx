import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import React, { useState, useMemo, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// ─── Restaurant & Products Data ───────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "Popular" | "Mains" | "Sides" | "Drinks" | "Desserts";
  image?: any;
}

export interface RestaurantData {
  id: string;
  name: string;
  cuisine: string;
  category: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: string;
  minOrder: string;
  image: any;
  address: string;
  products: Product[];
}

export const RESTAURANTS_DATA: Record<string, RestaurantData> = {
  "1": {
    id: "1",
    name: "Pizza Palace",
    cuisine: "Italian · Gourmet Pizza",
    category: "Pizza",
    rating: 4.9,
    deliveryTime: "20–30 min",
    deliveryFee: "₦550",
    minOrder: "₦2,500",
    address: "12 Marina Boulevard, Victoria Island",
    image: require("../../../assets/images/restaurants/ivan-torres-MQUqbmszGGM-unsplash.jpg"),
    products: [
      {
        id: "p1_1",
        name: "Pepperoni Feast Pizza",
        description: "Double pepperoni, mozzarella, rich tomato sauce & oregano",
        price: 6500,
        category: "Popular",
      },
      {
        id: "p1_2",
        name: "Four Cheese Supreme",
        description: "Mozzarella, cheddar, parmesan & blue cheese blend",
        price: 7200,
        category: "Mains",
      },
      {
        id: "p1_3",
        name: "Garlic Butter Breadsticks",
        description: "Freshly baked dough strips brushed with garlic butter & herbs",
        price: 2000,
        category: "Sides",
      },
      {
        id: "p1_4",
        name: "Cheesy Meatballs & Sauce",
        description: "Tender beef meatballs in marinara sauce topped with melted cheese",
        price: 3500,
        category: "Sides",
      },
      {
        id: "p1_5",
        name: "Cold Coca-Cola (50cl)",
        description: "Refreshing ice-cold carbonated soft drink",
        price: 800,
        category: "Drinks",
      },
    ],
  },
  "2": {
    id: "2",
    name: "Smokey BBQ & Ribs",
    cuisine: "American · BBQ & Grill",
    category: "Burgers",
    rating: 4.5,
    deliveryTime: "25–35 min",
    deliveryFee: "₦600",
    minOrder: "₦3,000",
    address: "45 Admiralty Way, Lekki Phase 1",
    image: require("../../../assets/images/restaurants/alexandru-bogdan-ghita-UeYkqQh4PoI-unsplash.jpg"),
    products: [
      {
        id: "p2_1",
        name: "Full Rack Smoked Ribs",
        description: "Slow-smoked pork ribs glazed with signature BBQ sauce & fries",
        price: 12500,
        category: "Popular",
      },
      {
        id: "p2_2",
        name: "Pulled Pork Sandwich",
        description: "Tender shredded pork, BBQ sauce, crispy onions on brioche",
        price: 5500,
        category: "Mains",
      },
      {
        id: "p2_3",
        name: "Loaded BBQ Fries",
        description: "Crispy fries topped with melted cheese, bacon & BBQ drizzle",
        price: 3200,
        category: "Sides",
      },
      {
        id: "p2_4",
        name: "Creamy Coleslaw",
        description: "Fresh cabbage & carrot slaw in tangy dressing",
        price: 1500,
        category: "Sides",
      },
      {
        id: "p2_5",
        name: "Ice Cold Malt Can",
        description: "Rich non-alcoholic malt beverage",
        price: 1000,
        category: "Drinks",
      },
    ],
  },
  "3": {
    id: "3",
    name: "Crispy Crunch Chicken",
    cuisine: "Fast Food · Fried Chicken",
    category: "Chicken",
    rating: 4.8,
    deliveryTime: "15–25 min",
    deliveryFee: "₦450",
    minOrder: "₦2,000",
    address: "88 Isaac John Street, Ikeja GRA",
    image: require("../../../assets/images/restaurants/brian-chan-NbXjZomyNEM-unsplash.jpg"),
    products: [
      {
        id: "p3_1",
        name: "6pc Crispy Bucket & Fries",
        description: "6 pieces of golden crispy chicken served with large chips",
        price: 8500,
        category: "Popular",
      },
      {
        id: "p3_2",
        name: "Zinger Chicken Burger",
        description: "Spicy crispy chicken breast fillet with mayo & lettuce",
        price: 3800,
        category: "Mains",
      },
      {
        id: "p3_3",
        name: "Spicy Wings (6pcs)",
        description: "Deep fried chicken wings tossed in hot chili glaze",
        price: 4200,
        category: "Sides",
      },
      {
        id: "p3_4",
        name: "Cajun Seasoned Chips",
        description: "Crispy fries dusted with spicy Cajun seasoning",
        price: 1800,
        category: "Sides",
      },
      {
        id: "p3_5",
        name: "Chocolate Milkshake",
        description: "Thick creamy chocolate ice cream milkshake",
        price: 2500,
        category: "Desserts",
      },
    ],
  },
  "4": {
    id: "4",
    name: "Prime Steakhouse",
    cuisine: "Gourmet · Steaks & Salads",
    category: "Rice",
    rating: 4.6,
    deliveryTime: "25–40 min",
    deliveryFee: "₦700",
    minOrder: "₦5,000",
    address: "5 Ahmadu Bello Way, Victoria Island",
    image: require("../../../assets/images/restaurants/edward-howell-vvUy1hWVYEA-unsplash.jpg"),
    products: [
      {
        id: "p4_1",
        name: "Ribeye Steak 300g & Mash",
        description: "Prime Angus ribeye steak, garlic mashed potato & peppercorn jus",
        price: 18000,
        category: "Popular",
      },
      {
        id: "p4_2",
        name: "Grilled Lamb Chops",
        description: "Tender rosemary lamb chops served with mint jus & roasted veg",
        price: 16500,
        category: "Mains",
      },
      {
        id: "p4_3",
        name: "Truffle Parmesan Fries",
        description: "Hand-cut potato fries with truffle oil & aged parmesan",
        price: 4500,
        category: "Sides",
      },
      {
        id: "p4_4",
        name: "Caesar Salad with Chicken",
        description: "Romaine lettuce, grilled chicken breast, croutons & Caesar dressing",
        price: 4200,
        category: "Sides",
      },
      {
        id: "p4_5",
        name: "Sparkling Water (75cl)",
        description: "Chilled premium Italian sparkling mineral water",
        price: 1200,
        category: "Drinks",
      },
    ],
  },
  "5": {
    id: "5",
    name: "Wok & Noodle House",
    cuisine: "Asian · Stir-Fry & Noodles",
    category: "Asian",
    rating: 4.4,
    deliveryTime: "15–25 min",
    deliveryFee: "₦400",
    minOrder: "₦2,000",
    address: "21 Commercial Avenue, Yaba",
    image: require("../../../assets/images/restaurants/orijit-chatterjee-wEBg_pYtynw-unsplash.jpg"),
    products: [
      {
        id: "p5_1",
        name: "Special Chicken Chow Mein",
        description: "Stir-fried egg noodles with tender chicken, vegetables & soy sauce",
        price: 4800,
        category: "Popular",
      },
      {
        id: "p5_2",
        name: "Singapore Rice Noodles",
        description: "Thin vermicelli noodles with curry spice, shrimp & veggies",
        price: 5200,
        category: "Mains",
      },
      {
        id: "p5_3",
        name: "Crispy Spring Rolls (4pcs)",
        description: "Golden fried vegetable spring rolls with sweet chili dip",
        price: 2500,
        category: "Sides",
      },
      {
        id: "p5_4",
        name: "Sweet & Sour Chicken",
        description: "Crispy chicken bites in pineapple sweet & sour sauce",
        price: 5800,
        category: "Mains",
      },
      {
        id: "p5_5",
        name: "Jasmine Green Tea",
        description: "Hot aromatic brewed oriental green tea",
        price: 1500,
        category: "Drinks",
      },
    ],
  },
  "6": {
    id: "6",
    name: "Tokyo Bento & Grill",
    cuisine: "Asian · Japanese & Seafood",
    category: "Asian",
    rating: 4.7,
    deliveryTime: "30–45 min",
    deliveryFee: "₦800",
    minOrder: "₦4,000",
    address: "14 Akin Adesola Street, Victoria Island",
    image: require("../../../assets/images/restaurants/vinn-koonyosying-vBOxsZrfiCw-unsplash.jpg"),
    products: [
      {
        id: "p6_1",
        name: "Teriyaki Chicken Bento Box",
        description: "Grilled chicken teriyaki, steamed rice, gyoza & cabbage salad",
        price: 6500,
        category: "Popular",
      },
      {
        id: "p6_2",
        name: "Salmon Nigiri & Sushi Roll",
        description: "Fresh salmon nigiri (4pcs) & spicy tuna roll (6pcs)",
        price: 8200,
        category: "Mains",
      },
      {
        id: "p6_3",
        name: "Tempura Prawns (5pcs)",
        description: "Light & crispy battered king prawns with tentsuyu sauce",
        price: 4500,
        category: "Sides",
      },
      {
        id: "p6_4",
        name: "Miso Soup & Edamame",
        description: "Traditional soybean broth with tofu & salted edamame pods",
        price: 2200,
        category: "Sides",
      },
      {
        id: "p6_5",
        name: "Japanese Iced Green Tea",
        description: "Refreshing unsweetened cold Japanese matcha green tea",
        price: 1800,
        category: "Drinks",
      },
    ],
  },
  "7": {
    id: "7",
    name: "The Social Bistro",
    cuisine: "Continental · Drinks & Bites",
    category: "Fast Food",
    rating: 4.7,
    deliveryTime: "20–30 min",
    deliveryFee: "₦500",
    minOrder: "₦2,500",
    address: "33 Glover Road, Ikoyi",
    image: require("../../../assets/images/restaurants/alex-haney-CAhjZmVk5H4-unsplash.jpg"),
    products: [
      {
        id: "p7_1",
        name: "Avocado Toast & Poached Egg",
        description: "Sourdough bread topped with mashed avocado, chili flakes & poached egg",
        price: 4200,
        category: "Popular",
      },
      {
        id: "p7_2",
        name: "Truffle Mushroom Pasta",
        description: "Penne pasta with wild mushrooms in creamy truffle sauce",
        price: 6800,
        category: "Mains",
      },
      {
        id: "p7_3",
        name: "Club Sandwich & Chips",
        description: "Triple-decker chicken, bacon, lettuce & tomato sandwich",
        price: 5000,
        category: "Mains",
      },
      {
        id: "p7_4",
        name: "Berry Waffle Sundae",
        description: "Belgian waffle with fresh berries & vanilla ice cream",
        price: 3500,
        category: "Desserts",
      },
      {
        id: "p7_5",
        name: "Iced Caramel Latte",
        description: "Espresso with cold milk & caramel syrup over ice",
        price: 2800,
        category: "Drinks",
      },
    ],
  },
};

const MENU_CATEGORIES = ["All", "Popular", "Mains", "Sides", "Drinks", "Desserts"];

// ─── Single Restaurant Screen Component ────────────────────────────────────────

const SingleRestaurant = () => {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Fallback to first restaurant if invalid ID
  const restaurant = RESTAURANTS_DATA[id || "1"] || RESTAURANTS_DATA["1"];

  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isFavorite, setIsFavorite] = useState(false);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return restaurant.products.filter((p) => {
      const matchesCategory = activeTab === "All" || p.category === activeTab;
      const matchesSearch =
        searchQuery.trim() === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [restaurant.products, activeTab, searchQuery]);

  // Cart helper calculations
  const cartTotalItems = useMemo(() => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0);
  }, [cart]);

  const cartTotalPrice = useMemo(() => {
    return Object.entries(cart).reduce((sum, [productId, count]) => {
      const prod = restaurant.products.find((p) => p.id === productId);
      return sum + (prod ? prod.price * count : 0);
    }, 0);
  }, [cart, restaurant.products]);

  const addToCart = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const removeFromCart = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => {
      const copy = { ...prev };
      if (copy[productId] > 1) {
        copy[productId] -= 1;
      } else {
        delete copy[productId];
      }
      return copy;
    });
  };

  const scrollY = useRef(new Animated.Value(0)).current;

  // Animated sticky header interpolation
  const stickyHeaderOpacity = scrollY.interpolate({
    inputRange: [130, 190],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const stickyHeaderTranslateY = scrollY.interpolate({
    inputRange: [130, 190],
    outputRange: [-12, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {/* ── Fixed Animated Header ── */}
      <Animated.View
        style={[
          styles.sticky_header,
          {
            paddingTop: Platform.OS === "ios" ? insets.top : insets.top + 6,
            opacity: stickyHeaderOpacity,
            transform: [{ translateY: stickyHeaderTranslateY }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.sticky_back_btn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.back();
          }}
        >
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.sticky_title} numberOfLines={1}>
          {restaurant.name}
        </Text>

        <TouchableOpacity
          style={styles.sticky_fav_btn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsFavorite((prev) => !prev);
          }}
        >
          <Feather
            name="heart"
            size={18}
            color={isFavorite ? "#ff4d4d" : "#fff"}
          />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingBottom: cartTotalItems > 0 ? 110 : insets.bottom + 30,
        }}
      >
          {/* ── Banner Image Hero ── */}
          <View style={styles.hero_box}>
            <Image
              source={restaurant.image}
              style={styles.hero_image}
              contentFit="cover"
            />
            {/* Top Bar Floating Buttons */}
            <View style={[styles.hero_top_bar, { paddingTop: insets.top + 6 }]}>
              <TouchableOpacity
                style={styles.floating_btn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.back();
                }}
              >
                <Feather name="arrow-left" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.floating_btn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsFavorite((prev) => !prev);
                }}
              >
                <Feather
                  name="heart"
                  size={19}
                  color={isFavorite ? "#ff4d4d" : "#fff"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Restaurant Header Meta ── */}
          <View style={styles.info_section}>
            <View style={styles.title_row}>
              <Text style={styles.restaurant_name}>{restaurant.name}</Text>
              <View style={styles.rating_badge}>
                <Image
                  source={require("../../../assets/images/icons/star-icon.png")}
                  style={{ width: 12, height: 12, tintColor: "#fff" }}
                  contentFit="contain"
                />
                <Text style={styles.rating_text}>{restaurant.rating}</Text>
              </View>
            </View>

            <Text style={styles.restaurant_cuisine}>{restaurant.cuisine}</Text>

            <View style={styles.address_row}>
              <Feather name="map-pin" size={13} color="#9CA3AF" />
              <Text style={styles.address_text} numberOfLines={1}>
                {restaurant.address}
              </Text>
            </View>

            {/* Delivery Details Row */}
            <View style={styles.meta_bar}>
              <View style={styles.meta_column}>
                <Text style={styles.meta_label}>DELIVERY TIME</Text>
                <Text style={styles.meta_value}>{restaurant.deliveryTime}</Text>
              </View>
              <View style={styles.meta_divider} />
              <View style={styles.meta_column}>
                <Text style={styles.meta_label}>DELIVERY FEE</Text>
                <Text style={styles.meta_value}>{restaurant.deliveryFee}</Text>
              </View>
              <View style={styles.meta_divider} />
              <View style={styles.meta_column}>
                <Text style={styles.meta_label}>MIN ORDER</Text>
                <Text style={styles.meta_value}>{restaurant.minOrder}</Text>
              </View>
            </View>
          </View>

          {/* ── Menu Search Input ── */}
          <View style={styles.search_bar}>
            <Feather name="search" size={16} color="#777" />
            <TextInput
              style={styles.search_input}
              placeholder="Search in menu…"
              placeholderTextColor="#555"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  Keyboard.dismiss();
                }}
              >
                <Feather name="x" size={16} color="#777" />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Category Filter Pills ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            style={{ flexGrow: 0 }}
            contentContainerStyle={styles.category_scroll}
            keyboardShouldPersistTaps="handled"
          >
            {MENU_CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => {
                  Keyboard.dismiss();
                  setActiveTab(cat);
                }}
                style={[
                  styles.category_pill,
                  activeTab === cat && styles.category_pill_active,
                ]}
              >
                <Text
                  style={[
                    styles.category_pill_text,
                    activeTab === cat && styles.category_pill_text_active,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* ── Products List ── */}
          <View style={styles.products_section}>
            <Text style={styles.section_title}>
              {activeTab === "All" ? "Menu Items" : activeTab}
            </Text>

            {filteredProducts.length === 0 ? (
              <View style={styles.empty_products}>
                <Text style={styles.empty_title}>No items found</Text>
                <Text style={styles.empty_sub}>
                  Try another category or search term
                </Text>
              </View>
            ) : (
              filteredProducts.map((product) => {
                const count = cart[product.id] || 0;
                return (
                  <View key={product.id} style={styles.product_card}>
                    <View style={styles.product_info}>
                      <Text style={styles.product_name}>{product.name}</Text>
                      <Text style={styles.product_desc} numberOfLines={2}>
                        {product.description}
                      </Text>
                      <Text style={styles.product_price}>
                        ₦{product.price.toLocaleString()}
                      </Text>
                    </View>

                    {/* Action Button / Quantity Controls */}
                    <View style={styles.product_action}>
                      {count === 0 ? (
                        <TouchableOpacity
                          style={styles.add_btn}
                          onPress={() => addToCart(product.id)}
                        >
                          <Feather name="plus" size={15} color="#121212" />
                          <Text style={styles.add_btn_text}>ADD</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.qty_controls}>
                          <TouchableOpacity
                            style={styles.qty_btn}
                            onPress={() => removeFromCart(product.id)}
                          >
                            <Feather name="minus" size={14} color="#fff" />
                          </TouchableOpacity>
                          <Text style={styles.qty_text}>{count}</Text>
                          <TouchableOpacity
                            style={styles.qty_btn}
                            onPress={() => addToCart(product.id)}
                          >
                            <Feather name="plus" size={14} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </Animated.ScrollView>

        {/* ── Floating Cart Bar ── */}
        {cartTotalItems > 0 && (
          <View
            style={[
              styles.cart_bar_container,
              { bottom: Platform.OS === "ios" ? insets.bottom + 12 : 20 },
            ]}
          >
            <TouchableOpacity
              style={styles.cart_bar}
              activeOpacity={0.9}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Future cart checkout step
              }}
            >
              <View style={styles.cart_badge}>
                <Text style={styles.cart_badge_text}>{cartTotalItems}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cart_bar_title}>View Order</Text>
                <Text style={styles.cart_bar_sub}>
                  {restaurant.name}
                </Text>
              </View>
              <Text style={styles.cart_total_price}>
                ₦{cartTotalPrice.toLocaleString()}
              </Text>
              <Feather name="arrow-right" size={18} color="#121212" />
            </TouchableOpacity>
          </View>
        )}
      </View>
  );
};

export default SingleRestaurant;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  // Sticky Animated Header
  sticky_header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "#121212f2",
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  sticky_back_btn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    justifyContent: "center",
  },
  sticky_title: {
    flex: 1,
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  sticky_fav_btn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    justifyContent: "center",
  },
  // Hero
  hero_box: {
    width: "100%",
    height: 220,
    position: "relative",
  },
  hero_image: {
    width: "100%",
    height: "100%",
  },
  hero_top_bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  floating_btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#12121299",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff22",
  },
  // Info section
  info_section: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
  },
  title_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  restaurant_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 22,
    flex: 1,
    marginRight: 10,
  },
  rating_badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  rating_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  restaurant_cuisine: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 13,
    marginBottom: 8,
  },
  address_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  address_text: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 12,
    flex: 1,
  },
  // Meta bar
  meta_bar: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  meta_column: {
    alignItems: "center",
    flex: 1,
  },
  meta_label: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 9,
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  meta_value: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  meta_divider: {
    width: 1,
    height: 24,
    backgroundColor: "#2a2a2a",
  },
  // Search bar
  search_bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 14,
    marginHorizontal: 18,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    gap: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  search_input: {
    flex: 1,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  // Categories
  category_scroll: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 8,
    alignItems: "center",
  },
  category_pill: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
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
  // Products
  products_section: {
    paddingHorizontal: 18,
  },
  section_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
    marginBottom: 12,
  },
  product_card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 12,
  },
  product_info: {
    flex: 1,
  },
  product_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
    marginBottom: 4,
  },
  product_desc: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  product_price: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  product_action: {
    alignItems: "flex-end",
  },
  add_btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  add_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  qty_controls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    padding: 4,
    gap: 10,
  },
  qty_btn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#383838",
    alignItems: "center",
    justifyContent: "center",
  },
  qty_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
    minWidth: 14,
    textAlign: "center",
  },
  empty_products: {
    alignItems: "center",
    paddingVertical: 40,
  },
  empty_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
    marginBottom: 4,
  },
  empty_sub: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  // Floating Cart Bar
  cart_bar_container: {
    position: "absolute",
    left: 18,
    right: 18,
  },
  cart_bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  cart_badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },
  cart_badge_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  cart_bar_title: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  cart_bar_sub: {
    color: "#666",
    fontFamily: "raleway-regular",
    fontSize: 11,
  },
  cart_total_price: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
});

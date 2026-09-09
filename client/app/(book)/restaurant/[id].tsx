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
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  useRestaurantContext,
  RestaurantType,
} from "../../../context/RestaurantContext";
import {
  useMenuContext,
  MenuItem,
  MenuCategory,
} from "../../../context/MenuContext";
import {
  useBasketContext,
  BasketSelectedOption,
} from "../../../context/BasketContext";
import ItemOptionsModal from "../../../components/ItemOptionsModal";
import CheckoutModal from "../../../components/CheckoutModal";

const DEFAULT_HERO_IMAGE = require("../../../assets/images/restaurants/ivan-torres-MQUqbmszGGM-unsplash.jpg");

// ─── Single Restaurant Screen Component ────────────────────────────────────────

const SingleRestaurant = () => {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { fetchRestaurantById } = useRestaurantContext();
  const { fetchPublicCategories, fetchPublicMenuItems } = useMenuContext();
  const {
    basket,
    fetchBasket,
    addItemToBasket,
    updateItemQuantity,
  } = useBasketContext();

  const [restaurant, setRestaurant] = useState<RestaurantType | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  // Modals state
  const [selectedItemForOptions, setSelectedItemForOptions] =
    useState<MenuItem | null>(null);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [restData, catsData, itemsData] = await Promise.all([
          fetchRestaurantById(id),
          fetchPublicCategories(id),
          fetchPublicMenuItems(id),
          fetchBasket(id),
        ]);
        setRestaurant(restData);
        setCategories(catsData || []);
        setMenuItems(itemsData || []);
      } catch (err) {
        console.log("Error loading single restaurant details", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const categoryTabs = useMemo(() => {
    const catNamesFromItems = Array.from(
      new Set(
        menuItems
          .map((item) =>
            typeof item.category === "object"
              ? item.category?.name
              : item.category
          )
          .filter(Boolean)
      )
    ) as string[];

    const combined = Array.from(
      new Set([...categories.map((c) => c.name), ...catNamesFromItems])
    );

    return ["All", ...combined];
  }, [categories, menuItems]);

  const filteredProducts = useMemo(() => {
    return menuItems.filter((item) => {
      const itemCategoryName =
        typeof item.category === "object"
          ? item.category?.name
          : item.category || "";

      const matchesCategory =
        activeTab === "All" ||
        itemCategoryName.toLowerCase() === activeTab.toLowerCase();

      const matchesSearch =
        searchQuery.trim() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeTab, searchQuery]);

  const cartTotalItems = useMemo(() => {
    if (!basket || !basket.items) return 0;
    return basket.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [basket]);

  const cartTotalPrice = useMemo(() => {
    return basket?.subtotal || 0;
  }, [basket]);

  const getItemCountInBasket = (productId: string) => {
    if (!basket || !basket.items) return 0;
    return basket.items
      .filter((i) => {
        const mId =
          typeof i.menu_item === "object" ? i.menu_item._id : i.menu_item;
        return mId === productId;
      })
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const handleAddProduct = (product: MenuItem) => {
    if (product.options_groups && product.options_groups.length > 0) {
      setSelectedItemForOptions(product);
      setIsOptionsModalVisible(true);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      addItemToBasket(id, product._id, 1);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!basket || !basket.items) return;
    const basketItem = basket.items.find((i) => {
      const mId =
        typeof i.menu_item === "object" ? i.menu_item._id : i.menu_item;
      return mId === productId;
    });
    if (basketItem && basketItem._id) {
      updateItemQuantity(basketItem._id, basketItem.quantity - 1, id);
    }
  };

  const handleAddToCartFromOptionsModal = (
    item: MenuItem,
    quantity: number,
    selectedOptions: BasketSelectedOption[],
    specialInstructions: string
  ) => {
    addItemToBasket(
      id,
      item._id,
      quantity,
      selectedOptions,
      specialInstructions
    );
  };

  const scrollY = useRef(new Animated.Value(0)).current;

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

  if (loading) {
    return (
      <View style={[styles.container, styles.loading_center]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loading_text_full}>
          Loading store & menu items...
        </Text>
      </View>
    );
  }

  const restaurantName = restaurant?.name || "Restaurant Store";
  const restaurantRating = restaurant?.rating
    ? Number(restaurant.rating).toFixed(1)
    : "5.0";
  const restaurantCuisine =
    restaurant?.category_tags && restaurant.category_tags.length > 0
      ? restaurant.category_tags.join(" • ")
      : restaurant?.description || "Gourmet & Fast Food";
  const restaurantAddress =
    restaurant?.location?.address ||
    restaurant?.location?.landmark ||
    "Main Campus Area";
  const heroImage =
    restaurant?.banner || restaurant?.logo
      ? { uri: restaurant.banner || restaurant.logo }
      : DEFAULT_HERO_IMAGE;

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
          {restaurantName}
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
          <Image source={heroImage} style={styles.hero_image} contentFit="cover" />
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
            <Text style={styles.restaurant_name}>{restaurantName}</Text>
            <View style={styles.rating_badge}>
              <Image
                source={require("../../../assets/images/icons/star-icon.png")}
                style={{ width: 12, height: 12, tintColor: "#fff" }}
                contentFit="contain"
              />
              <Text style={styles.rating_text}>{restaurantRating}</Text>
            </View>
          </View>

          <Text style={styles.restaurant_cuisine}>{restaurantCuisine}</Text>

          <View style={styles.address_row}>
            <Feather name="map-pin" size={13} color="#9CA3AF" />
            <Text style={styles.address_text} numberOfLines={1}>
              {restaurantAddress}
            </Text>
          </View>

          {/* Delivery Details Row */}
          <View style={styles.meta_bar}>
            <View style={styles.meta_column}>
              <Text style={styles.meta_label}>DELIVERY TIME</Text>
              <Text style={styles.meta_value}>20–35 min</Text>
            </View>
            <View style={styles.meta_divider} />
            <View style={styles.meta_column}>
              <Text style={styles.meta_label}>DELIVERY FEE</Text>
              <Text style={styles.meta_value}>₦500</Text>
            </View>
            <View style={styles.meta_divider} />
            <View style={styles.meta_column}>
              <Text style={styles.meta_label}>MIN ORDER</Text>
              <Text style={styles.meta_value}>₦2,000</Text>
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
          {categoryTabs.map((cat) => (
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
                There are no menu items matching your search or selected category.
              </Text>
            </View>
          ) : (
            filteredProducts.map((product) => {
              const count = getItemCountInBasket(product._id);
              return (
                <View key={product._id} style={styles.product_card}>
                  {/* Menu Item Image */}
                  <View style={styles.product_image_container}>
                    <Image
                      source={
                        product.image
                          ? { uri: product.image }
                          : DEFAULT_HERO_IMAGE
                      }
                      style={styles.product_image}
                      contentFit="cover"
                    />
                  </View>

                  <View style={styles.product_info}>
                    <Text style={styles.product_name}>{product.name}</Text>
                    {product.description ? (
                      <Text style={styles.product_desc} numberOfLines={2}>
                        {product.description}
                      </Text>
                    ) : null}
                    <Text style={styles.product_price}>
                      ₦{product.price.toLocaleString()}
                    </Text>
                  </View>

                  {/* Action Button / Quantity Controls */}
                  <View style={styles.product_action}>
                    {count === 0 ? (
                      <TouchableOpacity
                        style={styles.add_btn}
                        onPress={() => handleAddProduct(product)}
                      >
                        <Feather name="plus" size={15} color="#121212" />
                        <Text style={styles.add_btn_text}>ADD</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.qty_controls}>
                        <TouchableOpacity
                          style={styles.qty_btn}
                          onPress={() => handleRemoveProduct(product._id)}
                        >
                          <Feather name="minus" size={14} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.qty_text}>{count}</Text>
                        <TouchableOpacity
                          style={styles.qty_btn}
                          onPress={() => handleAddProduct(product)}
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
              setIsCheckoutModalVisible(true);
            }}
          >
            <View style={styles.cart_badge}>
              <Text style={styles.cart_badge_text}>{cartTotalItems}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cart_bar_title}>View Order</Text>
              <Text style={styles.cart_bar_sub}>{restaurantName}</Text>
            </View>
            <Text style={styles.cart_total_price}>
              ₦{cartTotalPrice.toLocaleString()}
            </Text>
            <Feather name="arrow-right" size={18} color="#121212" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Item Options Customization Modal ── */}
      <ItemOptionsModal
        visible={isOptionsModalVisible}
        onClose={() => {
          setIsOptionsModalVisible(false);
          setSelectedItemForOptions(null);
        }}
        item={selectedItemForOptions}
        onAddToCart={handleAddToCartFromOptionsModal}
      />

      {/* ── Checkout & Order Review Modal ── */}
      <CheckoutModal
        visible={isCheckoutModalVisible}
        onClose={() => setIsCheckoutModalVisible(false)}
        restaurantId={id as string}
        restaurantName={restaurantName}
        onOrderPlacedSuccess={(orderId) => {
          router.replace(`/food/order/${orderId}`);
        }}
      />
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
  loading_center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loading_text_full: {
    color: "#888",
    fontFamily: "raleway-regular",
    fontSize: 14,
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
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 12,
  },
  product_image_container: {
    width: 76,
    height: 76,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
  },
  product_image: {
    width: "100%",
    height: "100%",
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

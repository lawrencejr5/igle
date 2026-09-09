import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useBasketContext } from "../context/BasketContext";
import { useFoodOrderContext } from "../context/FoodOrderContext";
import { useWalletContext } from "../context/WalletContext";
import { useAuthContext } from "../context/AuthContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  onOrderPlacedSuccess: (orderId: string) => void;
}

const FLAT_DELIVERY_FEE = 1500;

const CheckoutModal: React.FC<Props> = ({
  visible,
  onClose,
  restaurantId,
  restaurantName,
  onOrderPlacedSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { basket, updateItemQuantity, removeItemFromBasket, clearBasket } =
    useBasketContext();
  const { placeFoodOrder, loading: orderLoading } = useFoodOrderContext();
  const { userWalletBal, getWalletBalance } = useWalletContext();
  const { signedIn } = useAuthContext();

  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    if (visible) {
      getWalletBalance("User");
      if (signedIn) {
        setContactName(signedIn.name || "");
        setContactPhone(signedIn.phone || "");
      }
    }
  }, [visible, signedIn]);

  const items = basket?.items || [];
  const subtotal = basket?.subtotal || 0;
  const deliveryFee = subtotal > 0 ? FLAT_DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const hasInsufficientWallet = userWalletBal < total;

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert("Required", "Please enter a valid delivery address.");
      return;
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert("Required", "Contact name and phone number are required.");
      return;
    }
    if (hasInsufficientWallet) {
      Alert.alert(
        "Insufficient Wallet Balance",
        `Order total is ₦${total.toLocaleString()}, but your balance is ₦${userWalletBal.toLocaleString()}. Please fund your wallet first.`
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const payload = {
      restaurant_id: restaurantId,
      delivery_address: {
        address: address.trim(),
        landmark: landmark.trim(),
        coordinates: [3.3792, 6.5244] as [number, number], // Default coordinates fallback
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim(),
      },
      payment_method: "wallet" as const,
    };

    const newOrder = await placeFoodOrder(payload);
    if (newOrder) {
      await clearBasket(restaurantId);
      onClose();
      onOrderPlacedSuccess(newOrder._id);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)" }}
      >
        <View style={styles.modal_overlay}>
          <View
            style={[
              styles.modal_container,
              { paddingBottom: Platform.OS === "ios" ? insets.bottom + 16 : 24 },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.header_title}>Review Order</Text>
                <Text style={styles.header_sub}>{restaurantName}</Text>
              </View>
              <TouchableOpacity style={styles.close_btn} onPress={onClose}>
                <Feather name="x" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.scroll_content}
            >
              {/* Basket Items List */}
              <View style={styles.card}>
                <View style={styles.card_header}>
                  <Text style={styles.card_title}>Order Summary</Text>
                  <Text style={styles.item_count}>{items.length} item(s)</Text>
                </View>

                {items.length === 0 ? (
                  <Text style={styles.empty_text}>Your basket is empty</Text>
                ) : (
                  items.map((item, idx) => {
                    const menuItemObj =
                      typeof item.menu_item === "object" ? item.menu_item : null;
                    const name = menuItemObj?.name || "Menu Item";
                    const image = menuItemObj?.image;

                    return (
                      <View key={item._id || idx} style={styles.item_row}>
                        {image ? (
                          <Image
                            source={{ uri: image }}
                            style={styles.item_thumb}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.item_thumb_placeholder}>
                            <Feather name="coffee" size={16} color="#777" />
                          </View>
                        )}

                        <View style={{ flex: 1 }}>
                          <Text style={styles.item_name}>{name}</Text>
                          {item.selected_options && item.selected_options.length > 0 && (
                            <Text style={styles.item_options}>
                              {item.selected_options
                                .map((o) => o.option_name)
                                .join(", ")}
                            </Text>
                          )}
                          <Text style={styles.item_price}>
                            ₦{item.item_total.toLocaleString()}
                          </Text>
                        </View>

                        {/* Quantity Controls */}
                        <View style={styles.qty_controls}>
                          <TouchableOpacity
                            style={styles.qty_btn}
                            onPress={() => {
                              if (item._id) {
                                Haptics.impactAsync(
                                  Haptics.ImpactFeedbackStyle.Light
                                );
                                updateItemQuantity(
                                  item._id,
                                  item.quantity - 1,
                                  restaurantId
                                );
                              }
                            }}
                          >
                            <Feather
                              name={item.quantity === 1 ? "trash-2" : "minus"}
                              size={13}
                              color={item.quantity === 1 ? "#f44336" : "#fff"}
                            />
                          </TouchableOpacity>
                          <Text style={styles.qty_text}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.qty_btn}
                            onPress={() => {
                              if (item._id) {
                                Haptics.impactAsync(
                                  Haptics.ImpactFeedbackStyle.Light
                                );
                                updateItemQuantity(
                                  item._id,
                                  item.quantity + 1,
                                  restaurantId
                                );
                              }
                            }}
                          >
                            <Feather name="plus" size={13} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* Delivery Address Section */}
              <View style={styles.card}>
                <Text style={styles.card_title}>Delivery Location</Text>

                <View style={styles.input_box}>
                  <Feather name="map-pin" size={16} color="#777" />
                  <TextInput
                    style={styles.input}
                    placeholder="Street Address, City (e.g., 12 Marina Blvd)"
                    placeholderTextColor="#555"
                    value={address}
                    onChangeText={setAddress}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.input_box}>
                  <Feather name="flag" size={16} color="#777" />
                  <TextInput
                    style={styles.input}
                    placeholder="Landmark / Flat / Apartment No."
                    placeholderTextColor="#555"
                    value={landmark}
                    onChangeText={setLandmark}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.row_inputs}>
                  <View style={[styles.input_box, { flex: 1 }]}>
                    <Feather name="user" size={16} color="#777" />
                    <TextInput
                      style={styles.input}
                      placeholder="Contact Name"
                      placeholderTextColor="#555"
                      value={contactName}
                      onChangeText={setContactName}
                      returnKeyType="next"
                    />
                  </View>

                  <View style={[styles.input_box, { flex: 1 }]}>
                    <Feather name="phone" size={16} color="#777" />
                    <TextInput
                      style={styles.input}
                      placeholder="Phone Number"
                      placeholderTextColor="#555"
                      keyboardType="phone-pad"
                      value={contactPhone}
                      onChangeText={setContactPhone}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>
                </View>
              </View>

            {/* Payment & Wallet Summary */}
            <View style={styles.card}>
              <Text style={styles.card_title}>Payment Breakdown</Text>

              <View style={styles.breakdown_row}>
                <Text style={styles.breakdown_label}>Subtotal</Text>
                <Text style={styles.breakdown_val}>₦{subtotal.toLocaleString()}</Text>
              </View>

              <View style={styles.breakdown_row}>
                <Text style={styles.breakdown_label}>Delivery Fee (Flat)</Text>
                <Text style={styles.breakdown_val}>
                  ₦{deliveryFee.toLocaleString()}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.breakdown_row}>
                <Text style={styles.total_label}>Total Amount</Text>
                <Text style={styles.total_val}>₦{total.toLocaleString()}</Text>
              </View>

              {/* Wallet Info Tag */}
              <View
                style={[
                  styles.wallet_tag,
                  hasInsufficientWallet && styles.wallet_tag_error,
                ]}
              >
                <Feather
                  name="credit-card"
                  size={15}
                  color={hasInsufficientWallet ? "#f44336" : "#4caf50"}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.wallet_title}>In-App Wallet Payment</Text>
                  <Text style={styles.wallet_sub}>
                    Available Balance: ₦{userWalletBal.toLocaleString()}
                  </Text>
                </View>
                {hasInsufficientWallet && (
                  <Text style={styles.insufficient_badge}>Low Balance</Text>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Place Order CTA */}
          <View style={styles.bottom_bar}>
            <TouchableOpacity
              style={[
                styles.place_order_btn,
                (orderLoading || items.length === 0 || hasInsufficientWallet) &&
                  styles.btn_disabled,
              ]}
              disabled={orderLoading || items.length === 0 || hasInsufficientWallet}
              onPress={handlePlaceOrder}
            >
              {orderLoading ? (
                <ActivityIndicator color="#121212" />
              ) : (
                <Text style={styles.place_order_btn_text}>
                  {hasInsufficientWallet
                    ? "Insufficient Wallet Balance"
                    : `Place Order • ₦${total.toLocaleString()}`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);
};

export default CheckoutModal;

const styles = StyleSheet.create({
  modal_overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modal_container: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  header_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  header_sub: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginTop: 2,
  },
  close_btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll_content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  card: {
    backgroundColor: "#222",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  card_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  card_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
    marginBottom: 10,
  },
  item_count: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  empty_text: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 10,
  },
  item_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  item_thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
  },
  item_thumb_placeholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  item_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  item_options: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 2,
  },
  item_price: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 12,
    marginTop: 2,
  },
  qty_controls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 6,
  },
  qty_btn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  qty_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
    minWidth: 16,
    textAlign: "center",
  },
  // Inputs
  input_box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  row_inputs: {
    flexDirection: "row",
    gap: 8,
  },
  // Breakdown
  breakdown_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  breakdown_label: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  breakdown_val: {
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginVertical: 8,
  },
  total_label: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  total_val: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  wallet_tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#4caf5015",
    borderWidth: 1,
    borderColor: "#4caf503a",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  wallet_tag_error: {
    backgroundColor: "#f4433615",
    borderColor: "#f443363a",
  },
  wallet_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  wallet_sub: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 1,
  },
  insufficient_badge: {
    color: "#f44336",
    fontFamily: "raleway-bold",
    fontSize: 11,
  },
  // Bottom Bar
  bottom_bar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  place_order_btn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btn_disabled: {
    opacity: 0.5,
  },
  place_order_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
});

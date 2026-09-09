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
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { MenuItem, MenuItemOptionGroup } from "../context/MenuContext";
import { BasketSelectedOption } from "../context/BasketContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    selectedOptions: BasketSelectedOption[],
    specialInstructions: string
  ) => void;
}

const DEFAULT_FOOD_IMAGE = require("../assets/images/restaurants/ivan-torres-MQUqbmszGGM-unsplash.jpg");

const ItemOptionsModal: React.FC<Props> = ({
  visible,
  onClose,
  item,
  onAddToCart,
}) => {
  const insets = useSafeAreaInsets();
  const [quantity, setQuantity] = useState<number>(1);
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, { group_name: string; option_name: string; price_modifier: number }[]>
  >({});

  useEffect(() => {
    if (visible && item) {
      setQuantity(1);
      setSpecialInstructions("");
      setSelectedOptions({});
    }
  }, [visible, item]);

  if (!item) return null;

  const optionGroups: MenuItemOptionGroup[] = item.options_groups || [];

  const toggleOption = (
    group: MenuItemOptionGroup,
    optionName: string,
    priceModifier: number
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOptions((prev) => {
      const currentList = prev[group.name] || [];
      const existsIndex = currentList.findIndex(
        (o) => o.option_name === optionName
      );

      const isSingleSelect = group.max_selection === 1;

      if (isSingleSelect) {
        if (existsIndex > -1) {
          if (group.required) return prev;
          const updated = { ...prev };
          delete updated[group.name];
          return updated;
        } else {
          return {
            ...prev,
            [group.name]: [
              {
                group_name: group.name,
                option_name: optionName,
                price_modifier: priceModifier,
              },
            ],
          };
        }
      } else {
        if (existsIndex > -1) {
          const filtered = currentList.filter(
            (o) => o.option_name !== optionName
          );
          if (filtered.length === 0) {
            const updated = { ...prev };
            delete updated[group.name];
            return updated;
          }
          return { ...prev, [group.name]: filtered };
        } else {
          if (group.max_selection && currentList.length >= group.max_selection) {
            return prev;
          }
          return {
            ...prev,
            [group.name]: [
              ...currentList,
              {
                group_name: group.name,
                option_name: optionName,
                price_modifier: priceModifier,
              },
            ],
          };
        }
      }
    });
  };

  const flattenedSelectedOptions: BasketSelectedOption[] = useMemo(() => {
    const res: BasketSelectedOption[] = [];
    Object.values(selectedOptions).forEach((opts) => {
      opts.forEach((o) => res.push(o));
    });
    return res;
  }, [selectedOptions]);

  const optionsExtraTotal = useMemo(() => {
    return flattenedSelectedOptions.reduce(
      (sum, opt) => sum + (opt.price_modifier || 0),
      0
    );
  }, [flattenedSelectedOptions]);

  const itemUnitPrice = item.price + optionsExtraTotal;
  const totalPrice = itemUnitPrice * quantity;

  const isValidSelections = useMemo(() => {
    for (const group of optionGroups) {
      const selections = selectedOptions[group.name] || [];
      if (group.required && selections.length < (group.min_selection || 1)) {
        return false;
      }
    }
    return true;
  }, [optionGroups, selectedOptions]);

  const handleAdd = () => {
    if (!isValidSelections) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAddToCart(
      item,
      quantity,
      flattenedSelectedOptions,
      specialInstructions.trim()
    );
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modal_overlay}>
        <View
          style={[
            styles.modal_container,
            { paddingBottom: Platform.OS === "ios" ? insets.bottom + 16 : 24 },
          ]}
        >
          {/* Top Bar / Header */}
          <View style={styles.header}>
            <Text style={styles.header_title} numberOfLines={1}>
              {item.name}
            </Text>
            <TouchableOpacity style={styles.close_btn} onPress={onClose}>
              <Feather name="x" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll_content}
          >
            {/* Image & Description */}
            <View style={styles.item_hero}>
              <Image
                source={item.image ? { uri: item.image } : DEFAULT_FOOD_IMAGE}
                style={styles.item_image}
                contentFit="cover"
              />
              <View style={styles.item_meta}>
                <Text style={styles.item_name}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.item_desc}>{item.description}</Text>
                ) : null}
                <Text style={styles.item_base_price}>
                  Base Price: ₦{item.price.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Option Groups */}
            {optionGroups.map((group, idx) => {
              const selectedInGroup = selectedOptions[group.name] || [];
              const maxSel = group.max_selection || 1;

              return (
                <View key={idx} style={styles.option_group_box}>
                  <View style={styles.group_header}>
                    <Text style={styles.group_name}>{group.name}</Text>
                    <View style={styles.group_badge}>
                      <Text style={styles.group_badge_text}>
                        {group.required ? "Required" : "Optional"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.group_sub}>
                    {maxSel === 1
                      ? "Select 1 option"
                      : `Select up to ${maxSel} options`}
                  </Text>

                  {group.options.map((opt, optIdx) => {
                    const isSelected = selectedInGroup.some(
                      (o) => o.option_name === opt.name
                    );

                    return (
                      <TouchableOpacity
                        key={optIdx}
                        style={[
                          styles.option_row,
                          isSelected && styles.option_row_selected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() =>
                          toggleOption(group, opt.name, opt.price_modifier || 0)
                        }
                      >
                        <View style={styles.option_left}>
                          <View
                            style={[
                              styles.checkbox,
                              maxSel === 1 && styles.radio,
                              isSelected && styles.checkbox_active,
                            ]}
                          >
                            {isSelected && (
                              <Feather
                                name="check"
                                size={12}
                                color="#121212"
                              />
                            )}
                          </View>
                          <Text style={styles.option_name}>{opt.name}</Text>
                        </View>

                        {opt.price_modifier ? (
                          <Text style={styles.option_price}>
                            +₦{opt.price_modifier.toLocaleString()}
                          </Text>
                        ) : (
                          <Text style={styles.option_free}>Free</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}

            {/* Special Instructions */}
            <View style={styles.instructions_box}>
              <Text style={styles.instructions_label}>Special Instructions</Text>
              <TextInput
                style={styles.instructions_input}
                placeholder="Any allergies or preparation requests?"
                placeholderTextColor="#555"
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline={true}
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Bottom Bar: Quantity & Add Button */}
          <View style={styles.bottom_bar}>
            <View style={styles.qty_container}>
              <TouchableOpacity
                style={styles.qty_btn}
                onPress={() => {
                  if (quantity > 1) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setQuantity((prev) => prev - 1);
                  }
                }}
              >
                <Feather name="minus" size={16} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.qty_text}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qty_btn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setQuantity((prev) => prev + 1);
                }}
              >
                <Feather name="plus" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.add_to_cart_btn,
                !isValidSelections && styles.btn_disabled,
              ]}
              disabled={!isValidSelections}
              onPress={handleAdd}
            >
              <Text style={styles.add_btn_text}>
                Add to Basket • ₦{totalPrice.toLocaleString()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ItemOptionsModal;

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
    maxHeight: "90%",
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
    flex: 1,
    marginRight: 10,
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
    gap: 16,
  },
  item_hero: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#222",
    borderRadius: 16,
    padding: 12,
  },
  item_image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
  },
  item_meta: {
    flex: 1,
    justifyContent: "center",
  },
  item_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
    marginBottom: 4,
  },
  item_desc: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginBottom: 6,
  },
  item_base_price: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 14,
  },
  // Option Group Box
  option_group_box: {
    backgroundColor: "#222",
    borderRadius: 16,
    padding: 14,
  },
  group_header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  group_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  group_badge: {
    backgroundColor: "#333",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  group_badge_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 10,
  },
  group_sub: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginBottom: 10,
  },
  option_row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: "#1a1a1a",
  },
  option_row_selected: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#fff",
  },
  option_left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#555",
    alignItems: "center",
    justifyContent: "center",
  },
  radio: {
    borderRadius: 10,
  },
  checkbox_active: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  option_name: {
    color: "#fff",
    fontFamily: "raleway-medium",
    fontSize: 14,
    flex: 1,
  },
  option_price: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  option_free: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  // Special Instructions
  instructions_box: {
    backgroundColor: "#222",
    borderRadius: 16,
    padding: 14,
  },
  instructions_label: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
    marginBottom: 8,
  },
  instructions_input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: "top",
  },
  // Bottom Bar
  bottom_bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    gap: 12,
  },
  qty_container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8,
  },
  qty_btn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  qty_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
    minWidth: 20,
    textAlign: "center",
  },
  add_to_cart_btn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btn_disabled: {
    opacity: 0.5,
  },
  add_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
});

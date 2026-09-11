import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Modal,
  Switch,
  Platform,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import React, { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRestaurantContext } from "../../../context/RestaurantContext";
import { useMenuContext } from "../../../context/MenuContext";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

export interface MenuItemData {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  is_available: boolean;
  preparation_time_mins: number;
  display_order: number;
}

// ─── Menu Catalog Screen ──────────────────────────────────────────────────────

const RestaurantMenu = () => {
  const insets = useSafeAreaInsets();
  const { restaurant } = useRestaurantContext();
  const {
    categories: ctxCategories,
    menuItems: ctxMenuItems,
    fetchVendorCategories,
    fetchVendorMenuItems,
    createCategory,
    updateCategory,
    deleteCategory,
    createMenuItem,
    updateMenuItem,
    toggleItemAvailability,
    deleteMenuItem,
  } = useMenuContext();

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);

  React.useEffect(() => {
    fetchVendorCategories();
    fetchVendorMenuItems();
  }, []);

  React.useEffect(() => {
    if (ctxCategories) {
      setCategories(
        ctxCategories.map((c) => ({
          id: c._id,
          name: c.name,
          description: c.description || "",
          display_order: c.display_order || 0,
          is_active: c.is_active ?? true,
        })),
      );
    }
  }, [ctxCategories]);

  React.useEffect(() => {
    if (ctxMenuItems) {
      setMenuItems(
        ctxMenuItems.map((it) => ({
          id: it._id,
          category_id:
            typeof it.category === "object" ? it.category._id : it.category,
          name: it.name,
          description: it.description || "",
          price: it.price,
          image: it.image || "",
          is_available: it.is_available ?? true,
          preparation_time_mins: it.preparation_time_mins || 15,
          display_order: it.display_order || 0,
        })),
      );
    }
  }, [ctxMenuItems]);

  // Filters & State
  const [selectedCatId, setSelectedCatId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    "order" | "price_low" | "price_high" | "name" | "available"
  >("order");
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);

  // Category Modal
  const [catModalVisible, setCatModalVisible] = useState<boolean>(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catNameInput, setCatNameInput] = useState("");
  const [catDescInput, setCatDescInput] = useState("");

  // Item Form Modal
  const [itemModalVisible, setItemModalVisible] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MenuItemData | null>(null);

  // Form Fields
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemPrepTime, setItemPrepTime] = useState("15");
  const [itemImage, setItemImage] = useState("");
  const [itemAvailable, setItemAvailable] = useState(true);

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "cat" | "item";
    id: string;
    name: string;
  } | null>(null);

  // Form Loading States
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [deletingTarget, setDeletingTarget] = useState(false);

  // ── Helpers & Handlers ──────────────────────────────────────────────────────

  const pickItemImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setItemImage(result.assets[0].uri);
    }
  };

  // Toggle item availability
  const handleToggleAvailability = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await toggleItemAvailability(id);
    if (success) {
      await fetchVendorMenuItems();
    }
  };

  // Move Category Up / Down
  const handleMoveCategory = (index: number, direction: "up" | "down") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = [...categories];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((cat, idx) => ({
      ...cat,
      display_order: idx + 1,
    }));
    setCategories(reordered);
  };

  // Move Item Up / Down
  const handleMoveItem = (itemId: string, direction: "up" | "down") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentList = getFilteredItems();
    const index = currentList.findIndex((it) => it.id === itemId);
    if (index < 0) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const targetItem = currentList[targetIndex];

    setMenuItems((prev) => {
      return prev.map((item) => {
        if (item.id === itemId) {
          return { ...item, display_order: targetItem.display_order };
        }
        if (item.id === targetItem.id) {
          return { ...item, display_order: currentList[index].display_order };
        }
        return item;
      });
    });
  };

  // Save Category
  const handleSaveCategory = async () => {
    if (!catNameInput.trim()) {
      Alert.alert("Required", "Please enter a category name");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSavingCategory(true);

    try {
      if (editingCat) {
        const updated = await updateCategory(editingCat.id, {
          name: catNameInput.trim(),
          description: catDescInput.trim(),
        });
        if (updated) {
          await fetchVendorCategories();
        }
      } else {
        const created = await createCategory({
          name: catNameInput.trim(),
          description: catDescInput.trim(),
          display_order: categories.length + 1,
        });
        if (created) {
          await fetchVendorCategories();
          setSelectedCatId(created._id);
        }
      }

      setCatModalVisible(false);
      setEditingCat(null);
      setCatNameInput("");
      setCatDescInput("");
    } finally {
      setSavingCategory(false);
    }
  };

  // Open Category Modal
  const handleOpenCatModal = (cat?: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItemModalVisible(false);
    if (cat) {
      setEditingCat(cat);
      setCatNameInput(cat.name);
      setCatDescInput(cat.description);
    } else {
      setEditingCat(null);
      setCatNameInput("");
      setCatDescInput("");
    }
    setCatModalVisible(true);
  };

  // Open Item Modal
  const handleOpenItemModal = (item?: MenuItemData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemCategory(item.category_id);
      setItemDescription(item.description);
      setItemPrice(item.price.toString());
      setItemPrepTime(item.preparation_time_mins.toString());
      setItemImage(item.image);
      setItemAvailable(item.is_available);
    } else {
      setEditingItem(null);
      setItemName("");
      setItemCategory(
        selectedCatId !== "all" ? selectedCatId : categories[0]?.id || "",
      );
      setItemDescription("");
      setItemPrice("");
      setItemPrepTime("15");
      setItemImage("");
      setItemAvailable(true);
    }
    setItemModalVisible(true);
  };

  // Save Item
  const handleSaveItem = async () => {
    if (!itemName.trim()) {
      Alert.alert("Required", "Please enter a menu item name");
      return;
    }
    if (!itemCategory) {
      Alert.alert("Required", "Please select a category for this item");
      return;
    }
    if (!itemPrice || isNaN(Number(itemPrice))) {
      Alert.alert("Required", "Please enter a valid price");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSavingItem(true);

    try {
      const formData = new FormData();
      formData.append("category_id", itemCategory);
      formData.append("name", itemName.trim());
      formData.append("description", itemDescription.trim());
      formData.append("price", itemPrice.trim());
      formData.append("preparation_time_mins", itemPrepTime.trim() || "15");
      formData.append("is_available", String(itemAvailable));

      if (itemImage && !itemImage.startsWith("http")) {
        const filename = itemImage.split("/").pop() || "item.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append("image", { uri: itemImage, name: filename, type } as any);
      }

      if (editingItem) {
        const updated = await updateMenuItem(editingItem.id, formData);
        if (updated) {
          await fetchVendorMenuItems();
        }
      } else {
        const created = await createMenuItem(formData);
        if (created) {
          await fetchVendorMenuItems();
        }
      }

      setItemModalVisible(false);
    } finally {
      setSavingItem(false);
    }
  };

  // Delete Action
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeletingTarget(true);

    try {
      if (deleteTarget.type === "cat") {
        const success = await deleteCategory(deleteTarget.id);
        if (success) {
          await fetchVendorCategories();
          await fetchVendorMenuItems();
          if (selectedCatId === deleteTarget.id) setSelectedCatId("all");
        }
      } else {
        const success = await deleteMenuItem(deleteTarget.id);
        if (success) {
          await fetchVendorMenuItems();
        }
      }
      setDeleteTarget(null);
    } finally {
      setDeletingTarget(false);
    }
  };

  // ── Filter & Sort Items ─────────────────────────────────────────────────────

  const getFilteredItems = (): MenuItemData[] => {
    let result = [...menuItems];

    if (selectedCatId !== "all") {
      result = result.filter((item) => item.category_id === selectedCatId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q),
      );
    }

    if (sortBy === "price_low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "available") {
      result.sort((a, b) =>
        b.is_available === a.is_available ? 0 : b.is_available ? 1 : -1,
      );
    } else {
      result.sort((a, b) => a.display_order - b.display_order);
    }

    return result;
  };

  const filteredItems = getFilteredItems();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "ios" ? insets.top + 10 : insets.top + 14,
        },
      ]}
    >
      {/* ── Top Bar (Only Back Button) ── */}
      <View style={styles.top_nav}>
        <TouchableOpacity
          style={styles.nav_icon_btn}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header_center}>
          <Text style={styles.header_title}>Menu Catalog</Text>
          <Text style={styles.header_sub}>
            {restaurant?.name || "Vendor Store"} • {menuItems.length} items
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* ── Search & Actions Toolbar ── */}
      <View style={styles.toolbar_container}>
        <View style={styles.search_box}>
          <Feather name="search" size={16} color="#777" />
          <TextInput
            style={styles.search_input}
            placeholder="Search menu items..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            blurOnSubmit={true}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={16} color="#777" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.reorder_toggle_btn,
            isReorderMode && styles.reorder_toggle_active,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsReorderMode(!isReorderMode);
          }}
        >
          <MaterialIcons
            name="swap-vert"
            size={18}
            color={isReorderMode ? "#121212" : "#fff"}
          />
          <Text
            style={[
              styles.reorder_btn_text,
              isReorderMode && { color: "#121212" },
            ]}
          >
            {isReorderMode ? "Done Sorting" : "Sort Order"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Action Buttons Row (+ Category & + Item) ── */}
      <View style={styles.actions_bar}>
        <TouchableOpacity
          style={styles.add_category_btn}
          onPress={() => handleOpenCatModal()}
        >
          <Feather name="folder-plus" size={16} color="#fff" />
          <Text style={styles.add_category_btn_text}>Add Category</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.add_item_btn}
          onPress={() => handleOpenItemModal()}
        >
          <Feather name="plus" size={18} color="#121212" />
          <Text style={styles.add_item_btn_text}>Add New Menu Item</Text>
        </TouchableOpacity>
      </View>

      {/* ── Category Filters Scroll ── */}
      <View style={styles.category_section}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.category_scroll_content}
        >
          <TouchableOpacity
            style={[
              styles.cat_tab,
              selectedCatId === "all" && styles.cat_tab_active,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCatId("all");
            }}
          >
            <Text
              style={[
                styles.cat_tab_text,
                selectedCatId === "all" && styles.cat_tab_text_active,
              ]}
            >
              All Items ({menuItems.length})
            </Text>
          </TouchableOpacity>

          {categories.map((cat, idx) => {
            const count = menuItems.filter(
              (item) => item.category_id === cat.id,
            ).length;

            return (
              <View key={cat.id} style={styles.cat_tab_wrapper}>
                <TouchableOpacity
                  style={[
                    styles.cat_tab,
                    selectedCatId === cat.id && styles.cat_tab_active,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCatId(cat.id);
                  }}
                >
                  <Text
                    style={[
                      styles.cat_tab_text,
                      selectedCatId === cat.id && styles.cat_tab_text_active,
                    ]}
                  >
                    {cat.name} ({count})
                  </Text>
                </TouchableOpacity>

                {isReorderMode && (
                  <View style={styles.cat_reorder_controls}>
                    <TouchableOpacity
                      disabled={idx === 0}
                      onPress={() => handleMoveCategory(idx, "up")}
                      style={[
                        styles.cat_arrow_btn,
                        idx === 0 && { opacity: 0.3 },
                      ]}
                    >
                      <Feather name="chevron-left" size={14} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={idx === categories.length - 1}
                      onPress={() => handleMoveCategory(idx, "down")}
                      style={[
                        styles.cat_arrow_btn,
                        idx === categories.length - 1 && { opacity: 0.3 },
                      ]}
                    >
                      <Feather name="chevron-right" size={14} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleOpenCatModal(cat)}
                      style={styles.cat_edit_btn}
                    >
                      <Feather name="edit-2" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Menu Items List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.scroll_content,
          { paddingBottom: Platform.OS === "ios" ? insets.bottom + 40 : 50 },
        ]}
      >
        {selectedCatId !== "all" && (
          <View style={styles.cat_header_banner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cat_header_title}>
                {categories.find((c) => c.id === selectedCatId)?.name}
              </Text>
              <Text style={styles.cat_header_desc}>
                {categories.find((c) => c.id === selectedCatId)?.description ||
                  "Manage items under this category"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.cat_header_edit_btn}
              onPress={() =>
                handleOpenCatModal(
                  categories.find((c) => c.id === selectedCatId),
                )
              }
            >
              <Feather name="edit-2" size={14} color="#fff" />
              <Text style={styles.cat_header_edit_text}>Edit Category</Text>
            </TouchableOpacity>
          </View>
        )}

        {filteredItems.length === 0 ? (
          <View style={styles.empty_state}>
            <Feather name="database" size={40} color="#444" />
            <Text style={styles.empty_title}>No Menu Items Found</Text>
            <Text style={styles.empty_sub}>
              {searchQuery
                ? `No items match "${searchQuery}"`
                : "Tap '+ Add New Menu Item' to add items to your menu"}
            </Text>
            <TouchableOpacity
              style={styles.empty_add_btn}
              onPress={() => handleOpenItemModal()}
            >
              <Text style={styles.empty_add_btn_text}>+ Add Menu Item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredItems.map((item, index) => {
            const catObj = categories.find((c) => c.id === item.category_id);

            return (
              <View key={item.id} style={styles.item_card}>
                <View style={styles.item_card_top}>
                  {/* Item Image */}
                  <View style={styles.item_img_box}>
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.item_img}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={styles.item_img_placeholder}>
                        <FontAwesome5 name="utensils" size={20} color="#555" />
                      </View>
                    )}

                    <View style={styles.prep_time_badge}>
                      <Text style={styles.prep_time_text}>
                        ⏱ {item.preparation_time_mins}m
                      </Text>
                    </View>
                  </View>

                  {/* Item Info */}
                  <View style={styles.item_details}>
                    <View style={styles.item_title_row}>
                      <Text style={styles.item_name_text} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>

                    {catObj && (
                      <Text style={styles.item_cat_tag}>{catObj.name}</Text>
                    )}

                    <Text style={styles.item_desc_text} numberOfLines={2}>
                      {item.description || "No description provided"}
                    </Text>

                    <View style={styles.price_options_row}>
                      <Text style={styles.item_price_text}>
                        ₦{item.price.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Footer Controls */}
                <View style={styles.item_card_footer}>
                  <View style={styles.availability_box}>
                    <Text
                      style={[
                        styles.availability_label,
                        { color: item.is_available ? "#4caf50" : "#ef5350" },
                      ]}
                    >
                      {item.is_available ? "In Stock" : "Out of Stock"}
                    </Text>
                    <Switch
                      value={item.is_available}
                      onValueChange={() => handleToggleAvailability(item.id)}
                      trackColor={{ false: "#333", true: "#4caf5055" }}
                      thumbColor={item.is_available ? "#4caf50" : "#9CA3AF"}
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                  </View>

                  {isReorderMode && (
                    <View style={styles.reorder_item_controls}>
                      <TouchableOpacity
                        disabled={index === 0}
                        onPress={() => handleMoveItem(item.id, "up")}
                        style={[
                          styles.sort_arrow_btn,
                          index === 0 && { opacity: 0.3 },
                        ]}
                      >
                        <Feather name="chevron-up" size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={index === filteredItems.length - 1}
                        onPress={() => handleMoveItem(item.id, "down")}
                        style={[
                          styles.sort_arrow_btn,
                          index === filteredItems.length - 1 && {
                            opacity: 0.3,
                          },
                        ]}
                      >
                        <Feather name="chevron-down" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.item_action_btns}>
                    <TouchableOpacity
                      style={styles.item_edit_btn}
                      onPress={() => handleOpenItemModal(item)}
                    >
                      <Feather name="edit-2" size={14} color="#fff" />
                      <Text style={styles.item_edit_btn_text}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.item_delete_btn}
                      onPress={() =>
                        setDeleteTarget({
                          type: "item",
                          id: item.id,
                          name: item.name,
                        })
                      }
                    >
                      <Feather name="trash-2" size={14} color="#ef5350" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Add / Edit Category Modal ── */}
      <Modal
        visible={catModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCatModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)" }}
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={styles.modal_backdrop}>
              <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
                <View style={styles.modal_card}>
                  <View style={styles.modal_header}>
                    <Text style={styles.modal_title}>
                      {editingCat ? "Edit Category" : "Add Menu Category"}
                    </Text>
                    <TouchableOpacity onPress={() => setCatModalVisible(false)}>
                      <Feather name="x" size={20} color="#aaa" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modal_body}>
                    <Text style={styles.input_label}>CATEGORY NAME *</Text>
                    <TextInput
                      style={styles.text_input}
                      placeholder="e.g. Gourmet Pizzas, Desserts"
                      placeholderTextColor="#666"
                      value={catNameInput}
                      onChangeText={setCatNameInput}
                      returnKeyType="next"
                    />

                    <Text style={styles.input_label}>
                      DESCRIPTION (OPTIONAL)
                    </Text>
                    <TextInput
                      style={[
                        styles.text_input,
                        { height: 80, textAlignVertical: "top" },
                      ]}
                      placeholder="Brief category description for customers..."
                      placeholderTextColor="#666"
                      multiline
                      value={catDescInput}
                      onChangeText={setCatDescInput}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>

                  <View style={styles.modal_footer}>
                    <TouchableOpacity
                      style={styles.modal_cancel_btn}
                      onPress={() => setCatModalVisible(false)}
                      disabled={savingCategory}
                    >
                      <Text style={styles.modal_cancel_text}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.modal_save_btn,
                        savingCategory && { opacity: 0.6 },
                      ]}
                      onPress={handleSaveCategory}
                      disabled={savingCategory}
                    >
                      {savingCategory ? (
                        <ActivityIndicator size="small" color="#121212" />
                      ) : (
                        <Text style={styles.modal_save_text}>
                          {editingCat ? "Save Changes" : "Create Category"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Clean Add / Edit Item Sheet (Simplified Form) ── */}
      <Modal
        visible={itemModalVisible}
        animationType="slide"
        onRequestClose={() => setItemModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: "#121212" }}
        >
          <View
            style={[
              styles.sheet_container,
              { paddingTop: Platform.OS === "ios" ? insets.top + 10 : 20 },
            ]}
          >
            <View style={styles.sheet_header}>
              <TouchableOpacity
                style={styles.sheet_close_btn}
                onPress={() => setItemModalVisible(false)}
                disabled={savingItem}
              >
                <Feather name="x" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.sheet_title}>
                {editingItem ? "Edit Menu Item" : "Create New Menu Item"}
              </Text>
              <TouchableOpacity
                style={[
                  styles.sheet_save_top_btn,
                  savingItem && { opacity: 0.6 },
                ]}
                onPress={handleSaveItem}
                disabled={savingItem}
              >
                {savingItem ? (
                  <ActivityIndicator size="small" color="#121212" />
                ) : (
                  <Text style={styles.sheet_save_top_text}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={[
                styles.sheet_scroll_content,
                {
                  paddingBottom:
                    Platform.OS === "ios" ? insets.bottom + 40 : 50,
                },
              ]}
            >
              {/* Image Upload Banner */}
              <TouchableOpacity
                style={styles.image_picker_box}
                activeOpacity={0.8}
                onPress={pickItemImage}
                disabled={savingItem}
              >
                {itemImage ? (
                  <Image
                    source={{ uri: itemImage }}
                    style={styles.image_picker_img}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.image_picker_placeholder}>
                    <Feather name="camera" size={28} color="#9CA3AF" />
                    <Text style={styles.image_picker_text}>
                      Tap to upload item photo
                    </Text>
                    <Text style={styles.image_picker_sub}>
                      High quality JPG or PNG (Max 5MB)
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Basic Info Fields */}
              <View style={styles.form_section}>
                <Text style={styles.input_label}>ITEM NAME *</Text>
                <TextInput
                  style={styles.text_input}
                  placeholder="e.g. Pepperoni Feast Pizza"
                  placeholderTextColor="#666"
                  value={itemName}
                  onChangeText={setItemName}
                  returnKeyType="next"
                  editable={!savingItem}
                />

                <Text style={styles.input_label}>CATEGORY *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 12 }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    {categories.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.cat_select_chip,
                          itemCategory === c.id &&
                            styles.cat_select_chip_active,
                        ]}
                        onPress={() => setItemCategory(c.id)}
                        disabled={savingItem}
                      >
                        <Text
                          style={[
                            styles.cat_select_chip_text,
                            itemCategory === c.id &&
                              styles.cat_select_chip_text_active,
                          ]}
                        >
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      style={styles.add_cat_chip_btn}
                      onPress={() => handleOpenCatModal()}
                      disabled={savingItem}
                    >
                      <Feather name="plus" size={14} color="#fff" />
                      <Text style={styles.add_cat_chip_btn_text}>
                        New Category
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>

                <View style={styles.row_inputs}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.input_label}>PRICE (₦) *</Text>
                    <TextInput
                      style={styles.text_input}
                      placeholder="e.g. 4500"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      value={itemPrice}
                      onChangeText={setItemPrice}
                      returnKeyType="next"
                      editable={!savingItem}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.input_label}>PREP TIME (MINS)</Text>
                    <TextInput
                      style={styles.text_input}
                      placeholder="e.g. 15"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      value={itemPrepTime}
                      onChangeText={setItemPrepTime}
                      returnKeyType="next"
                      editable={!savingItem}
                    />
                  </View>
                </View>

                <Text style={styles.input_label}>DESCRIPTION</Text>
                <TextInput
                  style={[
                    styles.text_input,
                    { height: 90, textAlignVertical: "top" },
                  ]}
                  placeholder="Describe ingredient details, taste, portion size..."
                  placeholderTextColor="#666"
                  multiline
                  value={itemDescription}
                  onChangeText={setItemDescription}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  editable={!savingItem}
                />
              </View>

              {/* Bottom Save Button */}
              <TouchableOpacity
                style={[
                  styles.sheet_save_main_btn,
                  savingItem && { opacity: 0.6 },
                ]}
                onPress={handleSaveItem}
                disabled={savingItem}
              >
                {savingItem ? (
                  <ActivityIndicator size="small" color="#121212" />
                ) : (
                  <Text style={styles.sheet_save_main_text}>
                    {editingItem ? "Update Menu Item" : "Create Menu Item"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        visible={!!deleteTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View style={styles.modal_backdrop}>
          <View style={styles.modal_card}>
            <Feather
              name="alert-triangle"
              size={32}
              color="#ef5350"
              style={{ alignSelf: "center", marginBottom: 10 }}
            />
            <Text style={[styles.modal_title, { textAlign: "center" }]}>
              Confirm Delete
            </Text>
            <Text style={styles.delete_confirm_text}>
              Are you sure you want to delete "{deleteTarget?.name}"?
              {deleteTarget?.type === "cat" &&
                " All items in this category will also be removed."}
            </Text>

            <View style={styles.modal_footer}>
              <TouchableOpacity
                style={styles.modal_cancel_btn}
                onPress={() => setDeleteTarget(null)}
                disabled={deletingTarget}
              >
                <Text style={styles.modal_cancel_text}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modal_delete_btn,
                  deletingTarget && { opacity: 0.6 },
                ]}
                onPress={confirmDelete}
                disabled={deletingTarget}
              >
                {deletingTarget ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modal_delete_btn_text}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RestaurantMenu;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  top_nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  nav_icon_btn: {
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
    color: "#9CA3AF",
    fontFamily: "raleway-medium",
    fontSize: 11,
  },

  // Toolbar
  toolbar_container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  search_box: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 8,
  },
  search_input: {
    flex: 1,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  reorder_toggle_btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  reorder_toggle_active: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  reorder_btn_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },

  // Actions Bar (+ Category, + Item)
  actions_bar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  add_category_btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  add_category_btn_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  add_item_btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  add_item_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },

  // Category Pills
  category_section: {
    marginBottom: 12,
  },
  category_scroll_content: {
    paddingHorizontal: 16,
    gap: 8,
  },
  cat_tab_wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cat_tab: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  cat_tab_active: {
    backgroundColor: "#ffffff20",
    borderColor: "#fff",
  },
  cat_tab_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  cat_tab_text_active: {
    color: "#fff",
    fontFamily: "raleway-bold",
  },
  cat_reorder_controls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 14,
    paddingHorizontal: 4,
    gap: 2,
  },
  cat_arrow_btn: {
    padding: 4,
  },
  cat_edit_btn: {
    padding: 4,
  },

  // Active Cat Banner
  cat_header_banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginBottom: 14,
  },
  cat_header_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  cat_header_desc: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 2,
  },
  cat_header_edit_btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cat_header_edit_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 11,
  },

  // Scroll Content
  scroll_content: {
    paddingHorizontal: 16,
    gap: 14,
  },

  // Empty State
  empty_state: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    gap: 10,
  },
  empty_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  empty_sub: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 13,
    textAlign: "center",
    maxWidth: "80%",
  },
  empty_add_btn: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  empty_add_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },

  // Item Card
  item_card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 12,
  },
  item_card_top: {
    flexDirection: "row",
    gap: 12,
  },
  item_img_box: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: "#222",
    overflow: "hidden",
    position: "relative",
  },
  item_img: {
    width: "100%",
    height: "100%",
  },
  item_img_placeholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#262626",
  },
  prep_time_badge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  prep_time_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 9,
  },
  item_details: {
    flex: 1,
  },
  item_title_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  item_name_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
    flex: 1,
  },
  item_cat_tag: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 10,
    marginTop: 2,
  },
  item_desc_text: {
    color: "#aaa",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  price_options_row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  item_price_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },

  // Item Footer Controls
  item_card_footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#262626",
  },
  availability_box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  availability_label: {
    fontFamily: "raleway-bold",
    fontSize: 11,
  },
  reorder_item_controls: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#262626",
    padding: 2,
    borderRadius: 8,
  },
  sort_arrow_btn: {
    padding: 4,
  },
  item_action_btns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  item_edit_btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  item_edit_btn_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 11,
  },
  item_delete_btn: {
    backgroundColor: "#ef53501a",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef535033",
  },

  // Modal Backdrop & Cards
  modal_backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal_card: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  modal_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modal_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  modal_body: {
    gap: 8,
  },
  input_label: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  text_input: {
    backgroundColor: "#121212",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  modal_footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  modal_cancel_btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modal_cancel_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  modal_save_btn: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modal_save_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  modal_delete_btn: {
    backgroundColor: "#ef5350",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modal_delete_btn_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  delete_confirm_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 10,
  },

  // ── Sheet / Full Modal Form ──
  sheet_container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  sheet_header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  sheet_close_btn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 17,
  },
  sheet_save_top_btn: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sheet_save_top_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  sheet_scroll_content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 20,
  },

  // Image picker
  image_picker_box: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    backgroundColor: "#1a1a1a",
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  image_picker_img: {
    width: "100%",
    height: "100%",
  },
  image_picker_placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  image_picker_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  image_picker_sub: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 11,
  },

  // Form Section
  form_section: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  row_inputs: {
    flexDirection: "row",
    gap: 12,
  },

  // Category Selector Chips
  cat_select_chip: {
    backgroundColor: "#121212",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  cat_select_chip_active: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  cat_select_chip_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  cat_select_chip_text_active: {
    color: "#121212",
    fontFamily: "raleway-bold",
  },
  add_cat_chip_btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ffffff35",
    borderStyle: "dashed",
  },
  add_cat_chip_btn_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },

  // Bottom Main Save Button
  sheet_save_main_btn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  sheet_save_main_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
});

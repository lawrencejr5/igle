import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import React, { useState, useEffect, useMemo } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons, FontAwesome } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import axios from "axios";

import { useRestaurantContext } from "../../../context/RestaurantContext";
import { useNotificationContext } from "../../../context/NotificationContext";
import { useRatingContext } from "../../../context/RatingContext";
import { API_URLS } from "../../../data/constants";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface ReviewUser {
  _id: string;
  name: string;
  profile_pic?: string;
}

interface ReviewItem {
  _id: string;
  rating: number;
  review: string;
  user: ReviewUser;
  food_order_id?: string;
  createdAt: string;
  vendor_reply?: string;
  vendor_reply_at?: string;
}

// ─── Mock Fallback Reviews ───────────────────────────────────────────────────

const MOCK_REVIEWS: ReviewItem[] = [
  {
    _id: "rev_1",
    rating: 5,
    review:
      "The Smoky Jollof with grilled chicken was absolutely out of this world! Piping hot, perfectly spiced, and arrived way earlier than expected.",
    user: {
      _id: "u1",
      name: "Chidimma Nwosu",
      profile_pic:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    },
    food_order_id: "#IG-9402",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    vendor_reply:
      "Thank you so much Chidimma! We take huge pride in our firewood jollof. Hope to serve you again soon! 🔥",
    vendor_reply_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    _id: "rev_2",
    rating: 5,
    review:
      "Generous portion sizes and super neat packaging. The fried plantains were ripe and delicious. 10/10 recommend!",
    user: {
      _id: "u2",
      name: "Adebayo Tunde",
      profile_pic:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    },
    food_order_id: "#IG-9388",
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    _id: "rev_3",
    rating: 4,
    review:
      "Egusi soup was rich and spicy! Just wished there was an extra piece of beef, but overall amazing flavor.",
    user: {
      _id: "u3",
      name: "Blessing Okon",
      profile_pic:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    },
    food_order_id: "#IG-9340",
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    vendor_reply:
      "Hi Blessing, thanks for the feedback! You can add extra meat options under our soup customizer. Glad you enjoyed the flavor!",
  },
  {
    _id: "rev_4",
    rating: 3,
    review:
      "Food was good but the delivery rider took longer than usual. Food was slightly warm instead of hot.",
    user: {
      _id: "u4",
      name: "Emeka Johnson",
    },
    food_order_id: "#IG-9290",
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
  {
    _id: "rev_5",
    rating: 5,
    review:
      "Best Suya Platter in town! Perfectly seasoned with heavy kuli-kuli powder. Ordering again tonight!",
    user: {
      _id: "u5",
      name: "Fatima Aliyu",
      profile_pic:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
    },
    food_order_id: "#IG-9211",
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

const StoreReviewsScreen = () => {
  const insets = useSafeAreaInsets();
  const { restaurant } = useRestaurantContext();
  const { showNotification } = useNotificationContext();
  const {
    restaurantReviews: ctxReviews,
    fetchRestaurantRatings,
    ratingLoading,
  } = useRatingContext();

  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[]>(MOCK_REVIEWS);
  const [selectedFilter, setSelectedFilter] = useState<number | "ALL">("ALL");

  // Reply Modal State
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [activeReviewForReply, setActiveReviewForReply] =
    useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (restaurant?._id) {
      fetchRestaurantRatings(restaurant._id);
    }
  }, [restaurant?._id]);

  useEffect(() => {
    if (ctxReviews && ctxReviews.length > 0) {
      setReviews(ctxReviews as any);
    }
  }, [ctxReviews]);

  // Metrics Calculations
  const metrics = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        avg: 5.0,
        total: 0,
        counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recommendPercent: 100,
      };
    }

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    reviews.forEach((r) => {
      const score = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[score as 1 | 2 | 3 | 4 | 5] =
        (counts[score as 1 | 2 | 3 | 4 | 5] || 0) + 1;
      sum += r.rating;
    });

    const avg = Math.round((sum / total) * 10) / 10;
    const percentages = {
      5: Math.round((counts[5] / total) * 100),
      4: Math.round((counts[4] / total) * 100),
      3: Math.round((counts[3] / total) * 100),
      2: Math.round((counts[2] / total) * 100),
      1: Math.round((counts[1] / total) * 100),
    };

    const positiveCount = counts[5] + counts[4];
    const recommendPercent = Math.round((positiveCount / total) * 100);

    return { avg, total, counts, percentages, recommendPercent };
  }, [reviews]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    if (selectedFilter === "ALL") return reviews;
    return reviews.filter(
      (r) => Math.round(r.rating) === Number(selectedFilter)
    );
  }, [reviews, selectedFilter]);

  const handleOpenReplyModal = (review: ReviewItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveReviewForReply(review);
    setReplyText(review.vendor_reply || "");
    setReplyModalVisible(true);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !activeReviewForReply) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSendingReply(true);

    setTimeout(() => {
      setReviews((prev) =>
        prev.map((r) =>
          r._id === activeReviewForReply._id
            ? {
                ...r,
                vendor_reply: replyText.trim(),
                vendor_reply_at: new Date().toISOString(),
              }
            : r
        )
      );

      setSendingReply(false);
      setReplyModalVisible(false);
      setActiveReviewForReply(null);
      setReplyText("");
      showNotification("Response posted to customer review!", "success");
    }, 600);
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    const days = Math.floor(diffSec / 86400);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  const renderStarRating = (score: number, size = 14) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesome
          key={i}
          name={i <= score ? "star" : "star-o"}
          size={size}
          color={i <= score ? "#FFC107" : "#444"}
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={{ flexDirection: "row", alignItems: "center" }}>{stars}</View>;
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "ios" ? insets.top + 10 : insets.top + 14 },
      ]}
    >
      {/* ── Top Nav Header (Back Button Only) ── */}
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

        <View style={styles.header_title_container}>
          <Text style={styles.header_title}>Store Reviews</Text>
          <Text style={styles.header_sub}>Customer ratings & feedback</Text>
        </View>

        <View style={styles.header_badge}>
          <FontAwesome name="star" size={13} color="#FFC107" />
          <Text style={styles.header_badge_text}>
            {metrics.avg.toFixed(1)}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll_content,
          { paddingBottom: Platform.OS === "ios" ? insets.bottom + 30 : 40 },
        ]}
      >
        {/* ── Rating Summary & Breakdown Hero Card ── */}
        <View style={styles.hero_rating_card}>
          <View style={styles.hero_left}>
            <Text style={styles.big_score}>{metrics.avg.toFixed(1)}</Text>
            {renderStarRating(Math.round(metrics.avg), 18)}
            <Text style={styles.hero_review_count}>
              Based on {metrics.total} {metrics.total === 1 ? "review" : "reviews"}
            </Text>
            <View style={styles.recommend_badge}>
              <Feather name="thumbs-up" size={11} color="#4CAF50" />
              <Text style={styles.recommend_text}>
                {metrics.recommendPercent}% positive
              </Text>
            </View>
          </View>

          <View style={styles.hero_divider} />

          {/* Star Distribution Bars */}
          <View style={styles.hero_right}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = metrics.counts[star as 1 | 2 | 3 | 4 | 5] || 0;
              const pct = metrics.percentages[star as 1 | 2 | 3 | 4 | 5] || 0;
              return (
                <View key={star} style={styles.bar_row}>
                  <Text style={styles.bar_star_label}>{star} ★</Text>
                  <View style={styles.bar_track}>
                    <View
                      style={[
                        styles.bar_fill,
                        {
                          width: `${pct}%`,
                          backgroundColor:
                            star >= 4 ? "#FFC107" : star === 3 ? "#FF9800" : "#F44336",
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.bar_count}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Filter Chips ── */}
        <View style={styles.filter_section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filter_chips_scroll}
          >
            <TouchableOpacity
              style={[
                styles.chip,
                selectedFilter === "ALL" && styles.chip_active,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedFilter("ALL");
              }}
            >
              <Text
                style={[
                  styles.chip_text,
                  selectedFilter === "ALL" && styles.chip_text_active,
                ]}
              >
                All ({metrics.total})
              </Text>
            </TouchableOpacity>

            {[5, 4, 3, 2, 1].map((star) => {
              const count = metrics.counts[star as 1 | 2 | 3 | 4 | 5] || 0;
              const isActive = selectedFilter === star;
              return (
                <TouchableOpacity
                  key={star}
                  style={[styles.chip, isActive && styles.chip_active]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedFilter(star);
                  }}
                >
                  <FontAwesome
                    name="star"
                    size={11}
                    color={isActive ? "#121212" : "#FFC107"}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.chip_text,
                      isActive && styles.chip_text_active,
                    ]}
                  >
                    {star} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Reviews Header & Count ── */}
        <View style={styles.section_title_row}>
          <Text style={styles.section_title}>Customer Feedback</Text>
          <Text style={styles.reviews_showing_count}>
            Showing {filteredReviews.length} of {metrics.total}
          </Text>
        </View>

        {/* ── Review Cards List ── */}
        {loading ? (
          <View style={styles.loading_container}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loading_text}>Loading customer reviews...</Text>
          </View>
        ) : filteredReviews.length === 0 ? (
          <View style={styles.empty_container}>
            <View style={styles.empty_icon_box}>
              <Ionicons name="chatbox-outline" size={32} color="#666" />
            </View>
            <Text style={styles.empty_title}>No reviews found</Text>
            <Text style={styles.empty_sub}>
              There are no reviews matching the selected filter criteria.
            </Text>
          </View>
        ) : (
          <View style={styles.reviews_list}>
            {filteredReviews.map((item) => (
              <View key={item._id} style={styles.review_card}>
                {/* User & Rating Row */}
                <View style={styles.card_header}>
                  <View style={styles.user_info}>
                    {item.user?.profile_pic ? (
                      <Image
                        source={{ uri: item.user.profile_pic }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatar_placeholder}>
                        <Text style={styles.avatar_initial}>
                          {item.user?.name ? item.user.name.charAt(0) : "C"}
                        </Text>
                      </View>
                    )}
                    <View>
                      <Text style={styles.user_name}>
                        {item.user?.name || "Customer"}
                      </Text>
                      <View style={styles.rating_time_row}>
                        {renderStarRating(item.rating, 13)}
                        <Text style={styles.bullet_dot}>•</Text>
                        <Text style={styles.time_text}>
                          {formatTimeAgo(item.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {item.food_order_id && (
                    <View style={styles.order_tag}>
                      <Feather name="shopping-bag" size={10} color="#888" />
                      <Text style={styles.order_tag_text}>
                        {item.food_order_id}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Review Text */}
                {item.review ? (
                  <Text style={styles.review_text}>{item.review}</Text>
                ) : (
                  <Text style={styles.no_comment_text}>
                    (Rating only, no written commentary)
                  </Text>
                )}

                {/* Vendor Reply Box if already replied */}
                {item.vendor_reply ? (
                  <View style={styles.reply_box}>
                    <View style={styles.reply_box_header}>
                      <View style={styles.reply_badge}>
                        <Feather name="corner-down-right" size={12} color="#fff" />
                        <Text style={styles.reply_badge_text}>Your Response</Text>
                      </View>
                      {item.vendor_reply_at && (
                        <Text style={styles.reply_time_text}>
                          {formatTimeAgo(item.vendor_reply_at)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.reply_text}>{item.vendor_reply}</Text>

                    <TouchableOpacity
                      style={styles.edit_reply_btn}
                      onPress={() => handleOpenReplyModal(item)}
                    >
                      <Feather name="edit-2" size={12} color="#888" />
                      <Text style={styles.edit_reply_text}>Edit response</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Reply Action Button */
                  <TouchableOpacity
                    style={styles.reply_btn}
                    onPress={() => handleOpenReplyModal(item)}
                  >
                    <Feather name="message-square" size={13} color="#fff" />
                    <Text style={styles.reply_btn_text}>Reply to customer</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Reply Modal ── */}
      <Modal
        visible={replyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReplyModalVisible(false)}
      >
        <View style={styles.modal_overlay}>
          <Pressable
            style={styles.modal_backdrop}
            onPress={() => setReplyModalVisible(false)}
          />
          <View
            style={[
              styles.modal_card,
              { paddingBottom: Platform.OS === "ios" ? insets.bottom + 20 : 24 },
            ]}
          >
            <View style={styles.modal_handle} />

            <View style={styles.modal_header}>
              <Text style={styles.modal_title}>
                {activeReviewForReply?.vendor_reply
                  ? "Edit Reply"
                  : "Reply to Customer"}
              </Text>
              <TouchableOpacity
                style={styles.close_btn}
                onPress={() => setReplyModalVisible(false)}
              >
                <Feather name="x" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {activeReviewForReply && (
              <View style={styles.modal_review_preview}>
                <Text style={styles.modal_user_name}>
                  {activeReviewForReply.user?.name}:
                </Text>
                <Text
                  style={styles.modal_review_snippet}
                  numberOfLines={2}
                >
                  "{activeReviewForReply.review || "Rating: " + activeReviewForReply.rating + " stars"}"
                </Text>
              </View>
            )}

            <View style={styles.input_container}>
              <Text style={styles.input_label}>YOUR RESPONSE</Text>
              <TextInput
                style={styles.text_input}
                multiline
                numberOfLines={4}
                placeholder="Write a warm, polite response to this customer..."
                placeholderTextColor="#666"
                value={replyText}
                onChangeText={setReplyText}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.send_btn,
                (!replyText.trim() || sendingReply) && styles.send_btn_disabled,
              ]}
              disabled={!replyText.trim() || sendingReply}
              onPress={handleSendReply}
            >
              {sendingReply ? (
                <ActivityIndicator size="small" color="#121212" />
              ) : (
                <>
                  <Feather name="send" size={16} color="#121212" />
                  <Text style={styles.send_btn_text}>Post Response</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StoreReviewsScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  // Top Header
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
  header_title_container: {
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
  header_badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFC1071A",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFC10733",
  },
  header_badge_text: {
    color: "#FFC107",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },

  scroll_content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 18,
  },

  // Hero Rating Summary Card
  hero_rating_card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hero_left: {
    alignItems: "center",
    justifyContent: "center",
    width: "42%",
    gap: 4,
  },
  big_score: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 38,
    lineHeight: 44,
  },
  hero_review_count: {
    color: "#888",
    fontFamily: "raleway-medium",
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
  recommend_badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#4CAF501A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#4CAF5033",
  },
  recommend_text: {
    color: "#4CAF50",
    fontFamily: "raleway-semibold",
    fontSize: 10,
  },
  hero_divider: {
    width: 1,
    height: "85%",
    backgroundColor: "#2a2a2a",
  },
  hero_right: {
    width: "53%",
    gap: 6,
  },
  bar_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bar_star_label: {
    color: "#888",
    fontFamily: "raleway-semibold",
    fontSize: 11,
    width: 26,
  },
  bar_track: {
    flex: 1,
    height: 6,
    backgroundColor: "#2a2a2a",
    borderRadius: 3,
    overflow: "hidden",
  },
  bar_fill: {
    height: "100%",
    borderRadius: 3,
  },
  bar_count: {
    color: "#666",
    fontFamily: "raleway-medium",
    fontSize: 10,
    width: 18,
    textAlign: "right",
  },

  // Filter Section
  filter_section: {
    marginHorizontal: -16,
  },
  filter_chips_scroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  chip_active: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  chip_text: {
    color: "#aaa",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  chip_text_active: {
    color: "#121212",
    fontFamily: "raleway-bold",
  },

  // Section Title
  section_title_row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  section_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  reviews_showing_count: {
    color: "#777",
    fontFamily: "raleway-medium",
    fontSize: 12,
  },

  // Loading & Empty States
  loading_container: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  loading_text: {
    color: "#888",
    fontFamily: "raleway-medium",
    fontSize: 13,
  },
  empty_container: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 10,
    marginTop: 10,
  },
  empty_icon_box: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
  empty_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  empty_sub: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // Reviews List & Cards
  reviews_list: {
    gap: 14,
  },
  review_card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 12,
  },
  card_header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  user_info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
  },
  avatar_placeholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar_initial: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  user_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
    marginBottom: 2,
  },
  rating_time_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bullet_dot: {
    color: "#555",
    fontSize: 10,
  },
  time_text: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 11,
  },
  order_tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#262626",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  order_tag_text: {
    color: "#888",
    fontFamily: "raleway-semibold",
    fontSize: 10,
  },
  review_text: {
    color: "#ddd",
    fontFamily: "raleway-regular",
    fontSize: 13.5,
    lineHeight: 20,
  },
  no_comment_text: {
    color: "#666",
    fontFamily: "raleway-italic",
    fontSize: 12,
  },

  // Reply Box
  reply_box: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#333",
    gap: 6,
    marginTop: 4,
  },
  reply_box_header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reply_badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reply_badge_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  reply_time_text: {
    color: "#666",
    fontFamily: "raleway-regular",
    fontSize: 10,
  },
  reply_text: {
    color: "#bbb",
    fontFamily: "raleway-regular",
    fontSize: 12.5,
    lineHeight: 18,
  },
  edit_reply_btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  edit_reply_text: {
    color: "#888",
    fontFamily: "raleway-medium",
    fontSize: 11,
  },

  // Reply Action Button
  reply_btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2a2a2a",
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#333",
  },
  reply_btn_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },

  // Modal
  modal_overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modal_backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modal_card: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#333",
    gap: 16,
  },
  modal_handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333",
    alignSelf: "center",
    marginBottom: 4,
  },
  modal_header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modal_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  close_btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
  modal_review_preview: {
    backgroundColor: "#242424",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#FFC107",
    gap: 2,
  },
  modal_user_name: {
    color: "#FFC107",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  modal_review_snippet: {
    color: "#ccc",
    fontFamily: "raleway-regular",
    fontSize: 12,
    fontStyle: "italic",
  },
  input_container: {
    gap: 6,
  },
  input_label: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  text_input: {
    backgroundColor: "#121212",
    borderRadius: 14,
    padding: 14,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 14,
    minHeight: 110,
    borderWidth: 1,
    borderColor: "#333",
  },
  send_btn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  send_btn_disabled: {
    opacity: 0.4,
  },
  send_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
});

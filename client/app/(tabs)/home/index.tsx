import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import React, { useState, useRef } from "react";

import { router } from "expo-router";
import { useRideContext } from "../../../context/RideContext";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FontAwesome6 } from "@expo/vector-icons";
import { useSavedPlaceContext } from "../../../context/SavedPlaceContext";
import { useActivityContext } from "../../../context/ActivityContext";
import SideNav from "../../../components/SideNav";
import NotificationScreen from "../../../components/screens/NotificationScreen";
import { useAuthContext } from "../../../context/AuthContext";

const Home = () => {
  const insets = useSafeAreaInsets();

  const { signedIn } = useAuthContext();
  const { setRideStatus, setModalUp } = useRideContext();

  const scrollRef = useRef<ScrollView | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const CARD_WIDTH = 300;
  const CARD_SPACING = 12;

  // Side nav state
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);

  // Notification screen state
  const [openNotification, setOpenNotification] = useState<boolean>(false);
  const { activities, activityLoading, formatTime } = useActivityContext();

  return (
    <>
      <ScrollView style={[styles.container, { paddingTop: insets.top + 10 }]}>
        <View>
          <View style={styles.nav_container}>
            <TouchableOpacity
              style={styles.nav_box}
              onPress={() => setSideNavOpen(true)}
            >
              <Feather name="menu" size={25} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                gap: 10,
                alignItems: "center",
                paddingHorizontal: 10,
                paddingRight: 20,
                borderTopLeftRadius: 50,
                borderBottomLeftRadius: 50,
                paddingVertical: 5,
              }}
            >
              <Image
                source={
                  signedIn?.profile_pic
                    ? { uri: signedIn?.profile_pic } // remote image from backend
                    : require("../../../assets/images/user.png") // fallback local asset
                }
                style={{
                  height: 40,
                  width: 40,
                  borderRadius: 20,
                }}
              />
              <View>
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "raleway-bold",
                    fontSize: 14,
                  }}
                >
                  {signedIn?.name}
                </Text>
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "raleway-regular",
                    fontSize: 10,
                  }}
                >
                  Asaba, Nigeria
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 20 }}>
            <Text
              style={{
                color: "#fff",
                fontSize: 25,
                fontFamily: "raleway-bold",
              }}
            >
              Good Morning 👋
            </Text>

            {/* Banner */}
            <View style={{ marginTop: 10 }}>
              <ScrollView
                ref={(r) => {
                  scrollRef.current = r;
                }}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bannerScroll}
                snapToInterval={CARD_WIDTH + CARD_SPACING}
                decelerationRate="fast"
                snapToAlignment="start"
                onMomentumScrollEnd={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  const idx = Math.round(x / (CARD_WIDTH + CARD_SPACING));
                  setActiveIndex(idx);
                }}
              >
                <Pressable
                  style={styles.bannerCard}
                  onPress={() => {
                    // open booking modal
                    setRideStatus("booking");
                    setModalUp(true);
                    router.push("./home/book_ride");
                  }}
                >
                  <Text style={styles.bannerTitle}>Need a ride</Text>
                  <Text style={styles.bannerSubtitle}>
                    Get picked up in minutes
                  </Text>
                  <TouchableOpacity
                    style={[styles.bannerBtn, { alignSelf: "flex-end" }]}
                    onPress={() => {
                      setRideStatus("booking");
                      setModalUp(true);
                      router.push("./home/book_ride");
                    }}
                  >
                    <Text style={styles.bannerBtnText}>Book ride</Text>
                  </TouchableOpacity>
                </Pressable>

                <Pressable
                  style={[styles.bannerCard, styles.bannerCardAlt]}
                  onPress={() => router.push("../deliver")}
                >
                  <Text style={styles.bannerTitle}>Send a package</Text>
                  <Text style={styles.bannerSubtitle}>
                    Fast door-to-door delivery
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.bannerBtn,
                      styles.bannerBtnAlt,
                      { alignSelf: "flex-end" },
                    ]}
                    onPress={() => router.push("../deliver")}
                  >
                    <Text
                      style={[styles.bannerBtnText, styles.bannerBtnTextAlt]}
                    >
                      Send now
                    </Text>
                  </TouchableOpacity>
                </Pressable>

                <Pressable
                  style={[styles.bannerCard, styles.bannerCardAlt2]}
                  onPress={() => router.push("../offers")}
                >
                  <Text style={styles.bannerTitle}>Explore offers</Text>
                  <Text style={styles.bannerSubtitle}>
                    Deals, promos & vouchers
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.bannerBtn,
                      styles.bannerBtnAlt2,
                      { alignSelf: "flex-end" },
                    ]}
                    onPress={() => router.push("../offers")}
                  >
                    <Text
                      style={[styles.bannerBtnText, styles.bannerBtnTextAlt]}
                    >
                      See offers
                    </Text>
                  </TouchableOpacity>
                </Pressable>
              </ScrollView>
              <View style={styles.dotContainer}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === activeIndex && styles.dotActive]}
                  />
                ))}
              </View>
            </View>
            {/* Services section */}
            <View style={{ marginTop: 30 }}>
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "raleway-bold",
                  fontSize: 18,
                  marginBottom: 12,
                }}
              >
                What would you like to do?
              </Text>
              <View style={styles.serviceRow}>
                <Pressable
                  style={styles.serviceCard}
                  onPress={() => {
                    setRideStatus("booking");
                    router.push("./home/book_ride");
                  }}
                >
                  <View style={styles.serviceIconBox}>
                    <Feather name="navigation" size={16} color="#fff" />
                  </View>
                  <View style={{ marginTop: 8, alignSelf: "flex-start" }}>
                    <Text style={styles.serviceTitle}>Book ride</Text>
                    <Text style={styles.serviceSubtitle}>
                      Request a nearby driver
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  style={styles.serviceCard}
                  onPress={() => router.push("../deliver")}
                >
                  <View style={styles.serviceIconBox}>
                    <Feather name="truck" size={16} color="#fff" />
                  </View>
                  <View style={{ marginTop: 8, alignSelf: "flex-start" }}>
                    <Text style={styles.serviceTitle}>Deliver package</Text>
                    <Text style={styles.serviceSubtitle}>
                      Fast door-to-door
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Saved places (like RouteModal) */}
            <View style={{ marginTop: 20 }}>
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "raleway-bold",
                  fontSize: 18,
                  marginBottom: 12,
                }}
              >
                Saved places
              </Text>
              <SavedPlaces />
            </View>
            {/* Ongoing ride/package card (dummy data) */}
            <View style={{ marginTop: 22 }}>
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "raleway-bold",
                  fontSize: 18,
                  marginBottom: 12,
                }}
              >
                Ongoing
              </Text>
              <OngoingCard />
            </View>
          </View>
          {/* Recent activities (3 items) */}
          <View style={{ marginTop: 20, marginBottom: 60 }}>
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-bold",
                fontSize: 18,
                marginBottom: 12,
              }}
            >
              Recent activities
            </Text>
            <RecentActivities />
          </View>
        </View>
      </ScrollView>
      {/* Side nav */}
      <SideNav
        open={sideNavOpen}
        setSideNavOpen={setSideNavOpen}
        mode="rider"
      />
      <NotificationScreen
        open={openNotification}
        setOpen={setOpenNotification}
      />
    </>
  );
};

export default Home;

const OngoingCard = () => {
  // dummy data
  const ongoing = {
    type: "package", // or 'ride'
    from: "Umuahia Airport",
    to: "City Center",
    driver: "Samuel I.",
    eta: "5 mins",
    status: "arriving",
  };

  const isPackage = ongoing.type === "package";

  return (
    <Pressable style={styles.ongoingCard} onPress={() => {}}>
      <View style={styles.ongoingLeft}>
        <View style={styles.ongoingIconBox}>
          {isPackage ? (
            <Feather name="truck" size={18} color="#fff" />
          ) : (
            <Feather name="navigation" size={18} color="#fff" />
          )}
        </View>
        <View style={styles.ongoingInfo}>
          <Text style={styles.ongoingTitle} numberOfLines={1}>
            {isPackage ? "Package delivery" : "Ride in progress"}
          </Text>
          <Text style={styles.ongoingSubtitle} numberOfLines={1}>
            {ongoing.from} → {ongoing.to}
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: "#ff9d003a",
          paddingVertical: 5,
          paddingHorizontal: 10,
          borderRadius: 20,
          alignSelf: "flex-start",
        }}
      >
        <Text
          style={{
            color: "#ff9d00",
            fontFamily: "raleway-bold",
            fontSize: 10,
            textTransform: "capitalize",
            width: "100%",
          }}
        >
          {ongoing.status}
        </Text>
      </View>
    </Pressable>
  );
};

const SavedPlaces = () => {
  const { homePlace, officePlace, otherPlaces } = useSavedPlaceContext();
  const { set_destination_func } = useRideContext();

  return (
    <View style={{ marginTop: 10 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {/* Home */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            homePlace
              ? set_destination_func(
                  homePlace.place_id,
                  homePlace.place_name,
                  homePlace.place_sub_name
                )
              : router.push("../../account/saved_places");
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            width: 140,
          }}
        >
          <Entypo name="home" color={"#cdcdcd"} size={22} />
          <View style={{ flexShrink: 1 }}>
            <Text style={{ fontFamily: "raleway-bold", color: "#cdcdcd" }}>
              Home
            </Text>
            {homePlace ? (
              <Text
                style={{
                  fontFamily: "raleway-regular",
                  color: "#cdcdcd",
                  fontSize: 12,
                  textTransform: "capitalize",
                }}
                numberOfLines={1}
              >
                {homePlace.place_name}
              </Text>
            ) : (
              <Text
                style={{
                  fontFamily: "raleway-regular",
                  color: "#cdcdcd",
                  fontSize: 12,
                }}
                numberOfLines={1}
              >
                Add place <Feather name="plus" color={"#cdcdcd"} size={12} />
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Office */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            officePlace
              ? set_destination_func(
                  officePlace.place_id,
                  officePlace.place_name,
                  officePlace.place_sub_name
                )
              : router.push("../../account/saved_places");
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            width: 140,
          }}
        >
          <FontAwesome name="briefcase" color={"#cdcdcd"} size={20} />
          <View style={{ flexShrink: 1 }}>
            <Text style={{ fontFamily: "raleway-bold", color: "#cdcdcd" }}>
              Office
            </Text>
            {officePlace ? (
              <Text
                style={{
                  fontFamily: "raleway-regular",
                  color: "#cdcdcd",
                  fontSize: 12,
                  textTransform: "capitalize",
                }}
                numberOfLines={1}
              >
                {officePlace.place_name}
              </Text>
            ) : (
              <Text
                style={{
                  fontFamily: "raleway-regular",
                  color: "#cdcdcd",
                  fontSize: 12,
                }}
                numberOfLines={1}
              >
                Add place <Feather name="plus" color={"#cdcdcd"} size={12} />
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Other places */}
        {otherPlaces?.map((item) => (
          <TouchableOpacity
            key={item._id}
            activeOpacity={0.7}
            onPress={() => {
              set_destination_func(
                item.place_id,
                item.place_name,
                item.place_sub_name
              );
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              width: 140,
            }}
          >
            <FontAwesome6 name="location-dot" color={"#cdcdcd"} size={20} />
            <View style={{ flexShrink: 1 }}>
              <Text
                style={{
                  fontFamily: "raleway-bold",
                  color: "#cdcdcd",
                  textTransform: "capitalize",
                }}
              >
                {item.place_header}
              </Text>
              <Text
                style={{
                  fontFamily: "raleway-regular",
                  color: "#cdcdcd",
                  textTransform: "capitalize",
                }}
                numberOfLines={1}
              >
                {item.place_name}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Add new place */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("../../account/saved_places")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            width: 140,
          }}
        >
          <FontAwesome6 name="plus" color={"#cdcdcd"} size={20} />
          <View style={{ flexShrink: 1 }}>
            <Text
              style={{
                fontFamily: "raleway-bold",
                color: "#cdcdcd",
                textTransform: "capitalize",
              }}
            >
              Add Place
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const RecentActivities: React.FC<{
  onSeeMore?: () => void;
}> = ({ onSeeMore }) => {
  const { activities, activityLoading, formatTime } = useActivityContext();
  const items = activities?.slice(0, 3) || [];

  return (
    <View>
      {activityLoading ? (
        <ActivityIndicator color="#fff" />
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={require("../../../assets/images/empty_inbox-nobg.png")}
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>
            No recent activity for you at this time.
          </Text>
          {items.length > 0 && (
            <TouchableOpacity
              onPress={() => router.push("../account/notifications")}
              style={styles.seeMoreRow}
            >
              <Text style={styles.seeMoreText}>See more</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View>
          {items.map((it) => (
            <View key={it._id} style={styles.activityRow}>
              <View style={styles.activityIcon}>
                <MaterialCommunityIcons
                  name="history"
                  size={24}
                  color="#d0d0d0"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle} numberOfLines={1}>
                  {it.title}
                </Text>
                <Text style={styles.activityMessage} numberOfLines={1}>
                  {it.message}
                </Text>
              </View>
              <Text style={styles.activityTime}>
                {formatTime(it.createdAt)}
              </Text>
            </View>
          ))}
          {items.length > 0 && (
            <TouchableOpacity
              onPress={() => router.push("../account/notifications")}
              style={styles.seeMoreRow}
            >
              <Text style={styles.seeMoreText}>See more</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 15,
  },
  nav_container: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nav_box: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerScroll: {
    paddingVertical: 5,
    paddingRight: 10,
    gap: 12,
  },
  bannerCard: {
    width: 300,
    height: 120,
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 12,
    marginRight: 12,
    justifyContent: "space-between",
  },
  bannerCardAlt: {
    backgroundColor: "#f5f5f5",
  },
  bannerCardAlt2: {
    backgroundColor: "#eef6ff",
  },
  bannerTitle: {
    fontFamily: "raleway-bold",
    fontSize: 16,
    color: "#121212",
  },
  bannerSubtitle: {
    fontFamily: "raleway-regular",
    fontSize: 11,
    color: "#666",
  },
  bannerBtn: {
    backgroundColor: "#121212",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  bannerBtnText: {
    color: "#fff",
    fontFamily: "raleway-bold",
  },
  bannerBtnAlt: {
    backgroundColor: "#ff8c00",
  },
  bannerBtnAlt2: {
    backgroundColor: "#007bff",
  },
  bannerBtnTextAlt: {
    color: "#fff",
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#666",
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 28,
    height: 5,
    borderRadius: 6,
  },
  serviceRow: {
    flexDirection: "row",
    gap: 12,
  },
  serviceCard: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#2e2e2eff",
    padding: 12,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
  },
  serviceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignSelf: "flex-start",
    backgroundColor: "#555555",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceTitle: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  serviceSubtitle: {
    color: "#c1c1c1",
    fontFamily: "raleway-regular",
    fontSize: 11,
  },
  ongoingCard: {
    width: "100%",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#1a1a1a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ongoingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  ongoingIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2e2e2e",
    alignItems: "center",
    justifyContent: "center",
  },
  ongoingInfo: {
    flex: 1,
  },
  ongoingTitle: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  ongoingSubtitle: {
    color: "#bdbdbd",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginTop: 7,
  },
  ongoingRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  ongoingMeta: {
    color: "#9e9e9e",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  ongoingStatus: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  ongoingStatusText: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    marginVertical: 5,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#2e2e2e",
    alignItems: "center",
    justifyContent: "center",
  },
  activityTitle: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  activityMessage: {
    color: "#bdbdbd",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginTop: 5,
  },
  activityTime: {
    color: "#9e9e9e",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginLeft: 8,
  },
  seeMoreRow: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  seeMoreText: {
    color: "#cfcfcf",
    fontFamily: "raleway-bold",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyImage: {
    width: 160,
    height: 120,
    marginBottom: 8,
  },
  emptyText: {
    color: "#cfcfcf",
    fontFamily: "raleway-regular",
    textAlign: "center",
    marginBottom: 8,
  },
});

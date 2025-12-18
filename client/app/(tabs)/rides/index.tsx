import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Linking,
  ScrollView,
  Pressable,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from "react-native";
import { Image } from "expo-image";

import React, { useState, useCallback, useEffect } from "react";

import { router } from "expo-router";

import RideRoute from "../../../components/RideRoute";
import DriverCard from "../../../components/DriverCard";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import { useRideContext } from "../../../context/RideContext";
import { useNotificationContext } from "../../../context/NotificationContext";
import { useMapContext } from "../../../context/MapContext";

import Notification from "../../../components/Notification";
import { useLoading } from "../../../context/LoadingContext";
import AppLoading from "../../../loadings/AppLoading";
import RideLoading from "../../../loadings/RideLoading";
import { FontAwesome6 } from "@expo/vector-icons";

const vehicleIcons: Record<string, any> = {
  cab: require("../../../assets/images/icons/sedan-icon.png"),
  keke: require("../../../assets/images/icons/keke-icon.png"),
  suv: require("../../../assets/images/icons/suv-icon.png"),
};

const Rides = () => {
  const { notification, showNotification } = useNotificationContext();
  const { appLoading, loadingState } = useLoading();

  const [category, setCategory] = useState<
    "ongoing" | "scheduled" | "completed" | "cancelled"
  >("ongoing");

  const {
    ongoingRideData,
    userCompletedRides,
    userCancelledRides,
    scheduledRides,
  } = useRideContext();

  return (
    <>
      {appLoading ? (
        <AppLoading />
      ) : (
        <>
          {notification.visible && <Notification notification={notification} />}

          <View style={styles.container}>
            <Text style={styles.header_text}>Rides</Text>

            {/* Categories nav... */}
            <CategoryTabs
              category={category}
              setCategory={setCategory}
              scheduledRides={scheduledRides}
              userCancelledRides={userCancelledRides}
            />

            {/* Ongoing data */}
            {category === "ongoing" &&
              (ongoingRideData ? (
                <OngoingRide data={ongoingRideData} />
              ) : (
                <EmptyState
                  message="You don't have any ongoing rides currently"
                  tab="ongoing"
                />
              ))}

            {category === "scheduled" &&
              (scheduledRides && scheduledRides.length > 0 ? (
                <ScheduledRides data={scheduledRides} />
              ) : (
                <EmptyState
                  message="You don't have any scheduled rides currently"
                  tab="scheduled"
                />
              ))}

            {/* Completed data */}
            {category === "completed" &&
              (loadingState.completedRides ? (
                <RideLoading />
              ) : userCompletedRides?.length === 0 ? (
                <EmptyState
                  message="You haven't completed any rides yet"
                  tab="completed"
                />
              ) : (
                <CompletedRides data={userCompletedRides} />
              ))}

            {/* Cancelled data */}
            {category === "cancelled" &&
              (loadingState.cancelledRides ? (
                <RideLoading />
              ) : userCancelledRides?.length === 0 ? (
                <EmptyState
                  message="You haven't cancelled any rides yet"
                  tab="cancelled"
                />
              ) : (
                <CancelledRides data={userCancelledRides} />
              ))}
          </View>
        </>
      )}
    </>
  );
};

const CategoryTabs = ({
  category,
  setCategory,
  scheduledRides,
  userCancelledRides,
}: {
  category: "ongoing" | "scheduled" | "completed" | "cancelled";
  setCategory: (
    cat: "ongoing" | "scheduled" | "completed" | "cancelled"
  ) => void;
  scheduledRides: any;
  userCancelledRides: any;
}) => {
  // Always show ongoing and completed
  const baseTabs: Array<"ongoing" | "scheduled" | "completed" | "cancelled"> = [
    "ongoing",
    "completed",
  ];

  // Conditionally add scheduled and cancelled tabs
  const conditionalTabs: Array<"scheduled" | "cancelled"> = [];

  if (scheduledRides && scheduledRides.length > 0) {
    conditionalTabs.push("scheduled");
  }

  if (userCancelledRides && userCancelledRides.length > 0) {
    conditionalTabs.push("cancelled");
  }

  // Combine base tabs with conditional tabs
  const tabs = [...baseTabs, ...conditionalTabs];

  // If current category is not in available tabs, switch to ongoing
  React.useEffect(() => {
    if (!tabs.includes(category)) {
      setCategory("ongoing");
    }
  }, [tabs, category, setCategory]);

  return (
    <View>
      <ScrollView
        contentContainerStyle={styles.nav_container}
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setCategory(tab)}
            style={[styles.nav_box, category === tab && styles.nav_box_active]}
          >
            <Text
              style={[
                styles.nav_text,
                category === tab && styles.nav_text_active,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const EmptyState = ({
  message,
  tab,
}: {
  message: string;
  tab: "ongoing" | "scheduled" | "cancelled" | "completed";
}) => {
  const { setRideStatus, setPickupTime } = useRideContext();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{ justifyContent: "center", alignItems: "center", width: "90%" }}
      >
        {tab === "completed" ? (
          <Image
            source={require("../../../assets/images/icons/empty-complete-cab.png")}
            style={{
              width: 100,
              height: 100,
              marginBottom: 20,
              tintColor: "#fff",
            }}
          />
        ) : (
          <Image
            source={require("../../../assets/images/icons/empty-cab.png")}
            style={{
              width: 100,
              height: 100,
              marginBottom: 20,
              tintColor: "#fff",
            }}
          />
        )}

        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontFamily: "raleway-bold",
            textAlign: "center",
          }}
        >
          {message}
        </Text>
      </View>
      <View
        style={{
          position: "absolute",
          bottom: 10,
          alignItems: "center",
          flex: 1,
        }}
      >
        {tab === "scheduled" ? (
          <Pressable
            style={{
              backgroundColor: "#fff",
              width: 320,
              padding: 10,
              borderRadius: 20,
              marginTop: 10,
            }}
            onPress={() => {
              router.push("../(book)/ride");
              setRideStatus("booking");
              setPickupTime("later");
            }}
          >
            <Text style={{ fontFamily: "raleway-bold", textAlign: "center" }}>
              Schedule ride
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={{
              backgroundColor: "#fff",
              width: 320,
              padding: 10,
              borderRadius: 20,
              marginTop: 10,
            }}
            onPress={() => {
              router.push("../(book)/book_ride");
            }}
          >
            <Text style={{ fontFamily: "raleway-bold", textAlign: "center" }}>
              Book ride
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const OngoingRide = ({ data }: { data: any }) => {
  const { showNotification } = useNotificationContext();

  const {
    payForRide,
    cancelRideRequest,
    cancelling,
    ongoingRideData,
    retrying,
    retryRideRequest,
    setRideStatus,
    getActiveRide,
  } = useRideContext();
  const { region, mapRef } = useMapContext();

  const makeCall = async (phone: string) => {
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      showNotification("Could not place call", "error");
    }
  };

  const [paying, setPaying] = useState<boolean>(false);
  const pay_func = async () => {
    setPaying(true);
    try {
      await payForRide();
    } catch (error) {
      console.log(error);
    } finally {
      setPaying(false);
    }
  };

  const retry_ride = async () => {
    try {
      await retryRideRequest();
      router.push("../(book)/book_ride");
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  const cancel_ride = async () => {
    const reason = "No reason";
    const by = "rider";
    const ride_id = ongoingRideData?._id;

    try {
      ride_id && (await cancelRideRequest(ride_id, by, reason));
      if (region) mapRef.current.animateToRegion(region, 1000);
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  const track_ride = () => {
    router.push("../(book)/book_ride");
    setRideStatus("track_ride");
    setTimeout(() => {
      if (mapRef.current && ongoingRideData)
        mapRef.current.animateToRegion(
          {
            longitudeDelta: 0.02,
            latitudeDelta: 0.02,
            latitude: ongoingRideData.pickup.coordinates[0],
            longitude: ongoingRideData.pickup.coordinates[1],
          },
          1000
        );
    }, 1000);
  };

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getActiveRide();
    } catch (error) {
      console.log(error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.ride_card}>
        <View style={styles.ride_header}>
          <Text style={styles.ride_header_text}>
            {new Date(data.createdAt).toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </Text>
          {data.status === "expired" && (
            <View
              style={{
                backgroundColor: "#ff00003a",
                paddingVertical: 5,
                paddingHorizontal: 10,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: "#ff0000",
                  fontFamily: "raleway-bold",
                  fontSize: 10,
                }}
              >
                Expired
              </Text>
            </View>
          )}
          {data.scheduled_time && (
            <View
              style={{
                backgroundColor: "#ff9d003a",
                paddingVertical: 5,
                paddingHorizontal: 10,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: "#ff9d00",
                  fontFamily: "raleway-bold",
                  fontSize: 10,
                }}
              >
                Scheduled
              </Text>
            </View>
          )}
        </View>
        {data.scheduled_time && (
          <Text
            style={{
              color: "#fff",
              fontFamily: "poppins-regular",
              fontSize: 11,
              marginTop: 10,
            }}
          >
            **Ride scheduled for{" "}
            {new Date(data.scheduled_time).toLocaleString("en-US")}
          </Text>
        )}
        {/* Driver details */}
        {data.driver && (
          <>
            <DriverCard
              name={data.driver.user.name}
              profile_img={
                (ongoingRideData?.driver as any)?.profile_img
                  ? { uri: (ongoingRideData?.driver as any).profile_img }
                  : require("../../../assets/images/user.png")
              }
              id={data.driver._id}
              rating={data.driver.rating}
              total_trips={data.driver.total_trips}
              num_of_reviews={data.driver.num_of_reviews}
            />

            <View
              style={{
                marginTop: 10,
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Image
                source={vehicleIcons[data.driver.vehicle_type]}
                style={{ height: 50, width: 50 }}
              />
              <View>
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "raleway-bold",
                    fontSize: 12,
                    textTransform: "capitalize",
                    width: "100%",
                  }}
                >
                  {data.driver.vehicle_type} ride
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: 5,
                  }}
                >
                  <FontAwesome5
                    name="car"
                    size={14}
                    color="#c6c6c6"
                    style={{ marginTop: 3 }}
                  />
                  <Text
                    style={{
                      color: "#c6c6c6",
                      fontFamily: "raleway-semibold",
                      fontSize: 12,
                    }}
                  >
                    {data.driver.vehicle.color} {data.driver.vehicle.brand}{" "}
                    {data.driver.vehicle.model}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
        {/* Ride route */}

        <View style={{ marginTop: 10 }}>
          <RideRoute from={data.pickup.address} to={data.destination.address} />
        </View>

        {/* Pay */}
        {data.driver ? (
          data.payment_status === "paid" ? (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => makeCall(data.driver.user.phone)}
              >
                <View
                  style={[
                    styles.pay_btn,
                    {
                      backgroundColor: "transparent",
                      borderColor: "white",
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text style={[styles.pay_btn_text, { color: "#fff" }]}>
                    Call Driver &nbsp;&nbsp;
                    <FontAwesome5 name="phone-alt" color="#fff" size={14} />
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={track_ride}
                style={styles.pay_btn}
              >
                <Text style={styles.pay_btn_text}>Track</Text>
              </TouchableOpacity>
              <TouchableWithoutFeedback
                onPress={cancel_ride}
                disabled={cancelling}
              >
                <Text
                  style={{
                    color: cancelling ? "#ff000080" : "#ff0000",
                    fontFamily: "raleway-bold",
                    textAlign: "center",
                    marginTop: 15,
                  }}
                >
                  {cancelling ? "Cancelling..." : "Cancel ride"}
                </Text>
              </TouchableWithoutFeedback>
            </>
          ) : (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={pay_func}
                disabled={paying}
                style={styles.pay_btn}
              >
                <Text style={styles.pay_btn_text}>
                  {paying
                    ? "Paying..."
                    : `Pay ${data.fare.toLocaleString()} NGN`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={cancel_ride}
                disabled={cancelling}
                style={[
                  styles.pay_btn,
                  {
                    backgroundColor: "transparent",
                    borderColor: "white",
                    borderWidth: 1,
                    opacity: cancelling ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={[styles.pay_btn_text, { color: "#fff" }]}>
                  {cancelling ? "Cancelling..." : "Cancel ride"}
                </Text>
              </TouchableOpacity>
            </>
          )
        ) : data.status === "expired" ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={retry_ride}
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {retrying ? (
              <Text style={{ color: "#9e9d9d", fontFamily: "raleway-bold" }}>
                Retrying...
              </Text>
            ) : (
              <>
                <Text style={{ color: "#d2d2d2", fontFamily: "raleway-bold" }}>
                  Retry&nbsp;
                </Text>
                <FontAwesome6
                  name="rotate-right"
                  color="#fff"
                  size={10}
                  style={{ marginTop: 4 }}
                />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-regular",
                textAlign: "center",
              }}
            >
              Still searching for driver...
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={cancel_ride}
              disabled={cancelling}
            >
              <Text
                style={{
                  color: cancelling ? "#ff000080" : "#ff0000",
                  fontFamily: "raleway-bold",
                  textAlign: "center",
                  marginTop: 15,
                }}
              >
                {cancelling ? "Cancelling..." : "Cancel ride"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};
const ScheduledRides = ({ data }: { data: any }) => {
  const { showNotification } = useNotificationContext();

  const {
    cancelRideRequest,
    cancelling,
    ongoingRideData,
    setRideStatus,
    getActiveRide,
  } = useRideContext();
  const { region, mapRef } = useMapContext();

  const cancel_ride = async () => {
    const reason = "No reason";
    const by = "rider";
    const ride_id = ongoingRideData?._id;

    try {
      ride_id && (await cancelRideRequest(ride_id, by, reason));
      if (region) mapRef.current.animateToRegion(region, 1000);
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getActiveRide();
    } catch (error) {
      console.log(error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Banner that shows countdown to earliest scheduled ride
  const ScheduledBanner = ({ rides }: { rides: any[] }) => {
    // compute earliest future scheduled time once per rides change
    const earliest = React.useMemo(() => {
      if (!rides || rides.length === 0) return null;
      const future = rides
        .map((r) => (r.scheduled_time ? new Date(r.scheduled_time) : null))
        .filter((d) => d && d.getTime() > Date.now()) as Date[];
      if (future.length === 0) return null;
      return new Date(Math.min(...future.map((d) => d.getTime())));
    }, [rides]);

    const [countdown, setCountdown] = useState<string | null>(() => {
      if (!earliest) return null;
      const now = new Date();
      const diffMs = earliest.getTime() - now.getTime();
      if (diffMs <= 0) return "Due now";
      const diffSec = Math.floor(diffMs / 1000);
      const days = Math.floor(diffSec / 86400);
      const hours = Math.floor((diffSec % 86400) / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      const secs = diffSec % 60;
      if (days > 0) return `${days}d ${hours}h ${mins}m ${secs}s`;
      if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
      if (mins > 0) return `${mins}m ${secs}s`;
      return `${secs}s`;
    });

    useEffect(() => {
      if (!earliest) {
        setCountdown(null);
        return;
      }

      // update every second so seconds are shown live
      const update = () => {
        const now = new Date();
        const diffMs = earliest.getTime() - now.getTime();
        if (diffMs <= 0) {
          setCountdown("Due now");
          return;
        }
        const diffSec = Math.floor(diffMs / 1000);
        const days = Math.floor(diffSec / 86400);
        const hours = Math.floor((diffSec % 86400) / 3600);
        const mins = Math.floor((diffSec % 3600) / 60);
        const secs = diffSec % 60;
        if (days > 0) setCountdown(`${days}d ${hours}h ${mins}m ${secs}s`);
        else if (hours > 0) setCountdown(`${hours}h ${mins}m ${secs}s`);
        else if (mins > 0) setCountdown(`${mins}m ${secs}s`);
        else setCountdown(`${secs}s`);
      };

      // run immediately then every 1s; keep the component mounted
      update();
      const timer = setInterval(update, 1000);
      return () => clearInterval(timer);
    }, [earliest]);

    if (!countdown) return null;
    return (
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          Next scheduled ride in {countdown}
        </Text>
      </View>
    );
  };

  return (
    <>
      <ScheduledBanner rides={data} />
      <FlatList
        data={data}
        keyExtractor={(ride) => ride._id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item: ride }: any) => (
          <View>
            <View style={{ flex: 1 }}>
              <View style={styles.ride_card}>
                <View style={styles.ride_header}>
                  <Text style={styles.ride_header_text}>
                    {new Date(ride.createdAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  {ride.status === "expired" ? (
                    <View
                      style={{
                        backgroundColor: "#ff00003a",
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        borderRadius: 20,
                      }}
                    >
                      <Text
                        style={{
                          color: "#ff0000",
                          fontFamily: "raleway-bold",
                          fontSize: 10,
                        }}
                      >
                        Expired
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={{
                        backgroundColor: "#ff9d003a",
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        borderRadius: 20,
                      }}
                    >
                      <Text
                        style={{
                          color: "#ff9d00",
                          fontFamily: "raleway-bold",
                          fontSize: 10,
                        }}
                      >
                        Scheduled
                      </Text>
                    </View>
                  )}
                </View>
                {ride.scheduled_time && (
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "poppins-regular",
                      fontSize: 11,
                      marginTop: 10,
                    }}
                  >
                    **Ride scheduled for{" "}
                    {new Date(ride.scheduled_time).toLocaleString("en-US")}
                  </Text>
                )}
                {/* Driver details */}
                {ride.driver && (
                  <>
                    <DriverCard
                      name={ride.driver.user.name}
                      profile_img={
                        (ongoingRideData?.driver as any)?.profile_img
                          ? {
                              uri: (ongoingRideData?.driver as any).profile_img,
                            }
                          : require("../../../assets/images/user.png")
                      }
                      id={ride.driver._id}
                      rating={ride.driver.rating}
                      total_trips={ride.driver.total_trips}
                      num_of_reviews={ride.driver.num_of_reviews}
                    />

                    <View
                      style={{
                        marginTop: 10,
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Image
                        source={vehicleIcons[ride.driver.vehicle_type]}
                        style={{ height: 50, width: 50 }}
                      />
                      <View>
                        <Text
                          style={{
                            color: "#fff",
                            fontFamily: "raleway-bold",
                            fontSize: 12,
                            textTransform: "capitalize",
                            width: "100%",
                          }}
                        >
                          {ride.driver.vehicle_type} ride
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            gap: 5,
                          }}
                        >
                          <FontAwesome5
                            name="car"
                            size={14}
                            color="#c6c6c6"
                            style={{ marginTop: 3 }}
                          />
                          <Text
                            style={{
                              color: "#c6c6c6",
                              fontFamily: "raleway-semibold",
                              fontSize: 12,
                            }}
                          >
                            {ride.driver.vehicle.color}{" "}
                            {ride.driver.vehicle.brand}{" "}
                            {ride.driver.vehicle.model}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </>
                )}
                {/* Ride route */}

                <View style={{ marginTop: 10 }}>
                  <RideRoute
                    from={ride.pickup.address}
                    to={ride.destination.address}
                  />
                </View>

                {ride.status === "expired" ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={cancel_ride}
                    disabled={cancelling}
                  >
                    <Text
                      style={{
                        color: cancelling ? "#c1c1c180" : "#c1c1c1",
                        fontFamily: "raleway-bold",
                        textAlign: "center",
                        marginTop: 15,
                      }}
                    >
                      {cancelling ? "Deleting..." : "Delete this ride"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={cancel_ride}
                    disabled={cancelling}
                  >
                    <Text
                      style={{
                        color: cancelling ? "#ff000080" : "#ff0000",
                        fontFamily: "raleway-bold",
                        textAlign: "center",
                        marginTop: 15,
                      }}
                    >
                      {cancelling ? "Cancelling..." : "Cancel this ride"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      />
    </>
  );
};

const CompletedRides = ({ data }: { data: any }) => {
  const { getUserCompletedRides } = useRideContext();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getUserCompletedRides();
    } catch (error) {
      console.log(error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={data}
        keyExtractor={(ride) => ride._id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item: ride }: any) => (
          <View>
            <View style={styles.ride_card}>
              <View
                style={{
                  backgroundColor: "#4cd90635",
                  marginBottom: 15,
                  alignSelf: "flex-start",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 15,
                }}
              >
                <Text
                  style={{
                    color: "#4cd906ff",
                    fontFamily: "raleway-bold",
                    fontSize: 10,
                  }}
                >
                  Completed
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  gap: 12,
                }}
              >
                <Image
                  source={vehicleIcons[ride.driver.vehicle_type]}
                  style={{ width: 30, height: 30 }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    flex: 1,
                    paddingBottom: 10,
                  }}
                >
                  <View style={{ width: 200, paddingHorizontal: 10 }}>
                    <Text
                      style={{
                        fontFamily: "raleway-bold",
                        color: "#fff",
                        flexShrink: 1,
                      }}
                    >
                      {ride.destination.address}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "raleway-semibold",
                        color: "grey",
                        fontSize: 11,
                      }}
                    >
                      {new Date(ride.createdAt).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                  <View>
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: "poppins-bold",
                        fontSize: 12,
                      }}
                    >
                      {ride.fare.toLocaleString() ?? ""} NGN
                    </Text>
                    <Text
                      style={{
                        fontFamily: "raleway-semibold",
                        color: "grey",
                        fontSize: 11,
                        textTransform: "capitalize",
                      }}
                    >
                      {ride.payment_method}
                    </Text>
                  </View>
                </View>
              </View>
              {/* Ride route */}
              <RideRoute
                from={ride.pickup.address}
                to={ride.destination.address}
              />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push(`./rides/ride_detail/${ride._id}`)}
                style={styles.pay_btn}
              >
                <Text style={styles.pay_btn_text}>View ride details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const CancelledRides = ({ data }: { data: any }) => {
  const { rebookRideRequest, getUserCancelledRides } = useRideContext();
  const [rebookingId, setRebookingId] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getUserCancelledRides();
    } catch (error) {
      console.log(error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const rebook_ride = async (ride_id: string) => {
    setRebookingId(ride_id);
    try {
      await rebookRideRequest(ride_id);
      router.push("../(book)/book_ride");
    } catch (error: any) {
      console.log(error.message);
    } finally {
      setRebookingId(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={data}
        keyExtractor={(ride) => ride._id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item: ride }) => (
          <View style={styles.ride_card}>
            <View
              style={{
                backgroundColor: "#ff000035",
                marginBottom: 10,
                alignSelf: "flex-start",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 15,
              }}
            >
              <Text
                style={{
                  color: "#ff0000",
                  fontFamily: "raleway-bold",
                  fontSize: 10,
                }}
              >
                Cancelled
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-start",
                gap: 12,
              }}
            >
              <Image
                source={require("../../../assets/images/icons/sedan-icon.png")}
                style={{ width: 30, height: 30 }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 10,
                  flex: 1,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push(`./rides/ride_detail/${ride._id}`)}
                  style={{ width: "65%" }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: "raleway-bold",
                      color: "#fff",
                    }}
                  >
                    {ride.destination.address}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "raleway-semibold",
                      color: "grey",
                      fontSize: 11,
                    }}
                  >
                    {new Date(ride.createdAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => rebook_ride(ride._id)}
                  disabled={rebookingId === ride._id}
                  style={{
                    backgroundColor: "#fff",
                    paddingHorizontal: 10,
                    height: 30,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: rebookingId === ride._id ? 0.5 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: "#121212",
                      fontFamily: "raleway-semibold",
                      fontSize: 12,
                      marginBottom: 3,
                    }}
                  >
                    {rebookingId === ride._id ? "Rebooking..." : "Rebook"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default Rides;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header_text: {
    color: "#fff",
    marginTop: 10,
    fontFamily: "raleway-bold",
    fontSize: 30,
  },
  nav_container: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginVertical: 12,
  },
  nav_box: {
    backgroundColor: "grey",
    zIndex: 500,
    paddingVertical: 7,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderRadius: 20,
    marginRight: 16,
  },
  nav_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  nav_box_active: {
    backgroundColor: "#fff",
  },
  nav_text_active: {
    color: "#121212",
  },

  ride_card: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#4b4b4bff",
    width: "100%",
    borderRadius: 10,
    marginBottom: 30,
    padding: 15,
  },
  ride_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ride_header_text: {
    fontFamily: "poppins-bold",
    color: "#fff",
    fontSize: 12,
  },
  info_sec: {
    backgroundColor: "#363636",
    marginTop: 20,
    borderRadius: 5,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  driver_sec: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 10,
  },
  driver_img: {
    width: 25,
    height: 25,
    borderRadius: 15,
  },
  driver_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  amount_text: {
    fontFamily: "poppins-bold",
    color: "#5ffd7f",
  },
  banner: {
    backgroundColor: "#3f3f3fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
    alignSelf: "stretch",
  },
  bannerText: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    textAlign: "center",
  },
  pay_btn: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 10,
    marginTop: 15,
  },
  pay_btn_text: {
    color: "#121212",
    fontFamily: "poppins-bold",
    textAlign: "center",
  },
});

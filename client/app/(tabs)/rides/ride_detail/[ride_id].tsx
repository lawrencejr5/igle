import {
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";

import React, { useState, useEffect, FC } from "react";

import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import AppLoading from "../../../../loadings/AppLoading";

import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { darkMapStyle } from "../../../../data/map.dark";

import { router, useLocalSearchParams } from "expo-router";
import RideRoute from "../../../../components/RideRoute";
import DriverCard from "../../../../components/DriverCard";
import ReportDriverModal from "../../../../components/ReportDriverModal";
import { useMapContext } from "../../../../context/MapContext";
import { useRideContext } from "../../../../context/RideContext";
import { formatRelativeTime } from "../../../../context/DeliveryContext";
import { useLoading } from "../../../../context/LoadingContext";

import { useNotificationContext } from "../../../../context/NotificationContext";

const RideDetails = () => {
  const { mapRef } = useMapContext();
  const { rideData, fetchRideDetails } = useRideContext();
  const { rideDetailsLoading } = useLoading();
  const { notification } = useNotificationContext();

  const [reportModalOpen, setReportModalOpen] = useState(false);

  const { ride_id } = useLocalSearchParams();

  useEffect(() => {
    fetchRideDetails(ride_id as string);
  }, [ride_id]);

  useEffect(() => {
    if (rideData?.destination?.coordinates && mapRef.current)
      mapRef.current.animateToRegion(
        {
          latitude: rideData.destination.coordinates[0],
          longitude: rideData.destination.coordinates[1],
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        1000,
      );
  }, [rideData]);

  return (
    <>
      {rideDetailsLoading || !rideData ? (
        <AppLoading />
      ) : (
        <>
          <View
            style={{
              flex: 1,
              backgroundColor: "#121212",
            }}
          >
            {/* Back btn */}
            <TouchableWithoutFeedback
              onPress={() => router.replace("/(tabs)/rides")}
            >
              <View
                style={{
                  backgroundColor: "#121212",
                  gap: 20,
                  position: "absolute",
                  zIndex: 1,
                  padding: 10,
                  borderRadius: 7,
                  marginTop: 50,
                  marginHorizontal: 20,
                }}
              >
                <AntDesign name="arrowleft" size={24} color="#fff" />
              </View>
            </TouchableWithoutFeedback>

            {/* Map */}
            <MapView
              ref={mapRef}
              style={{ height: "33%" }}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: rideData.destination.coordinates[0],
                longitude: rideData.destination.coordinates[1],
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              customMapStyle={darkMapStyle}
            >
              <Marker
                coordinate={{
                  latitude: rideData.destination.coordinates[0],
                  longitude: rideData.destination.coordinates[1],
                }}
                title={rideData.destination.address}
              >
                <View
                  style={{
                    backgroundColor: "white",
                    padding: 5,
                    borderRadius: 50,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "black",
                      padding: 5,
                      borderRadius: 50,
                    }}
                  />
                </View>
              </Marker>
            </MapView>

            {/* Ride details */}
            <ScrollView
              style={{
                marginTop: 20,
                paddingHorizontal: 20,
                paddingTop: 20,
                position: "absolute",
                bottom: 0,
                width: "100%",
                height: "68%",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                backgroundColor: "#121212",
              }}
            >
              <View style={{ marginBottom: 50 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={require("../../../../assets/images/icons/sedan-icon.png")}
                    style={{ width: 50, height: 50 }}
                  />
                  <View>
                    <Text
                      style={{
                        fontFamily: "raleway-semibold",
                        color: "#c6c5c5",
                        fontSize: 20,
                        textAlign: "right",
                      }}
                    >
                      {!rideData.driver
                        ? "Cancelled ride"
                        : `Igle ride with ${
                            rideData.driver.user.name.split(" ")[0]
                          }`}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "raleway-regular",
                        color: "#c6c5c5",
                        fontSize: 12,
                        textAlign: "right",
                      }}
                    >
                      {new Intl.DateTimeFormat("en-US", {
                        weekday: "short", // Thur
                        day: "numeric", // 18
                        month: "long", // August
                        year: "numeric", // 2025
                        hour: "numeric", // 5
                        minute: "2-digit", // 18
                        hour12: true, // PM
                      }).format(new Date(rideData?.createdAt || Date.now()))}
                    </Text>
                  </View>
                </View>

                {/* Ride details section */}
                <View
                  style={{
                    marginTop: 20,
                    paddingTop: 20,
                    borderColor: "#c3c3c3ff",
                    borderTopWidth: 0.5,
                    borderStyle: "solid",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: "raleway-semibold",
                        fontSize: 22,
                      }}
                    >
                      Ride details
                    </Text>
                    {rideData.status === "cancelled" ? (
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
                    ) : (
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
                    )}
                  </View>
                  <View>
                    <RideRoute
                      from={rideData.pickup.address}
                      to={rideData.destination.address}
                    />
                  </View>
                </View>

                {/* Fare */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "raleway-regular",
                      fontSize: 18,
                    }}
                  >
                    Total Fare:
                  </Text>
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "poppins-bold",
                      fontSize: 20,
                    }}
                  >
                    NGN {rideData.fare.toLocaleString()}
                  </Text>
                </View>

                {/* Driver section */}
                <View
                  style={{
                    marginTop: 20,
                    paddingTop: 20,
                    borderColor: "#c3c3c3ff",
                    borderTopWidth: 0.5,
                  }}
                >
                  {/* Header */}
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "raleway-semibold",
                      fontSize: 22,
                    }}
                  >
                    Driver Details
                  </Text>

                  {/* Driver card */}
                  {rideData.driver ? (
                    <DriverCard
                      name={rideData.driver.user.name}
                      profile_img={
                        (rideData?.driver as any)?.profile_img
                          ? { uri: (rideData?.driver as any).profile_img }
                          : require("../../../../assets/images/user.png")
                      }
                      id={rideData.driver._id}
                      rating={rideData.driver.rating}
                      total_trips={rideData.driver.total_trips}
                      num_of_reviews={rideData.driver.num_of_reviews}
                    />
                  ) : (
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 16,
                        fontFamily: "raleway-regular",
                        marginTop: 15,
                      }}
                    >
                      No driver was assigned to you
                    </Text>
                  )}
                  {rideData.driver && (
                    <>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setReportModalOpen(true)}
                        style={{ marginTop: 20, alignItems: "center" }}
                      >
                        <Text
                          style={{
                            fontFamily: "raleway-semibold",
                            color: "#ff4444",
                            fontSize: 14,
                          }}
                        >
                          Report driver
                        </Text>
                      </TouchableOpacity>

                      <ReportDriverModal
                        visible={reportModalOpen}
                        onClose={() => setReportModalOpen(false)}
                        driverId={rideData.driver._id}
                        rideId={rideData._id}
                      />
                    </>
                  )}
                </View>

                {/* Timeline */}
                <View
                  style={{
                    width: "100%",
                    marginTop: 20,
                    paddingTop: 20,
                    borderColor: "#c3c3c3ff",
                    borderTopWidth: 0.5,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "raleway-semibold",
                      fontSize: 22,
                    }}
                  >
                    Timeline
                  </Text>

                  {(() => {
                    const t = (rideData as any)?.timestamps || {};
                    const steps: Array<{
                      key: string;
                      title: string;
                      ts?: any;
                      icon: keyof typeof Feather.glyphMap;
                      color: string;
                    }> = [
                      {
                        key: "created",
                        title: "Created",
                        ts: rideData?.createdAt,
                        icon: "calendar",
                        color: "#9CA3AF",
                      },
                    ];
                    if (t.accepted_at)
                      steps.push({
                        key: "accepted",
                        title: "Accepted",
                        ts: t.accepted_at,
                        icon: "check-circle",
                        color: "#60A5FA",
                      });
                    if (t.arrived_at)
                      steps.push({
                        key: "arrived",
                        title: "Arrived",
                        ts: t.arrived_at,
                        icon: "map-pin",
                        color: "#F59E0B",
                      });
                    if (t.started_at)
                      steps.push({
                        key: "started",
                        title: "Started",
                        ts: t.started_at,
                        icon: "navigation",
                        color: "#A78BFA",
                      });
                    if (t.completed_at)
                      steps.push({
                        key: "completed",
                        title: "Completed",
                        ts: t.completed_at,
                        icon: "check-circle",
                        color: "#10B981",
                      });
                    if (t.cancelled_at)
                      steps.push({
                        key: "cancelled",
                        title: "Cancelled",
                        ts: t.cancelled_at,
                        icon: "x-circle",
                        color: "#EF4444",
                      });

                    return (
                      <View style={{ marginTop: 20 }}>
                        {steps.map((s, i) => (
                          <TimelineItem
                            key={s.key}
                            title={s.title}
                            timestamp={s.ts}
                            icon={s.icon}
                            color={s.color}
                            isLast={i === steps.length - 1}
                          />
                        ))}
                      </View>
                    );
                  })()}

                  <View style={{ height: 4 }} />
                </View>
              </View>
            </ScrollView>
          </View>
        </>
      )}
    </>
  );
};

// Removed old dashed-thread Timeline components in favor of compact icon-based design

export default RideDetails;

// Compact, icon-based timeline item (same design as Delivery timeline)
const TimelineItem = ({
  title,
  timestamp,
  icon,
  color,
  isLast,
}: {
  title: string;
  timestamp?: string | Date | null;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  isLast?: boolean;
}) => {
  const absolute = timestamp
    ? new Date(timestamp as any).toLocaleString()
    : "—";
  const relative = timestamp ? formatRelativeTime(timestamp as any) : "";

  return (
    <View style={{ flexDirection: "row", marginBottom: 10 }}>
      {/* left rail */}
      <View style={{ width: 26, alignItems: "center" }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: "#1f1f1f",
            borderWidth: 1,
            borderColor: color,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name={icon} size={12} color={color} />
        </View>
        {!isLast && (
          <View
            style={{
              width: 1,
              flex: 1,
              backgroundColor: "#2a2a2a",
              marginTop: 4,
              marginBottom: -4,
            }}
          />
        )}
      </View>

      {/* content card */}
      <View
        style={{
          flex: 1,
          backgroundColor: "#1a1a1a",
          borderRadius: 10,
          paddingVertical: 8,
          paddingHorizontal: 10,
          borderWidth: 1,
          borderColor: "#2a2a2a",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontFamily: "raleway-semibold",
            fontSize: 12,
          }}
        >
          {title}
        </Text>
        {relative ? (
          <Text
            style={{
              color: "#b0b0b0",
              fontFamily: "poppins-regular",
              fontSize: 10,
              marginTop: 1,
            }}
          >
            {relative}
          </Text>
        ) : null}
        <Text
          style={{
            color: "#cfcfcf",
            fontFamily: "poppins-regular",
            fontSize: 10,
            marginTop: 1,
          }}
        >
          {absolute}
        </Text>
      </View>
    </View>
  );
};

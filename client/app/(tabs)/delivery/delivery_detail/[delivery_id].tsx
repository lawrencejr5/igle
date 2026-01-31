import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Image } from "expo-image";

import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { router, useLocalSearchParams } from "expo-router";

import AppLoading from "../../../../loadings/AppLoading";

import { useLoading } from "../../../../context/LoadingContext";
import { useMapContext } from "../../../../context/MapContext";
import {
  useDeliverContext,
  formatRelativeTime,
  getPackageIcon,
  getVehicleIcon,
} from "../../../../context/DeliveryContext";
import { darkMapStyle } from "../../../../data/map.dark";
import RideRoute from "../../../../components/RideRoute";
import ReportDriverModal from "../../../../components/ReportDriverModal";

const DeliveryDetails = () => {
  const { mapRef } = useMapContext() as any;
  const { deliveryDetailsLoading } = useLoading() as any; // optional loading flag if available
  const { fetchDeliveryData, ongoingDeliveryData } = useDeliverContext();

  const [reportModalOpen, setReportModalOpen] = useState(false);

  const { delivery_id } = useLocalSearchParams();

  useEffect(() => {
    if (delivery_id) fetchDeliveryData(delivery_id as string);
  }, [delivery_id]);

  useEffect(() => {
    const drop = ongoingDeliveryData?.dropoff?.coordinates;
    if (drop && mapRef?.current) {
      mapRef.current.animateToRegion(
        {
          latitude: drop[0],
          longitude: drop[1],
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        1000,
      );
    }
  }, [ongoingDeliveryData]);

  const d = ongoingDeliveryData;
  const loading = !d || deliveryDetailsLoading;

  const statusBadge = () => {
    const s = d?.status;
    if (s === "cancelled")
      return (
        <View
          style={{
            backgroundColor: "#ff000035",
            marginBottom: 15,
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
      );
    if (s === "delivered")
      return (
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
      );
    return null;
  };

  return (
    <>
      {loading ? (
        <AppLoading />
      ) : (
        <>
          <View style={{ flex: 1, backgroundColor: "#121212" }}>
            {/* Back btn */}
            <TouchableWithoutFeedback
              onPress={() => router.replace("/(tabs)/delivery")}
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
                latitude: d?.dropoff?.coordinates?.[0] ?? 6.5244,
                longitude: d?.dropoff?.coordinates?.[1] ?? 3.3792,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              customMapStyle={darkMapStyle}
            >
              {d?.dropoff?.coordinates && (
                <Marker
                  coordinate={{
                    latitude: d.dropoff.coordinates[0],
                    longitude: d.dropoff.coordinates[1],
                  }}
                  title={d.dropoff.address}
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
              )}
            </MapView>

            {/* Delivery details */}
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
                {/* Header summary */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={require("../../../../assets/images/icons/van-icon.png")}
                    style={{ width: 44, height: 44 }}
                  />
                  <View>
                    <Text
                      style={{
                        fontFamily: "raleway-semibold",
                        color: "#c6c5c5",
                        fontSize: 18,
                        textAlign: "right",
                      }}
                    >
                      {!d?.driver
                        ? "Delivery"
                        : `Igle delivery with ${
                            d.driver.user.name.split(" ")[0]
                          }`}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "raleway-regular",
                        color: "#a8a8a8",
                        fontSize: 11,
                        textAlign: "right",
                      }}
                    >
                      {new Intl.DateTimeFormat("en-US", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      }).format(new Date(d?.createdAt || Date.now()))}
                    </Text>
                  </View>
                </View>

                {/* Delivery summary card */}
                <View
                  style={{
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "#4b4b4bff",
                    width: "100%",
                    borderRadius: 16,
                    marginTop: 16,
                    padding: 16,
                    backgroundColor: "#1e1e1e",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: "raleway-semibold",
                        fontSize: 16,
                      }}
                    >
                      Delivery details
                    </Text>
                    {statusBadge()}
                  </View>
                  <RideRoute
                    from={d?.pickup?.address || "Pickup location"}
                    to={d?.dropoff?.address || "Drop-off location"}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          color: "#888",
                          fontFamily: "raleway-regular",
                          fontSize: 11,
                        }}
                      >
                        Total Fare
                      </Text>
                      <Text
                        style={{
                          color: "#fff",
                          fontFamily: "poppins-bold",
                          fontSize: 18,
                        }}
                      >
                        NGN {d?.fare?.toLocaleString?.()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* What & Recipient card */}
                <View
                  style={{
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "#4b4b4bff",
                    width: "100%",
                    borderRadius: 16,
                    marginTop: 12,
                    padding: 12,
                    backgroundColor: "#1e1e1e",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      backgroundColor: "#2a2a2a",
                      borderRadius: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <Text style={{ fontSize: 22, marginRight: 10 }}>
                        {getPackageIcon(d?.package?.type)}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            color: "#fff",
                            fontFamily: "raleway-semibold",
                            fontSize: 14,
                          }}
                        >
                          {d?.package?.description || "Package"}
                        </Text>
                        {d?.package?.fragile && (
                          <Text
                            style={{
                              color: "#ffaa00",
                              fontFamily: "raleway-regular",
                              fontSize: 12,
                            }}
                          >
                            ⚠️ Fragile
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          color: "#888",
                          fontFamily: "raleway-regular",
                          fontSize: 12,
                        }}
                      >
                        To:
                      </Text>
                      <Text
                        style={{
                          color: "#fff",
                          fontFamily: "raleway-semibold",
                          fontSize: 14,
                        }}
                      >
                        {d?.to?.name || "Recipient"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Driver card (styled like list card) */}
                <View
                  style={{
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "#4b4b4bff",
                    width: "100%",
                    borderRadius: 16,
                    marginTop: 12,
                    padding: 12,
                    backgroundColor: "#1e1e1e",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "raleway-semibold",
                      fontSize: 16,
                      marginBottom: 8,
                    }}
                  >
                    Driver
                  </Text>
                  {d?.driver ? (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        backgroundColor: "#2a2a2a",
                        borderRadius: 12,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: "#007AFF",
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 12,
                            overflow: "hidden",
                          }}
                        >
                          <Image
                            source={
                              (d.driver as any)?.user?.profile_img
                                ? { uri: (d.driver as any).user.profile_img }
                                : require("../../../../assets/images/user.png")
                            }
                            style={{ width: 40, height: 40 }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: "#fff",
                              fontFamily: "raleway-semibold",
                              fontSize: 14,
                              marginBottom: 2,
                            }}
                          >
                            {d.driver.user.name}
                          </Text>
                          <Text
                            style={{
                              color: "#888",
                              fontFamily: "raleway-regular",
                              fontSize: 12,
                            }}
                          >
                            {getVehicleIcon(d?.vehicle)}{" "}
                            {d?.driver?.vehicle?.brand}{" "}
                            {d?.driver?.vehicle?.model}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text style={{ fontSize: 14, marginRight: 4 }}>⭐</Text>
                        <Text
                          style={{
                            color: "#fff",
                            fontFamily: "poppins-medium",
                            fontSize: 14,
                          }}
                        >
                          {d.driver?.rating?.toFixed?.(1) || "4.5"}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text
                      style={{
                        color: "#cfcfcf",
                        fontSize: 13,
                        fontFamily: "raleway-regular",
                        marginTop: 6,
                      }}
                    >
                      No dispatch rider was assigned
                    </Text>
                  )}

                  {d?.driver && (
                    <>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setReportModalOpen(true)}
                        style={{ marginTop: 12, alignItems: "center" }}
                      >
                        <Text
                          style={{
                            fontFamily: "raleway-semibold",
                            color: "#ff6b6b",
                            fontSize: 13,
                          }}
                        >
                          Report dispatch rider
                        </Text>
                      </TouchableOpacity>

                      <ReportDriverModal
                        visible={reportModalOpen}
                        onClose={() => setReportModalOpen(false)}
                        driverId={d.driver._id}
                        rideId={undefined}
                      />
                    </>
                  )}
                </View>

                {/* Timeline (compact) */}
                <View
                  style={{
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "#4b4b4bff",
                    width: "100%",
                    borderRadius: 16,
                    marginTop: 12,
                    padding: 12,
                    backgroundColor: "#1e1e1e",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: "raleway-semibold",
                      fontSize: 16,
                      marginBottom: 8,
                    }}
                  >
                    Timeline
                  </Text>

                  {(() => {
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
                        ts: d?.createdAt,
                        icon: "calendar",
                        color: "#9CA3AF",
                      },
                    ];
                    if (d?.timestamps?.accepted_at) {
                      steps.push({
                        key: "accepted",
                        title: "Accepted",
                        ts: d.timestamps.accepted_at,
                        icon: "check-circle",
                        color: "#60A5FA",
                      });
                    }
                    if (d?.timestamps?.picked_up_at) {
                      steps.push({
                        key: "picked_up",
                        title: "Picked up",
                        ts: d.timestamps.picked_up_at,
                        icon: "package",
                        color: "#F59E0B",
                      });
                    }
                    if (d?.timestamps?.delivered_at) {
                      steps.push({
                        key: "delivered",
                        title: "Delivered",
                        ts: d.timestamps.delivered_at,
                        icon: "check-circle",
                        color: "#10B981",
                      });
                    }
                    if (d?.timestamps?.cancelled_at) {
                      steps.push({
                        key: "cancelled",
                        title: "Cancelled",
                        ts: d.timestamps.cancelled_at,
                        icon: "x-circle",
                        color: "#EF4444",
                      });
                    }

                    return (
                      <View>
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

export default DeliveryDetails;

import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import React, { useState, useEffect } from "react";
import AppLoading from "../../../loadings/AppLoading";
import { useLoading } from "../../../context/LoadingContext";
import Notification from "../../../components/Notification";
import { useNotificationContext } from "../../../context/NotificationContext";
import { useDeliverContext } from "../../../context/DeliveryContext";

const DeliveryRoot = () => {
  const { appLoading } = useLoading();
  const { notification } = useNotificationContext();
  const {
    ongoingDeliveryData,
    ongoingDeliveries,
    cancelledDeliveries,
    deliveredDeliveries,
    userDeliveries,
    fetchUserOngoingDeliveries,
    fetchCancelledDeliveries,
    fetchDeliveredDeliveries,
  } = useDeliverContext();

  const [category, setCategory] = useState<
    "in_transit" | "delivered" | "cancelled"
  >("in_transit");

  // Fetch data based on category
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (category === "in_transit") {
          await fetchUserOngoingDeliveries();
        } else if (category === "delivered") {
          await fetchDeliveredDeliveries();
        } else if (category === "cancelled") {
          await fetchCancelledDeliveries();
        }
      } catch (error) {
        console.log("Failed to fetch deliveries:", error);
      }
    };

    fetchData();
  }, [category]);

  return (
    <>
      {appLoading ? (
        <AppLoading />
      ) : (
        <>
          {notification.visible && <Notification notification={notification} />}

          <View style={styles.container}>
            <Text style={styles.header_text}>Deliveries</Text>

            <CategoryTabs
              category={category}
              setCategory={setCategory}
              cancelledDeliveries={cancelledDeliveries}
            />

            {/* Content based on category */}
            {category === "in_transit" &&
              (ongoingDeliveries && ongoingDeliveries.length > 0 ? (
                <InTransitDeliveries data={ongoingDeliveries} />
              ) : (
                <EmptyState
                  message="You don't have any deliveries in transit currently"
                  tab="in_transit"
                />
              ))}

            {category === "delivered" &&
              (deliveredDeliveries && deliveredDeliveries.length > 0 ? (
                <DeliveredDeliveries data={deliveredDeliveries} />
              ) : (
                <EmptyState
                  message="You don't have any delivered packages yet"
                  tab="delivered"
                />
              ))}

            {category === "cancelled" &&
              (cancelledDeliveries && cancelledDeliveries.length > 0 ? (
                <CancelledDeliveries data={cancelledDeliveries} />
              ) : (
                <EmptyState
                  message="You don't have any cancelled deliveries"
                  tab="cancelled"
                />
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
  cancelledDeliveries,
}: {
  category: "in_transit" | "delivered" | "cancelled";
  setCategory: (cat: "in_transit" | "delivered" | "cancelled") => void;
  cancelledDeliveries: any;
}) => {
  // Always show in_transit and delivered
  const baseTabs: Array<"in_transit" | "delivered" | "cancelled"> = [
    "in_transit",
    "delivered",
  ];

  // Conditionally add cancelled tab
  const conditionalTabs: Array<"cancelled"> = [];

  if (cancelledDeliveries && cancelledDeliveries.length > 0) {
    conditionalTabs.push("cancelled");
  }

  // Combine base tabs with conditional tabs
  const tabs = [...baseTabs, ...conditionalTabs];

  // If current category is not in available tabs, switch to in_transit
  React.useEffect(() => {
    if (!tabs.includes(category)) {
      setCategory("in_transit");
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
              {tab === "in_transit"
                ? "In Transit"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
  tab: "in_transit" | "cancelled" | "delivered";
}) => {
  const { setDeliveryStatus } = useDeliverContext();

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
        {tab === "delivered" ? (
          <Image
            source={require("../../../assets/images/icons/empty-delivered.png")}
            style={{
              width: 100,
              height: 100,
              marginBottom: 20,
              tintColor: "#fff",
            }}
          />
        ) : (
          <Image
            source={require("../../../assets/images/icons/empty-delivery.png")}
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
        <Pressable
          style={{
            backgroundColor: "#fff",
            width: 320,
            padding: 10,
            borderRadius: 20,
            marginTop: 10,
          }}
          onPress={() => {
            setDeliveryStatus("details");
          }}
        >
          <Text
            style={{
              color: "#121212",
              fontFamily: "poppins-bold",
              textAlign: "center",
            }}
          >
            Send a package
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const InTransitDeliveries = ({ data }: { data: any[] }) => {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: "#fff", textAlign: "center", marginTop: 50 }}>
        In transit deliveries will be shown here ({data.length} deliveries)
      </Text>
    </View>
  );
};

const DeliveredDeliveries = ({ data }: { data: any[] }) => {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: "#fff", textAlign: "center", marginTop: 50 }}>
        Delivered deliveries will be shown here ({data.length} deliveries)
      </Text>
    </View>
  );
};

const CancelledDeliveries = ({ data }: { data: any[] }) => {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: "#fff", textAlign: "center", marginTop: 50 }}>
        Cancelled deliveries will be shown here ({data.length} deliveries)
      </Text>
    </View>
  );
};

export default DeliveryRoot;

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
  delivery_card: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#4b4b4bff",
    width: "100%",
    borderRadius: 10,
    marginBottom: 30,
    padding: 15,
  },
  delivery_header_text: {
    fontFamily: "poppins-bold",
    color: "#fff",
    fontSize: 12,
  },
});

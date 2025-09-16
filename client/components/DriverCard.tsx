import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useState,
} from "react";

import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";

import { useDriverAuthContext } from "../context/DriverAuthContext";

import * as Linking from "expo-linking";

const DriverCard: FC<{
  name: string;
  id: string;
  rating: number;
  total_trips: number;
  num_of_reviews: number;
}> = ({ name, id, rating, total_trips, num_of_reviews }) => {
  const [openModal, setOpenModal] = useState(false);

  return (
    <>
      <Pressable
        style={{
          marginTop: 20,
          backgroundColor: "#393939",
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderRadius: 10,
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: 10,
        }}
        onPress={() => setOpenModal(true)}
      >
        {/* Driver image */}
        <Image
          source={require("../assets/images/black-profile.jpeg")}
          style={{ height: 50, width: 50, borderRadius: 25 }}
        />

        {/* Driver details */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flex: 1,
          }}
        >
          {/* Driver name and ride */}
          <View>
            {/* Driver name and verified icon */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Text style={{ color: "#fff", fontFamily: "raleway-semibold" }}>
                {name}
              </Text>
              <Image
                source={require("../assets/images/icons/verify-icon.png")}
                style={{ height: 18, width: 18 }}
              />
            </View>

            {/* Driver ride */}
            <Text
              style={{
                color: "#d0d0d0",
                fontFamily: "raleway-regular",
                fontSize: 12,
                marginTop: 5,
              }}
            >
              {total_trips || "No"} ride(s) completed
            </Text>
          </View>

          {/* Ratings and reviews */}
          <View style={{ alignItems: "flex-end" }}>
            {/* Rating */}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "poppins-regular",
                }}
              >
                {rating || 5}
              </Text>
              <Image
                source={require("../assets/images/icons/star-icon.png")}
                style={{ height: 12, width: 12, marginBottom: 5 }}
              />
            </View>
            {/* Reviews */}
            <Text
              style={{
                color: "#d0d0d0",
                fontFamily: "raleway-regular",
                fontSize: 12,
              }}
            >
              {num_of_reviews || "No"} reviews
            </Text>
          </View>
        </View>
      </Pressable>
      <DriverDetailsModal open={openModal} setOpen={setOpenModal} id={id} />
    </>
  );
};

export const DriverDetailsModal: FC<{
  id: string;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}> = ({ id, open, setOpen }) => {
  const { driverData, gettingDriverData, getDriverData } =
    useDriverAuthContext();

  useEffect(() => {
    (async () => await getDriverData(id))();
  }, [id, open]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={() => setOpen(false)}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
        onPress={() => setOpen(false)}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#121212",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 10,
            borderTopWidth: 1,
          }}
        >
          <View
            style={{
              width: 40,
              height: 5,
              borderRadius: 5,
              backgroundColor: "#919191",
              alignSelf: "center",
            }}
          />

          {gettingDriverData || !driverData ? (
            <View
              style={{
                height: 200,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator color={"#fff"} size={"large"} />
            </View>
          ) : (
            <>
              <View style={{ marginTop: 10 }}>
                <Image
                  source={require("../assets/images/black-profile.jpeg")}
                  style={{
                    height: 100,
                    width: 100,
                    borderRadius: 50,
                    alignSelf: "center",
                  }}
                />
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "raleway-bold",
                    fontSize: 20,
                    alignSelf: "center",
                  }}
                >
                  {driverData?.name}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 20,
                    marginTop: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", gap: 5 }}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#d7d7d7"
                      style={{ marginTop: 3 }}
                    />
                    <Text
                      style={{
                        color: "#d7d7d7",
                        fontFamily: "raleway-regular",
                        fontSize: 12,
                      }}
                    >
                      Asaba, Nigeria
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 5 }}>
                    <MaterialCommunityIcons
                      name="history"
                      size={18}
                      color="#d7d7d7"
                      style={{ marginTop: 3 }}
                    />
                    <Text
                      style={{
                        color: "#d7d7d7",
                        fontFamily: "raleway-regular",
                        fontSize: 12,
                      }}
                    >
                      {driverData?.total_trips || "No"} rides completed
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: "#393939",
                  width: "95%",
                  marginTop: 20,
                  alignSelf: "center",
                  borderRadius: 10,
                  padding: 15,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ alignSelf: "flex-start", alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontFamily: "poppins-bold" }}>
                    {driverData?.plate_number}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 5 }}>
                    <Feather name="credit-card" size={14} color="#fff" />
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: "raleway-regular",
                        fontSize: 10,
                      }}
                    >
                      Plate number
                    </Text>
                  </View>
                </View>
                <View style={{ alignSelf: "flex-start", alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontFamily: "poppins-bold" }}>
                    {`${driverData?.vehicle_color}`}{" "}
                    {`${driverData?.vehicle_brand}`}{" "}
                    {`${driverData?.vehicle_model}`}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 5 }}>
                    <FontAwesome5 name="car" size={14} color="#fff" />
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: "raleway-regular",
                        fontSize: 10,
                      }}
                    >
                      Vehicle info
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable
                style={{
                  backgroundColor: "#fff",
                  padding: 10,
                  borderRadius: 20,
                  alignSelf: "center",
                  width: "95%",
                  marginVertical: 20,
                }}
                onPress={() => Linking.openURL(`tel:${driverData.phone}`)}
              >
                <Text
                  style={{
                    fontFamily: "raleway-bold",
                    color: "#121212",
                    textAlign: "center",
                  }}
                >
                  Contact Driver
                </Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default DriverCard;

const styles = StyleSheet.create({});

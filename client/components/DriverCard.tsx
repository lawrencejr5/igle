import { StyleSheet, Text, View, Image } from "react-native";
import React from "react";

const DriverCard = () => {
  return (
    <View
      style={{
        marginTop: 20,
        backgroundColor: "#393939ff",
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 10,
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        gap: 10,
      }}
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
              Oputa Chidubem
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
            Keke na Pep
          </Text>
        </View>

        {/* Ratings and reviews */}
        <View style={{ alignItems: "flex-end" }}>
          {/* Rating */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text
              style={{
                color: "#fff",
                fontFamily: "poppins-regular",
              }}
            >
              5
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
            18 reviews
          </Text>
        </View>
      </View>
    </View>
  );
};

export default DriverCard;

const styles = StyleSheet.create({});

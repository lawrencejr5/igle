import { StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import { useNavigation } from "expo-router";

import AntDesign from "@expo/vector-icons/AntDesign";

const RideDetails = () => {
  // const navigation = useNavigation();

  // useEffect(() => {
  //   // Hide tab bar on this screen
  //   navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
  //   return () => {
  //     // Show tab bar again when leaving
  //     navigation.getParent()?.setOptions({
  //       tabBarStyle: {
  //         paddingTop: 10,
  //         height: 80,
  //         borderTopWidth: 0, // Hide default border
  //         elevation: 0, // Remove Android shadow
  //       },
  //     });
  //   };
  // }, [navigation]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#121212",
        paddingTop: 50,
        paddingHorizontal: 20,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 20,
        }}
      >
        <AntDesign name="arrowleft" size={24} color="#fff" />
        <Text
          style={{
            fontFamily: "raleway-semibold",
            color: "#fff",
            fontSize: 22,
          }}
        >
          RideDetails
        </Text>
      </View>
    </View>
  );
};

export default RideDetails;

const styles = StyleSheet.create({});

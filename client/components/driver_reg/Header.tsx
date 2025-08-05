import { StyleSheet, Text, View, TouchableWithoutFeedback } from "react-native";
import React from "react";

import { FontAwesome5 } from "@expo/vector-icons";

import { driver_reg_styles } from "../../styles/driver_reg_styles";
import { router } from "expo-router";

const Header = () => {
  const styles = driver_reg_styles();

  return (
    <View style={styles.header}>
      <Text style={styles.header_text}>Driver Registration</Text>
      <TouchableWithoutFeedback
        onPress={() => router.push("../../(tabs)/home")}
        style={{ padding: 20 }}
      >
        <FontAwesome5 name="times" size={24} color="#fff" />
      </TouchableWithoutFeedback>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({});

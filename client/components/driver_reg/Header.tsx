import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native";
import React from "react";

import { FontAwesome5 } from "@expo/vector-icons";

import { driver_reg_styles } from "../../styles/driver_reg_styles";
import { router } from "expo-router";

const Header = () => {
  const styles = driver_reg_styles();

  return (
    <View style={styles.header}>
      <Text style={styles.header_text}>Driver Registration</Text>
      <TouchableOpacity
        onPress={() => router.push("../../(tabs)/home")}
        style={{ paddingLeft: 20 }}
      >
        <FontAwesome5 name="times" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({});

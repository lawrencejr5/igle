import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import React from "react";

import { driver_reg_styles } from "../../styles/driver_reg_styles";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

const Header = () => {
  const styles = driver_reg_styles();

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("../../(tabs)/home");
  };

  return (
    <View style={styles.header}>
      <Text style={styles.header_text}>Driver Registration</Text>
      <TouchableOpacity
        onPress={handleCancel}
        style={{
          paddingVertical: 6,
          paddingHorizontal: 10,
        }}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        activeOpacity={0.7}
      >
        <Text style={{ color: "#ff453a", fontFamily: "raleway-bold", fontSize: 14 }}>
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({});

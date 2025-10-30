import React from "react";
import { View, StyleSheet } from "react-native";

interface Props {
  value: number; // 0..1
  height?: number;
  trackColor?: string;
  fillColor?: string;
  rounded?: boolean;
}

const ProgressBar: React.FC<Props> = ({
  value,
  height = 8,
  trackColor = "rgba(255,255,255,0.12)",
  fillColor = "#FFFFFF",
  rounded = true,
}) => {
  const pct = Math.max(0, Math.min(1, value));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor,
          borderRadius: rounded ? height / 2 : 0,
        },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${pct * 100}%`,
            backgroundColor: fillColor,
            borderRadius: rounded ? height / 2 : 0,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});

export default ProgressBar;

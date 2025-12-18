import React, { useEffect, useRef, useState, useMemo } from "react";
import { View, Animated, StyleSheet, Easing } from "react-native";
import { Image } from "expo-image";

import { Marker } from "react-native-maps";

type Coord = { latitude: number; longitude: number };
type GeoJsonArray = [number, number];

interface DriverMarkerProps {
  // Either an object {latitude, longitude} or a GeoJSON coords array [lng, lat]
  coordinate: Coord | GeoJsonArray;
  imageSource: { uri?: string } | any; // use require(...) or { uri: 'https://...' }
  size?: number; // avatar size in px
  rippleSize?: number; // diameter of ripple circle
  rippleColor?: string;
  showRipple?: boolean;
  bearing?: number; // optional heading in degrees
}

const DriverMarker: React.FC<DriverMarkerProps> = ({
  coordinate,
  imageSource,
  size = 48,
  rippleSize = 120,
  rippleColor = "rgba(0,150,255,0.18)",
  showRipple = true,
  bearing = 0,
}) => {
  // Handle GeoJSON vs {lat, lng}
  const coord = useMemo(() => {
    if (Array.isArray(coordinate)) {
      const [lng, lat] = coordinate as GeoJsonArray;
      return { latitude: lat, longitude: lng } as Coord;
    }
    return coordinate as Coord;
  }, [coordinate]);

  // Animated values for two ripples
  const scaleA = useRef(new Animated.Value(0)).current;
  const opacityA = useRef(new Animated.Value(0.6)).current;
  const scaleB = useRef(new Animated.Value(0)).current;
  const opacityB = useRef(new Animated.Value(0.6)).current;

  // Rotation anim
  const rotateAnim = useRef(new Animated.Value(bearing)).current;
  useEffect(() => {
    // animate rotation smoothly when bearing changes
    Animated.timing(rotateAnim, {
      toValue: bearing,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [bearing]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  // Start ripple animations
  useEffect(() => {
    const loopA = Animated.loop(
      Animated.parallel([
        Animated.timing(scaleA, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacityA, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    const loopB = Animated.loop(
      Animated.sequence([
        Animated.delay(1000), // stagger
        Animated.parallel([
          Animated.timing(scaleB, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacityB, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        // reset values quickly so loop restarts cleanly
        Animated.timing(scaleB, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacityB, {
          toValue: 0.6,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    // make sure initial values are set
    scaleA.setValue(0);
    opacityA.setValue(0.6);
    scaleB.setValue(0);
    opacityB.setValue(0.6);

    loopA.start();
    loopB.start();

    return () => {
      loopA.stop();
      loopB.stop();
    };
  }, [scaleA, scaleB, opacityA, opacityB]);

  // trackViewChanges optimization: set false after image loaded to avoid constant re-render on Android
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Marker
      coordinate={coord}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={!imageLoaded} // important for performance
    >
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          width: rippleSize,
          height: rippleSize,
        }}
      >
        {showRipple && (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ripple,
                {
                  width: rippleSize,
                  height: rippleSize,
                  borderRadius: rippleSize / 2,
                  backgroundColor: rippleColor,
                  transform: [{ scale: scaleA }],
                  opacity: opacityA,
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ripple,
                {
                  width: rippleSize,
                  height: rippleSize,
                  borderRadius: rippleSize / 2,
                  backgroundColor: rippleColor,
                  transform: [{ scale: scaleB }],
                  opacity: opacityB,
                },
              ]}
            />
          </>
        )}

        <Animated.View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ rotate: rotateInterpolate }],
            backgroundColor: "#fff", // small border background
            elevation: 2, // android shadow
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 2,
          }}
        >
          <Image
            source={require("../assets/images/user.png")}
            style={{ width: "100%", height: "100%" }}
            onLoad={() => setImageLoaded(true)}
            resizeMode="cover"
          />
        </Animated.View>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  ripple: {
    position: "absolute",
  },
});

export default React.memo(DriverMarker);

import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";

import SplashScreen from "./splash_screen";

const StartScreen = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(loadTimeout);
  }, []);

  return (
    <>
      {loading ? (
        <SplashScreen />
      ) : (
        <View
          style={{
            backgroundColor: "#121212",
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff" }}>Bankai</Text>
        </View>
      )}
    </>
  );
};

export default StartScreen;

const styles = StyleSheet.create({});

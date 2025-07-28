import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";

import SplashScreen from "./splash_screen";

const Start = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

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

export default Start;

const styles = StyleSheet.create({});

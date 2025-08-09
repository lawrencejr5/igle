import {
  Image,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React from "react";
import { router } from "expo-router";
import Header from "../../components/driver_reg/Header";

const ReviewMessage = () => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#121212",
      }}
    >
      <Header />

      {/* Main content - centered */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 20,
        }}
      >
        <Image
          source={require("../../assets/images/illustrations/confirmed.png")}
          style={{ height: 300, width: 300, borderRadius: 15 }}
        />

        <View>
          <Text
            style={{
              color: "#fff",
              fontFamily: "raleway-bold",
              fontSize: 22,
              textAlign: "center",
              marginVertical: 10,
            }}
          >
            Submitted successfully
          </Text>
          <Text
            style={{
              color: "#fff",
              fontFamily: "raleway-regular",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            Your details have been submitted and will be reviewed within 3 to 4
            working days
          </Text>
        </View>
      </View>

      {/* Button at the bottom */}
      <View
        style={{
          paddingBottom: 40,
          paddingHorizontal: 20,
        }}
      >
        <TouchableWithoutFeedback onPress={() => router.push("/(tabs)/home")}>
          <View
            style={{
              backgroundColor: "#fff",
              paddingVertical: 15,
              borderRadius: 30,
              width: "100%",
            }}
          >
            <Text
              style={{
                color: "#121212",
                fontFamily: "raleway-bold",
                textAlign: "center",
                fontSize: 16,
              }}
            >
              Go back home
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

export default ReviewMessage;

const styles = StyleSheet.create({
  progress_bar_container: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  progress_bar: {
    height: 5,
    width: "20%",
    backgroundColor: "#565656ff",
    borderRadius: 5,
  },
});

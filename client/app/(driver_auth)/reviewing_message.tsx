import {
  Image,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React from "react";
import { router } from "expo-router";

const ReviewMessage = () => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#121212",
        paddingHorizontal: 20,
      }}
    >
      {/* Main content - centered */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
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

const styles = StyleSheet.create({});

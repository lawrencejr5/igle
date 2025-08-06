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
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 300,
          height: 300,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={require("../../assets/images/illustrations/confirmed.png")}
          style={{ height: 200, width: 200 }}
        />

        <View>
          <Text
            style={{
              color: "#fff",
              fontFamily: "raleway-bold",
              fontSize: 20,
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
              fontSize: 12,
              textAlign: "center",
            }}
          >
            Your details have been submitted and will be reviewed within 3 to 4
            working days
          </Text>
        </View>

        <View style={{ marginTop: 10 }}>
          <TouchableWithoutFeedback
            onPress={() => router.push("choose_car_type")}
          >
            <View
              style={{
                backgroundColor: "#fff",
                padding: 10,
                width: 200,
                borderRadius: 20,
                marginVertical: 20,
              }}
            >
              <Text
                style={{
                  color: "#121212",
                  fontFamily: "raleway-bold",
                  textAlign: "center",
                }}
              >
                Make changes
              </Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback
            onPress={() => router.push("../(tabs)/home")}
          >
            <View
              style={{
                backgroundColor: "#999999",
                padding: 10,
                width: 200,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "raleway-bold",
                  textAlign: "center",
                }}
              >
                Back to home
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </View>
  );
};

export default ReviewMessage;

const styles = StyleSheet.create({});

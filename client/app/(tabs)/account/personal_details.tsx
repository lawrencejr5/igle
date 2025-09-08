import { Pressable, StyleSheet, Text, View, Image } from "react-native";
import React from "react";

import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, AntDesign, Feather } from "@expo/vector-icons";
import { router } from "expo-router";

const PersonalDetails = () => {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#121212", paddingHorizontal: 20 }}
    >
      <View>
        <Pressable
          style={{ paddingVertical: 15, paddingRight: 15 }}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={26} color={"#fff"} />
        </Pressable>
        <Text
          style={{
            fontFamily: "raleway-semibold",
            color: "#fff",
            fontSize: 22,
          }}
        >
          Personal details
        </Text>
      </View>
      <View style={{ marginTop: 50 }}>
        <Pressable style={{ alignSelf: "center" }}>
          <Image
            source={require("../../../assets/images/black-profile.jpeg")}
            style={{ height: 120, width: 120, borderRadius: 50 }}
          />
        </Pressable>

        <View style={{ marginTop: 50 }}>
          <View style={styles.item_container}>
            <View>
              <Text style={styles.item_header_text}>Fullname:</Text>
              <Text style={styles.item_sub_text}>Bombom Nyash</Text>
            </View>
            <Feather name="chevron-right" color={"#fff"} size={24} />
          </View>
          <View style={styles.item_container}>
            <View>
              <Text style={styles.item_header_text}>Email:</Text>
              <Text style={styles.item_sub_text}>bombomnyash@gmail.com</Text>
            </View>
            <Feather name="chevron-right" color={"#fff"} size={24} />
          </View>
          <View style={styles.item_container}>
            <View>
              <Text style={styles.item_header_text}>Phone:</Text>
              <Text
                style={[
                  styles.item_sub_text,
                  { fontFamily: "poppins-regular", marginTop: 3 },
                ]}
              >
                09025816161
              </Text>
            </View>
            <Feather name="chevron-right" color={"#fff"} size={24} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PersonalDetails;

const styles = StyleSheet.create({
  item_container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: "#656565ff",
    borderWidth: 0.5,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  item_header_text: {
    fontFamily: "raleway-semibold",
    color: "#aaaaaa",
    fontSize: 12,
  },
  item_sub_text: {
    fontFamily: "raleway-semibold",
    color: "#fff",
    fontSize: 14,
  },
});

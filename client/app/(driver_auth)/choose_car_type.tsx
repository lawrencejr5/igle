import {
  Image,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useState } from "react";
import Header from "../../components/driver_reg/Header";
import { router } from "expo-router";

const ChooseCarType = () => {
  const [carType, setCarType] = useState<"keke" | "cab" | "suv" | "">("");

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <Header />

      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ marginTop: 25 }}>
          <Text style={styles.question_header}>
            What type of driver are you?
          </Text>
        </View>

        <View style={styles.role_container}>
          <TouchableWithoutFeedback onPress={() => setCarType("keke")}>
            <View
              style={[
                styles.role_card,
                carType === "keke" && styles.role_card_active,
              ]}
            >
              <Image
                source={require("../../assets/images/icons/keke-icon.png")}
                style={{ width: 70, height: 70 }}
              />
              <View>
                <Text style={styles.role_text}>Keke Driver</Text>
                <Text style={styles.role_description}>
                  I just drive a normal keke na pep
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={() => setCarType("cab")}>
            <View
              style={[
                styles.role_card,
                carType === "cab" && styles.role_card_active,
              ]}
            >
              <Image
                source={require("../../assets/images/icons/sedan-icon.png")}
                style={{ width: 70, height: 70 }}
              />
              <View>
                <Text style={styles.role_text}>Cab Driver</Text>
                <Text style={styles.role_description}>
                  I just drive a normal keke na pep
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={() => setCarType("suv")}>
            <View
              style={[
                styles.role_card,
                carType === "suv" && styles.role_card_active,
              ]}
            >
              <Image
                source={require("../../assets/images/icons/suv-icon.png")}
                style={{ width: 70, height: 70 }}
              />
              <View>
                <Text style={styles.role_text}>SUV Driver</Text>
                <Text style={styles.role_description}>
                  I just drive a normal keke na pep
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>

        <TouchableWithoutFeedback
          onPress={() => router.push("personal_information")}
        >
          <View style={styles.continue_btn}>
            <Text style={styles.continue_btn_text}>Contine</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

export default ChooseCarType;

const styles = StyleSheet.create({
  question_header: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 20,
    textAlign: "center",
  },
  role_card: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 20,
    backgroundColor: "#565656ff",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginVertical: 20,
  },
  role_card_active: {
    borderColor: "#ffffff",
    borderWidth: 2,
    borderStyle: "solid",
  },
  role_container: {
    marginVertical: 20,
  },
  role_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
  },
  role_description: {
    marginTop: 5,
    fontFamily: "raleway-regular",
    color: "#e1e1e1",
    fontSize: 12,
    width: "95%",
  },
  continue_btn: {
    marginTop: 30,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 30,
  },
  continue_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 16,
    textAlign: "center",
  },
});

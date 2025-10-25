import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, { useState } from "react";
import Header from "../../components/driver_reg/Header";
import { router } from "expo-router";
import { useDriverAuthContext } from "../../context/DriverAuthContext";
import { useNotificationContext } from "../../context/NotificationContext";
import Notification from "../../components/Notification";

const ChooseCarType = () => {
  const { createDriver } = useDriverAuthContext();
  const { showNotification, notification } = useNotificationContext()!;
  const [carType, setCarType] = useState<"keke" | "cab" | "suv" | "">("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async (): Promise<void> => {
    if (!carType) {
      showNotification("Please select a vehicle type", "error");
      return;
    }

    setLoading(true);
    try {
      await createDriver(carType);
      showNotification("Driver profile created successfully", "success");
      setTimeout(() => {
        router.push("/personal_information");
      }, 1500);
    } catch (err: any) {
      showNotification(
        err.message || "Failed to create driver profile",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {notification.visible && <Notification notification={notification} />}
      <View style={{ flex: 1, backgroundColor: "#121212" }}>
        <Header />

        <ScrollView style={{ paddingHorizontal: 20 }}>
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
                  source={require("../../assets/images/icons/motorcycle-icon.png")}
                  style={{ width: 70, height: 70 }}
                />
                <View>
                  <Text style={styles.role_text}>Bike Rider</Text>
                  <Text style={styles.role_description}>
                    I just drive a normal keke na pep
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>

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
            <TouchableWithoutFeedback onPress={() => setCarType("suv")}>
              <View
                style={[
                  styles.role_card,
                  carType === "suv" && styles.role_card_active,
                ]}
              >
                <Image
                  source={require("../../assets/images/icons/van-icon.png")}
                  style={{ width: 70, height: 70 }}
                />
                <View>
                  <Text style={styles.role_text}>Van Driver</Text>
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
                  source={require("../../assets/images/icons/truck-icon.png")}
                  style={{ width: 70, height: 70 }}
                />
                <View>
                  <Text style={styles.role_text}>Truck Driver</Text>
                  <Text style={styles.role_description}>
                    I just drive a normal keke na pep
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>

          <TouchableWithoutFeedback onPress={handleContinue} disabled={loading}>
            <View style={[styles.continue_btn, loading && { opacity: 0.6 }]}>
              <Text style={styles.continue_btn_text}>
                {loading ? "Creating..." : "Continue"}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </View>
    </>
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
    marginVertical: 30,
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

import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Animated,
  Image,
  Pressable,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Entypo from "@expo/vector-icons/Entypo";
import { router } from "expo-router";

import { useAuthContext } from "../context/AuthContext";
import { useDriverAuthContext } from "../context/DriverAuthContext";

const SideNav: React.FC<{
  mode: "driver" | "rider";
  open: boolean;
  setSideNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ open, setSideNavOpen, mode }) => {
  const { signedIn } = useAuthContext();
  const { driver } = useDriverAuthContext();

  const go_to_driver = () => {
    if (signedIn?.is_driver) {
      router.push("../(driver)/home");
    } else {
      if (signedIn?.driver_application === "none")
        router.push("../(driver_auth)/choose_car_type");
      else if (signedIn?.driver_application === "rejected")
        router.push("../(driver_auth)/choose_car_type");
      else if (signedIn?.driver_application === "submitted")
        router.push("../(driver_auth)/reviewing_message");
      else router.push("../(tabs)/home");
    }
  };

  const sideNavTranslate = useRef(new Animated.Value(-320)).current;
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setVisible(true);
      Animated.timing(sideNavTranslate, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [open]);

  const closeSideNav = () => {
    setSideNavOpen(false);
    Animated.timing(sideNavTranslate, {
      toValue: -320,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible) return null;

  if (mode === "rider")
    return (
      <TouchableWithoutFeedback onPress={closeSideNav}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[
                styles.sidenav,
                { transform: [{ translateX: sideNavTranslate }] },
              ]}
            >
              <View>
                {/* Logo */}
                <View style={styles.logo_container}>
                  <Text style={styles.logo_text}>Igle</Text>
                  <TouchableWithoutFeedback
                    onPress={closeSideNav}
                    style={{ padding: 10 }}
                  >
                    <Feather name="sidebar" size={24} color="#fff" />
                  </TouchableWithoutFeedback>
                </View>

                {/* User */}
                <View style={styles.user_card}>
                  <Image
                    source={
                      signedIn?.profile_pic
                        ? { uri: signedIn?.profile_pic } // remote image from backend
                        : require("../assets/images/user.png") // fallback local asset
                    }
                    style={styles.user_img}
                  />

                  <View>
                    <Text style={styles.user_name}>{signedIn?.name}</Text>
                    <Text style={styles.user_type}>Rider</Text>
                  </View>
                </View>
              </View>

              {/* Side bar values */}
              <View>
                <TouchableOpacity
                  style={styles.sidenav_content_box}
                  onPress={() => {
                    closeSideNav();
                    router.push("rides/");
                  }}
                >
                  <FontAwesome name="car" size={20} color="#c6c6c6" />
                  <Text style={styles.sidenav_content_text}>Rides</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sidenav_content_box}
                  onPress={() => {
                    closeSideNav();
                    router.push("delivery/");
                  }}
                >
                  <FontAwesome name="car" size={20} color="#c6c6c6" />
                  <Text style={styles.sidenav_content_text}>Deliveries</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sidenav_content_box}
                  onPress={() => {
                    closeSideNav();
                    router.push("account/wallet");
                  }}
                >
                  <Entypo name="wallet" size={20} color="#c6c6c6" />
                  <Text style={styles.sidenav_content_text}>Wallet</Text>
                </TouchableOpacity>
                {/* <TouchableOpacity
                  style={styles.sidenav_content_box}
                  onPress={() => {
                    closeSideNav();
                  }}
                >
                  <Ionicons name="pricetag" size={20} color="#c6c6c6" />
                  <Text style={styles.sidenav_content_text}>Promotions</Text>
                </TouchableOpacity> */}
                <TouchableOpacity
                  style={styles.sidenav_content_box}
                  onPress={() => {
                    closeSideNav();
                  }}
                >
                  <Feather name="help-circle" size={20} color="#c6c6c6" />
                  <Text style={styles.sidenav_content_text}>Support</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sidenav_content_box}
                  onPress={() => {
                    closeSideNav();
                  }}
                >
                  <FontAwesome name="info-circle" size={20} color="#c6c6c6" />
                  <Text style={styles.sidenav_content_text}>About</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sidenav_content_box}
                  onPress={() => {
                    closeSideNav();
                  }}
                >
                  <FontAwesome name="star" size={20} color="#c6c6c6" />
                  <Text style={styles.sidenav_content_text}>Rate us</Text>
                </TouchableOpacity>
              </View>

              {/* Switch mode */}
              <View style={{ marginBottom: 30, paddingHorizontal: 10 }}>
                <TouchableWithoutFeedback onPress={go_to_driver}>
                  <View style={styles.switch_btn}>
                    <Text style={styles.switch_btn_text}>Driver mode</Text>
                    {/* <FontAwesome6
                      name="arrow-right-arrow-left"
                      size={18}
                      color="black"
                    /> */}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    );
  else if (mode === "driver")
    return (
      <TouchableWithoutFeedback onPress={closeSideNav}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[
                styles.sidenav,
                {
                  transform: [{ translateX: sideNavTranslate }],
                  paddingBottom: 50,
                },
              ]}
            >
              <View>
                {/* Logo */}
                <View style={styles.logo_container}>
                  <Text style={styles.logo_text}>Igle Driver</Text>
                  <TouchableWithoutFeedback
                    onPress={closeSideNav}
                    style={{ padding: 10 }}
                  >
                    <Feather name="sidebar" size={24} color="#fff" />
                  </TouchableWithoutFeedback>
                </View>

                {/* User */}
                <View style={styles.user_card}>
                  <Image
                    source={
                      driver?.profile_img
                        ? { uri: driver?.profile_img } // remote image from backend
                        : require("../assets/images/user.png") // fallback local asset
                    }
                    style={styles.user_img}
                  />

                  <View>
                    <Text style={styles.user_name}>{driver?.name}</Text>
                    <Text style={styles.user_type}>
                      {driver?.vehicle_brand} {driver?.vehicle_model}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Side bar values */}
              <View>
                <TouchableOpacity
                  onPress={() => {
                    closeSideNav();
                    router.push("/(driver)/rides");
                  }}
                >
                  <View style={styles.sidenav_content_box}>
                    <FontAwesome name="car" size={20} color="#c6c6c6" />
                    <Text style={styles.sidenav_content_text}>Rides</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    closeSideNav();
                    router.push("/(driver)/earnings");
                  }}
                >
                  <View style={styles.sidenav_content_box}>
                    <Entypo name="wallet" size={20} color="#c6c6c6" />
                    <Text style={styles.sidenav_content_text}>Earnings</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sidenav_content_box}
                  onPress={() => {
                    closeSideNav();
                  }}
                >
                  <Feather name="help-circle" size={20} color="#c6c6c6" />
                  <Text style={styles.sidenav_content_text}>Support</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sidenav_content_box}
                  onPress={() => {
                    closeSideNav();
                  }}
                >
                  <FontAwesome name="star" size={20} color="#c6c6c6" />
                  <Text style={styles.sidenav_content_text}>Rate us</Text>
                </TouchableOpacity>
              </View>

              {/* Switch mode */}
              <View style={{ marginBottom: 30, paddingHorizontal: 10 }}>
                <Pressable
                  style={styles.switch_btn}
                  onPress={() => router.push("../(tabs)/home")}
                >
                  <Text style={styles.switch_btn_text}>Rider mode</Text>
                </Pressable>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    );
  else return null;
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    zIndex: 5,
    height: "100%",
    width: "100%",
    backgroundColor: "#12121290",
  },
  sidenav: {
    position: "absolute",
    zIndex: 2,
    height: "100%",
    width: 320,
    backgroundColor: "#121212",
    paddingTop: 50,
    paddingHorizontal: 20,
    flex: 1,
    justifyContent: "space-between",
  },
  logo_container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 5,
  },
  logo_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 30,
  },
  user_card: {
    marginVertical: 30,
    backgroundColor: "#393939",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 10,
  },
  user_img: {
    height: 50,
    width: 50,
    borderRadius: 25,
  },
  user_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  user_type: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "raleway-regular",
    marginTop: 3,
  },
  sidenav_content_box: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 15,
    alignItems: "center",
    paddingHorizontal: 5,
    marginVertical: 15,
  },
  sidenav_content_text: {
    color: "#c6c6c6",
    fontFamily: "raleway-semibold",
    fontSize: 18,
  },
  switch_btn: {
    backgroundColor: "#fff",
    padding: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  switch_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
});

export default SideNav;

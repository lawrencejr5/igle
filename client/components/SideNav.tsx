import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Animated,
  Image,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Entypo from "@expo/vector-icons/Entypo";

const SideNav: React.FC<{
  open: boolean;
  setSideNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ open, setSideNavOpen }) => {
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

  return (
    <TouchableWithoutFeedback onPress={closeSideNav}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.sidenav,
            { transform: [{ translateX: sideNavTranslate }] },
          ]}
        >
          <View>
            {/* Logo */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingRight: 5,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "raleway-bold",
                  fontSize: 30,
                }}
              >
                Igle
              </Text>
              <TouchableWithoutFeedback
                onPress={closeSideNav}
                style={{ padding: 10 }}
              >
                <Feather name="sidebar" size={24} color="#fff" />
              </TouchableWithoutFeedback>
            </View>

            {/* User */}
            <View
              style={{
                marginVertical: 30,
                backgroundColor: "#393939",
                paddingHorizontal: 10,
                paddingVertical: 10,
                borderRadius: 10,
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <Image
                source={require("../assets/images/black-profile.jpeg")}
                style={{ height: 50, width: 50, borderRadius: 25 }}
              />

              <View>
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "raleway-bold",
                    fontSize: 16,
                  }}
                >
                  Oputa Lawrence
                </Text>
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "raleway-regular",
                    marginTop: 3,
                  }}
                >
                  Rider
                </Text>
              </View>
            </View>
          </View>

          {/* Side bar values */}
          <View>
            <View style={styles.sidenav_content_box}>
              <FontAwesome name="car" size={20} color="#c6c6c6" />
              <Text style={styles.sidenav_content_text}>My Rides</Text>
            </View>
            <View style={styles.sidenav_content_box}>
              <Entypo name="wallet" size={20} color="#c6c6c6" />
              <Text style={styles.sidenav_content_text}>Wallet</Text>
            </View>
            <View style={styles.sidenav_content_box}>
              <Ionicons name="pricetag" size={20} color="#c6c6c6" />
              <Text style={styles.sidenav_content_text}>Promotions</Text>
            </View>
            <View style={styles.sidenav_content_box}>
              <Feather name="help-circle" size={20} color="#c6c6c6" />
              <Text style={styles.sidenav_content_text}>Support</Text>
            </View>
            <View style={styles.sidenav_content_box}>
              <FontAwesome name="info-circle" size={20} color="#c6c6c6" />
              <Text style={styles.sidenav_content_text}>About</Text>
            </View>
            <View style={styles.sidenav_content_box}>
              <FontAwesome name="star" size={20} color="#c6c6c6" />
              <Text style={styles.sidenav_content_text}>Rate us</Text>
            </View>
          </View>

          {/* Switch mode */}
          <View style={{ marginBottom: 30, paddingHorizontal: 10 }}>
            <View
              style={{
                backgroundColor: "#fff",
                padding: 10,
                paddingHorizontal: 30,
                borderRadius: 5,
                flexDirection: "row",
                gap: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#121212",
                  fontFamily: "raleway-bold",
                  fontSize: 16,
                }}
              >
                Driver mode
              </Text>
              <FontAwesome6 name="rotate" size={20} color="black" />
            </View>
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    zIndex: 1,
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
});

export default SideNav;

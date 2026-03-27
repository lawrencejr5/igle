import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import React from "react";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Legal = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openLink = async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await WebBrowser.openBrowserAsync(url);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#121212",
        paddingTop: insets.top,
      }}
    >
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Pressable
          style={{ paddingVertical: 15 }}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={30} color={"#fff"} />
        </Pressable>
        <Text
          style={{
            fontFamily: "raleway-semibold",
            color: "#fff",
            fontSize: 22,
          }}
        >
          Legal & Privacy
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 30, paddingBottom: 60 }}
      >
        <TouchableOpacity
          style={styles.setting_box}
          onPress={() => openLink("https://igleride.com/privacy-policy")}
        >
          <Feather name="shield" size={20} color="#c6c6c6" />
          <Text style={styles.setting_text}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.setting_box}
          onPress={() => openLink("https://igleride.com/terms-and-conditions")}
        >
          <Feather name="file-text" size={20} color="#c6c6c6" />
          <Text style={styles.setting_text}>Terms & Conditions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.setting_box}
          onPress={() => openLink("https://igleride.com/about")}
        >
          <Feather name="info" size={20} color="#c6c6c6" />
          <Text style={styles.setting_text}>About</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default Legal;

const styles = StyleSheet.create({
  setting_box: {
    marginTop: 27,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
    borderStyle: "solid",
    borderColor: "#444444ff",
    borderBottomWidth: 0.5,
    paddingBottom: 10,
  },
  setting_text: {
    color: "#c6c6c6",
    fontFamily: "raleway-semibold",
    fontSize: 16,
  },
});

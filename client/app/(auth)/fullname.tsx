import {
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";

import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { router } from "expo-router";

import { useNotificationContext } from "../../context/NotificationContext";
import { useAuthContext } from "../../context/AuthContext";

import { auth_styles } from "../../styles/auth.styles";

const AddFullname = () => {
  const styles = auth_styles();

  const { showNotification } = useNotificationContext()!;
  const { updateName, signedIn } = useAuthContext()!;

  const [fullname, setFullname] = useState("");
  const [loading, setLoading] = useState(false);

  const save_name = async () => {
    if (!fullname.trim()) {
      showNotification("Full name is required.", "error");
      return;
    }
    setLoading(true);
    try {
      await updateName(fullname.trim());

      // After saving name, check if phone is still needed
      if (!signedIn?.phone || signedIn.phone === "") {
        router.replace("/(auth)/phone");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (err: any) {
      showNotification(err.message || "An error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        style={styles.container}
      >
        {/* Header texts... */}
        <View style={{ marginTop: 60, paddingHorizontal: 10 }}>
          <Text style={styles.header_text}>What's your name?</Text>
          {/* Sub header texts */}
          <Text style={styles.sub_header_text}>
            Let us know what to call you...
          </Text>
        </View>

        {/* Form start here */}
        <View style={{ marginTop: 20, paddingHorizontal: 10, flex: 1 }}>
          {/* Fullname input */}
          <View style={styles.inp_container}>
            <Text style={styles.inp_label}>Full name</Text>
            <View style={styles.inp_holder}>
              <FontAwesome name="user-o" size={20} color="white" />
              <TextInput
                style={styles.text_input}
                value={fullname}
                onChangeText={setFullname}
                placeholder="Enter your full name"
                placeholderTextColor={"#c5c5c5"}
                autoCapitalize="words"
                autoFocus
              />
            </View>
          </View>
        </View>
      </ScrollView>
      {/* Save button */}
      <View
        style={{ padding: 20, paddingBottom: Platform.OS === "ios" ? 40 : 20 }}
      >
        <TouchableWithoutFeedback onPress={save_name} disabled={loading}>
          <View style={[styles.sign_btn, { opacity: loading ? 0.5 : 1 }]}>
            <Text style={styles.sign_btn_text}>
              {loading ? "Saving..." : "Continue"}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

export default AddFullname;

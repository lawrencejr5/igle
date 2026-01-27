import {
  Text,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  TextInput,
  Pressable,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import React, { FC, useState } from "react";

import { FontAwesome5 } from "@expo/vector-icons";
import { useWalletContext } from "../../../context/WalletContext";
import { useNotificationContext } from "../../../context/NotificationContext";
import { router } from "expo-router";

const WalletPage: FC = () => {
  const { userWalletBal, fundWallet } = useWalletContext();
  const { showNotification } = useNotificationContext();

  const [amount, setAmount] = useState<string>("");
  const [btnLoading, setBtnLoading] = useState<boolean>(false);

  const fundWalletFunc = async () => {
    setBtnLoading(true);
    try {
      await fundWallet("wallet", Number(amount));
      setBtnLoading(false);
      // Ensure Account tab shows its root after funding
      router.replace("/(tabs)/account");
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      setAmount("");
      Keyboard.dismiss();
      setBtnLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <View style={{ flex: 1, paddingTop: 50, paddingHorizontal: 20 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-bold",
                fontSize: 25,
              }}
            >
              Wallet
            </Text>
            <TouchableOpacity onPress={() => router.replace("/(tabs)/account")}>
              <FontAwesome5 name="times" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Balance */}
          <View
            style={{
              marginTop: 20,
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <View>
              <Text
                style={{
                  color: "#c7c7c7",
                  fontFamily: "raleway-bold",
                  alignSelf: "flex-end",
                }}
              >
                Balance:
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "poppins-black",
                  fontSize: 30,
                }}
              >
                {userWalletBal.toLocaleString()} NGN
              </Text>
            </View>
          </View>

          <View
            style={{
              height: 0.5,
              backgroundColor: "#6e6d6dff",
              width: "100%",
              marginTop: 20,
            }}
          />

          {/* Top up */}
          <View style={{ marginTop: 30 }}>
            <Text
              style={{
                color: "#fff",
                fontFamily: "raleway-bold",
                fontSize: 20,
              }}
            >
              Top up
            </Text>
            <View style={{ marginTop: 20 }}>
              {/* Text input */}
              <View
                style={{
                  backgroundColor: "#4a4a4a",
                  borderRadius: 10,
                  paddingHorizontal: 20,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <TextInput
                  style={{
                    color: "#fff",
                    fontSize: 30,
                    fontWeight: "600" as any,
                    maxWidth: 230,
                    width: "100%",
                    height: "100%",
                  }}
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  placeholderTextColor={"#b3afaf"}
                  inputMode="numeric"
                />
                <View
                  style={{
                    borderColor: "#b3afaf",
                    borderStyle: "solid",
                    borderLeftWidth: 1,
                    paddingLeft: 10,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "raleway-bold",
                      fontSize: 20,
                      color: "#fff",
                    }}
                  >
                    NGN
                  </Text>
                </View>
              </View>
              <View
                style={{
                  marginTop: 30,
                  marginHorizontal: 5,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "flex-start",
                  gap: 10,
                }}
              >
                <Suggestion value={1500} />
                <Suggestion value={3000} />
                <Suggestion value={5000} />
                <Suggestion value={10000} />
                <Suggestion value={25000} />
                <Suggestion value={50000} />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={{ padding: 20, backgroundColor: "transparent" }}>
        <TouchableWithoutFeedback onPress={fundWalletFunc} disabled={!amount}>
          <View
            style={{
              backgroundColor: "#fff",
              width: "100%",
              padding: 15,
              borderRadius: 30,
              opacity: btnLoading ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontFamily: "raleway-bold",
                color: "#121212",
              }}
            >
              {btnLoading ? "Loading..." : "Continue"}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

export default WalletPage;

const Suggestion: FC<{ value: number }> = ({ value }) => {
  const { showNotification } = useNotificationContext();
  const { fundWallet } = useWalletContext();

  const fundWalletFunc = async () => {
    try {
      await fundWallet("wallet", Number(value));
      router.replace("/(tabs)/account");
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      Keyboard.dismiss();
    }
  };
  return (
    <Pressable
      onPress={fundWalletFunc}
      style={{
        backgroundColor: "#666666ff",
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 7,
        borderRadius: 30,
        flexGrow: 1,
        marginTop: 10,
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontFamily: "poppins-regular",
          textAlign: "center",
          fontSize: 11,
        }}
      >
        NGN {value.toLocaleString()}
      </Text>
    </Pressable>
  );
};

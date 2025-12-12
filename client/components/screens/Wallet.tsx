import {
  StyleSheet,
  Text,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  TextInput,
  Animated,
  Dimensions,
  Pressable,
} from "react-native";
import React, {
  FC,
  useRef,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";

import * as Haptics from "expo-haptics";

import { FontAwesome5 } from "@expo/vector-icons";
import { useWalletContext } from "../../context/WalletContext";
import { useNotificationContext } from "../../context/NotificationContext";

const WalletScreen: FC<{
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}> = ({ open, setOpen }) => {
  const { userWalletBal, fundWallet, verify_payment } = useWalletContext();
  const { showNotification } = useNotificationContext();

  const window_height = Dimensions.get("window").height;
  const walletTranslate = useRef(new Animated.Value(window_height)).current;

  useEffect(() => {
    if (open)
      Animated.timing(walletTranslate, {
        duration: 300,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    else
      Animated.timing(walletTranslate, {
        duration: 300,
        toValue: window_height,
        useNativeDriver: true,
      }).start();
  }, [open]);

  const closeWallet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setOpen(false);
    setBtnLoading(false);
    setAmount("");
    Animated.timing(walletTranslate, {
      duration: 300,
      toValue: window_height,
      useNativeDriver: true,
    }).start();
  };

  const [amount, setAmount] = useState<string>("");
  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const fundWalletFunc = async () => {
    setBtnLoading(true);
    try {
      closeWallet();
      await fundWallet("wallet", Number(amount));
      setBtnLoading(false);
    } catch (error: any) {
      showNotification(error.message, "error");
    } finally {
      setAmount("");
      Keyboard.dismiss();
      setBtnLoading(false);
    }
  };

  return (
    <Animated.View
      style={[
        {
          backgroundColor: "#121212",
          height: "100%",
          width: "100%",
          position: "absolute",
          zIndex: 502,
          paddingTop: 50,
          paddingHorizontal: 20,
        },
        { transform: [{ translateY: walletTranslate }] },
      ]}
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
        <TouchableWithoutFeedback style={{ padding: 10 }} onPress={closeWallet}>
          <FontAwesome5 name="times" size={24} color="#fff" />
        </TouchableWithoutFeedback>
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
            style={{ color: "#fff", fontFamily: "poppins-black", fontSize: 30 }}
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
      <View style={{ marginTop: 30, flex: 1 }}>
        <Text
          style={{ color: "#fff", fontFamily: "raleway-bold", fontSize: 20 }}
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
                fontWeight: 600,
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
            <Suggestion close={closeWallet} value={1500} />
            <Suggestion close={closeWallet} value={3000} />
            <Suggestion close={closeWallet} value={5000} />
            <Suggestion close={closeWallet} value={10000} />
            <Suggestion close={closeWallet} value={25000} />
            <Suggestion close={closeWallet} value={50000} />
          </View>
        </View>
        <View style={{ position: "absolute", bottom: 20, width: "100%" }}>
          <TouchableWithoutFeedback
            onPress={fundWalletFunc}
            disabled={btnLoading || !amount}
          >
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
    </Animated.View>
  );
};

export default WalletScreen;

const Suggestion: FC<{ value: number; close: () => void }> = ({
  value,
  close,
}) => {
  const { showNotification } = useNotificationContext();
  const { fundWallet } = useWalletContext();

  const fundWalletFunc = async () => {
    try {
      close();
      await fundWallet("wallet", Number(value));
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

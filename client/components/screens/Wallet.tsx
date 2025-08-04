import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  TextInput,
} from "react-native";
import React, {
  FC,
  useRef,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";

import { FontAwesome5 } from "@expo/vector-icons";

const WalletScreen = () => {
  return (
    <View
      style={{
        backgroundColor: "#121212",
        height: "100%",
        width: "100%",
        position: "absolute",
        zIndex: 2,
        paddingTop: 50,
        paddingHorizontal: 20,
      }}
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
        <TouchableWithoutFeedback style={{ padding: 10 }}>
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
            12,000 NGN
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
                maxWidth: 180,
                height: "100%",
              }}
              placeholder="0.00"
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
            <Suggestion value="1,500" />
            <Suggestion value="3,000" />
            <Suggestion value="5,000" />
            <Suggestion value="10,000" />
            <Suggestion value="25,000" />
            <Suggestion value="50,000" />
          </View>
        </View>
        <View style={{ position: "absolute", bottom: 20, width: "100%" }}>
          <View
            style={{
              backgroundColor: "#fff",
              width: "100%",
              padding: 15,
              borderRadius: 30,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontFamily: "raleway-bold",
                color: "#121212",
              }}
            >
              Continue
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default WalletScreen;

const Suggestion: FC<{ value: string }> = ({ value }) => {
  return (
    <View
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
          fontSize: 12,
        }}
      >
        {value} NGN
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({});

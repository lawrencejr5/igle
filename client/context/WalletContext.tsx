import React, {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { Linking } from "react-native";

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useNotificationContext } from "./NotificationContext";

const WalletContext = createContext<WalletContextType | null>(null);

const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const API_URL = "http://192.168.235.123:5000/api/v1/wallet";

  const { showNotification } = useNotificationContext();

  const [userWalletBal, setUserWalletBal] = useState<number>(0);
  const [driverWalletBal, setDriverWalletBal] = useState<number>(0);

  const getWalletBalance = async (
    owner_type: "Driver" | "User"
  ): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    try {
      const { data } = await axios.get(
        `${API_URL}/balance?owner_type=${owner_type}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.wallet) {
        owner_type === "User"
          ? setUserWalletBal(data.wallet.balance)
          : setDriverWalletBal(data.wallet.balance);
      } else {
        throw new Error("Failed to fetch wallet balance");
      }
    } catch (error: any) {
      const errMsg = error.response.data.msg;
      showNotification(errMsg, "error");
    }
  };

  const fundWallet = async (
    channel: ChannelType,
    amount: number
  ): Promise<void> => {
    const token = await AsyncStorage.getItem("token");

    try {
      const { data } = await axios.post(
        `${API_URL}/fund`,
        { channel, amount },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const url = data.authorization_url;
      if (url) {
        showNotification("Redirecting...", "success");

        // Check if the URL can be opened
        const supported = await Linking.canOpenURL(url);

        if (supported) {
          await Linking.openURL(url);
        } else {
          showNotification("Redirect failed", "error");
        }
      } else {
        throw new Error("An error occured");
      }
    } catch (error: any) {
      const errMsg = error.response.data.msg;
      showNotification(errMsg, "error");
    }
  };

  return (
    <WalletContext.Provider
      value={{ userWalletBal, getWalletBalance, driverWalletBal, fundWallet }}
    >
      {children}
    </WalletContext.Provider>
  );
};

type ChannelType = "wallet" | "cash" | "transfer" | "card";

interface WalletContextType {
  userWalletBal: number;
  driverWalletBal: number;
  getWalletBalance: (owner_type: "Driver" | "User") => Promise<void>;
  fundWallet: (channel: ChannelType, amount: number) => Promise<void>;
}

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context)
    throw new Error(
      "Wallet context can only be used within the Wallet Provider"
    );
  return context;
};

export default WalletProvider;

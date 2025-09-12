import React, {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";

import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useNotificationContext } from "./NotificationContext";
import { useActivityContext } from "./ActivityContext";

import { API_URLS } from "../data/constants";

const WalletContext = createContext<WalletContextType | null>(null);

const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const API_URL = API_URLS.wallet;

  const { showNotification } = useNotificationContext();
  const { createActivity } = useActivityContext();

  const [userWalletBal, setUserWalletBal] = useState<number>(0);
  const [driverWalletBal, setDriverWalletBal] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState<boolean>(false);

  const getWalletBalance = async (
    owner_type: "Driver" | "User"
  ): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    setWalletLoading(true);
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
      throw new Error(errMsg);
    } finally {
      setWalletLoading(false);
    }
  };

  const fundWallet = async (
    channel: ChannelType,
    amount: number
  ): Promise<void> => {
    showNotification("Redirecting...", "success");
    const token = await AsyncStorage.getItem("token");

    try {
      const { data } = await axios.post(
        `${API_URL}/fund`,
        {
          channel,
          amount,
          callback_url: Linking.createURL("(tabs)/account"),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const url = data.authorization_url;

      const redirectUrl = Linking.createURL("(tabs)/account");
      const result = await WebBrowser.openAuthSessionAsync(
        `${url}`,
        redirectUrl
      );

      if (result.type === "success" && result.url) {
        console.log("Payment success:", result.url);

        // Extract the reference from the redirect URL
        const redirect = new URL(result.url);
        let ref = redirect.searchParams.get("reference");

        if (ref) {
          // Paystack sometimes repeats the ref (e.g. "abc123,abc123")
          ref = ref.split(",")[0];
          console.log(ref);
          // Call verify payment
          try {
            await verify_payment(ref);
          } catch (error) {
            console.log(error);
          }

          // Optionally refresh wallet balance
          await getWalletBalance("User");
        } else {
          console.log("No reference found in redirect URL");
        }
      } else {
        showNotification("Funding wallet failed", "error");
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Something went wrong";
      showNotification(errMsg, "error");
    }
  };

  const verify_payment = async (reference: string): Promise<void> => {
    const token = await AsyncStorage.getItem("token");
    setWalletLoading(true);
    showNotification("Verifying...", "success");
    try {
      const { data } = await axios.post(
        `${API_URL}/verify?reference=${reference}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data) throw new Error("An error occurred");
      showNotification(data.msg, "success");

      const amount = data.transaction.amount;

      await createActivity(
        "wallet_funding",
        "Wallet funded",
        `Your wallet was funded with NGN ${amount}`
      );

      console.log("funded");
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Verification failed";
      console.log(errMsg);
      showNotification(errMsg, "error");
      throw new error(errMsg);
    } finally {
      setWalletLoading(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        userWalletBal,
        getWalletBalance,
        driverWalletBal,
        fundWallet,
        verify_payment,
        walletLoading,
        setWalletLoading,
      }}
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
  verify_payment: (reference: string) => Promise<void>;
  walletLoading: boolean;
  setWalletLoading: Dispatch<SetStateAction<boolean>>;
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

import { StyleSheet, Text, View } from "react-native";
import React, {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from "react";

const LoadingContext = createContext<LoadingContextType | null>(null);

const LoadingProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [appLoading, setAppLoading] = useState<boolean>(false);
  return (
    <LoadingContext.Provider value={{ appLoading, setAppLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context)
    throw new Error(
      "Loading context can only be used within the Loading context provider"
    );
  return context;
};

interface LoadingContextType {
  appLoading: boolean;
  setAppLoading: Dispatch<SetStateAction<boolean>>;
}

export default LoadingProvider;

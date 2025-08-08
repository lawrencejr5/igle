import { StyleSheet, Text, View } from "react-native";
import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";

export const DriverAuthContext = createContext<DriverAuthContextType | null>(
  null
);

interface DriverAuthContextType {}

const DriverAuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <DriverAuthContext.Provider value={null}>
      {children}
    </DriverAuthContext.Provider>
  );
};

export default DriverAuthProvider;

export const useDriverAuthContextType = () => {
  return useContext(DriverAuthContext);
};

const styles = StyleSheet.create({});

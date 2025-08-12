import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  FC,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";

import axios from "axios";

const RideContext = createContext<RideContextType | null>(null);

export const RideContextProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const rideRequest = async (): Promise<void> => {
    try {
      console.log("hey");
    } catch (error: any) {
      throw new Error(error.response.data.message);
    }
  };

  return (
    <RideContext.Provider value={{ rideRequest }}>
      {children}
    </RideContext.Provider>
  );
};

export interface RideContextType {
  rideRequest: () => Promise<void>;
}

export const useRideContext = () => {
  const context = useContext(RideContext);
  if (!context)
    throw new Error("Ride context must be used within ride provider");
};

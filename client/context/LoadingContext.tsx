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
  const [rideDetailsLoading, setRideDetailsLoading] = useState<boolean>(false);
  const [loadingState, setLoadingState] = useState<{
    location: boolean;
    completedRides: boolean;
    cancelledRides: boolean;
  }>({
    location: false,
    completedRides: false,
    cancelledRides: false,
  });
  return (
    <LoadingContext.Provider
      value={{
        appLoading,
        setAppLoading,
        loadingState,
        setLoadingState,
        rideDetailsLoading,
        setRideDetailsLoading,
      }}
    >
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
  rideDetailsLoading: boolean;
  setRideDetailsLoading: Dispatch<SetStateAction<boolean>>;

  loadingState: {
    location: boolean;
    completedRides: boolean;
    cancelledRides: boolean;
  };
  setLoadingState: Dispatch<
    SetStateAction<{
      location: boolean;
      completedRides: boolean;
      cancelledRides: boolean;
    }>
  >;
}

export default LoadingProvider;

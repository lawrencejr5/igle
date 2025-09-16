import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  FC,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URLS } from "../data/constants";
import { useNotificationContext } from "./NotificationContext";

export interface RatingType {
  _id: string;
  rating: number;
  review: string;
  ride: string;
  user: string;
  driver: string;
  createdAt: Date;
}

interface Rating {
  rating: number;
  review: string;
  ride: string;
  user: string;
  driver: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RatingContextType {
  rating: number;
  setRating: Dispatch<SetStateAction<number>>;
  review: string;
  setReview: Dispatch<SetStateAction<string>>;
  rideRatings: RatingType[] | null;
  ratingLoading: boolean;
  fetchRideRatings: (ride_id: string) => Promise<void>;
  fetchDriverRatings: (driver_id: string) => Promise<void>;
  fetchUserRatings: () => Promise<void>;
  createRating: (ride: string, driver: string) => Promise<void>;

  driverRating: number;
  driverReviews: Rating | null;
}

const RatingContext = createContext<RatingContextType | null>(null);

const RatingProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [rideRatings, setRideRatings] = useState<RatingType[] | null>(null);

  const [ratingLoading, setRatingLoading] = useState(false);
  const { showNotification } = useNotificationContext();
  const API_URL = API_URLS.rating;

  const fetchRideRatings = async (ride_id: string): Promise<void> => {
    setRatingLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/ride`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { ride_id },
      });
      setRideRatings(data.ratings || null);
    } catch (error: any) {
      console.log("Failed to fetch ride ratings", "error");
    } finally {
      setRatingLoading(false);
    }
  };

  const [driverRating, setDriverRating] = useState<number>(0);
  const [driverReviews, setDriverReviews] = useState<Rating | null>(null);
  const fetchDriverRatings = async (driver_id: string): Promise<void> => {
    setRatingLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.get(
        `${API_URL}/driver?driver_id=${driver_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!data) throw new Error("Unable to fetch driver ratings");
      setDriverRating(data.average_rating);
      setDriverReviews(data.reviews);
    } catch (error: any) {
      console.log("Failed to fetch driver ratings", "error");
    } finally {
      setRatingLoading(false);
    }
  };

  const fetchUserRatings = async (): Promise<void> => {
    setRatingLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error: any) {
      console.log("Failed to fetch your ratings", "error");
    } finally {
      setRatingLoading(false);
    }
  };

  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const createRating = async (ride: string, driver: string): Promise<void> => {
    setRatingLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        `${API_URL}/`,
        {
          rating,
          review,
          ride,
          driver,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showNotification("Thanks for ur rating", "success");
      setRating(0);
      setReview("");
    } catch (error: any) {
      showNotification("Failed to submit rating", "error");
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <RatingContext.Provider
      value={{
        rating,
        setRating,
        review,
        setReview,
        rideRatings,
        ratingLoading,
        fetchRideRatings,
        fetchDriverRatings,
        fetchUserRatings,
        createRating,

        driverRating,
        driverReviews,
      }}
    >
      {children}
    </RatingContext.Provider>
  );
};

export default RatingProvider;

export const useRatingContext = () =>
  useContext(RatingContext) as RatingContextType;

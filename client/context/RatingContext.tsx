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
  user: {
    _id: string;
    name: string;
    profile_pic?: string;
  } | string;
  ride?: string;
  driver?: string;
  restaurant?: string;
  food_order?: string;
  vendor_reply?: string;
  vendor_reply_at?: string;
  createdAt: string;
  updatedAt?: string;
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
  driverReviews: RatingType[] | null;

  // ─── Restaurant Rating Upgrades ───
  restaurantRating: number;
  restaurantRatingCount: number;
  restaurantReviews: RatingType[] | null;
  fetchRestaurantRatings: (restaurant_id: string) => Promise<void>;
  createRestaurantRating: (
    restaurant_id: string,
    ratingScore: number,
    reviewText?: string,
    food_order_id?: string
  ) => Promise<boolean>;
}

const RatingContext = createContext<RatingContextType | null>(null);

const RatingProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [rideRatings, setRideRatings] = useState<RatingType[] | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const { showNotification } = useNotificationContext()!;
  const API_URL = API_URLS.rating;

  const [driverRating, setDriverRating] = useState<number>(0);
  const [driverReviews, setDriverReviews] = useState<RatingType[] | null>(null);

  // Restaurant rating states
  const [restaurantRating, setRestaurantRating] = useState<number>(5.0);
  const [restaurantRatingCount, setRestaurantRatingCount] = useState<number>(0);
  const [restaurantReviews, setRestaurantReviews] = useState<RatingType[] | null>(null);

  const getAuthToken = async () => {
    return (
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("userToken"))
    );
  };

  const fetchRideRatings = async (ride_id: string): Promise<void> => {
    setRatingLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const { data } = await axios.get(`${API_URL}/ride`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { ride_id },
      });
      setRideRatings(data.ratings || null);
    } catch (error: any) {
      console.log("Failed to fetch ride ratings", error);
    } finally {
      setRatingLoading(false);
    }
  };

  const fetchDriverRatings = async (driver_id: string): Promise<void> => {
    setRatingLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const { data } = await axios.get(
        `${API_URL}/driver?driver_id=${driver_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!data) throw new Error("Unable to fetch driver ratings");
      setDriverRating(data.average_rating || 0);
      setDriverReviews(data.reviews || null);
    } catch (error: any) {
      console.log("Failed to fetch driver ratings", error);
    } finally {
      setRatingLoading(false);
    }
  };

  const fetchUserRatings = async (): Promise<void> => {
    setRatingLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      await axios.get(`${API_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error: any) {
      console.log("Failed to fetch your ratings", error);
    } finally {
      setRatingLoading(false);
    }
  };

  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const createRating = async (ride: string, driver: string): Promise<void> => {
    setRatingLoading(true);
    try {
      const token = await getAuthToken();
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
      showNotification("Thanks for your rating!", "success");
      setRating(0);
      setReview("");
    } catch (error: any) {
      showNotification("Failed to submit rating", "error");
    } finally {
      setRatingLoading(false);
    }
  };

  // ─── Restaurant Rating Upgrades ───
  const fetchRestaurantRatings = async (
    restaurant_id: string
  ): Promise<void> => {
    if (!restaurant_id) return;
    setRatingLoading(true);
    try {
      const { data } = await axios.get(
        `${API_URL}/restaurant?restaurant_id=${restaurant_id}`
      );
      if (data) {
        setRestaurantRating(data.average_rating ?? 5.0);
        setRestaurantRatingCount(data.ratings_count ?? 0);
        setRestaurantReviews(data.reviews || []);
      }
    } catch (error: any) {
      console.log("Failed to fetch restaurant ratings", error);
    } finally {
      setRatingLoading(false);
    }
  };

  const createRestaurantRating = async (
    restaurant_id: string,
    ratingScore: number,
    reviewText: string = "",
    food_order_id?: string
  ): Promise<boolean> => {
    setRatingLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Authentication token required");

      const { data } = await axios.post(
        `${API_URL}/`,
        {
          rating: ratingScore,
          review: reviewText,
          restaurant: restaurant_id,
          food_order: food_order_id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification("Thank you for your review!", "success");
      fetchRestaurantRatings(restaurant_id);
      return true;
    } catch (error: any) {
      const msg = error?.response?.data?.msg || "Failed to submit restaurant review";
      showNotification(msg, "error");
      return false;
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

        // Restaurant
        restaurantRating,
        restaurantRatingCount,
        restaurantReviews,
        fetchRestaurantRatings,
        createRestaurantRating,
      }}
    >
      {children}
    </RatingContext.Provider>
  );
};

export default RatingProvider;

export const useRatingContext = () =>
  useContext(RatingContext) as RatingContextType;

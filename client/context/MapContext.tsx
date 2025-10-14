import React, {
  useState,
  useEffect,
  createContext,
  FC,
  ReactNode,
  useContext,
  Dispatch,
  SetStateAction,
  useRef,
} from "react";

import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";

import Polyline from "@mapbox/polyline";
import MapView from "react-native-maps";

import * as Location from "expo-location";

const MapContext = createContext<MapContextType | null>(null);

const MapContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [region, setRegion] = useState<any>({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  useEffect(() => {
    set_user_location();
  }, []);

  useEffect(() => {
    const get_place_name_func = async () => {
      if (!region?.latitude || !region?.longitude) return;
      await getPlaceName(region.latitude, region.longitude);
    };
    get_place_name_func();
  }, [region]);

  const mapRef = useRef<MapView>(null);

  const [mapPadding, setMapPadding] = useState<MapPadding>({
    top: 50,
    left: 10,
    right: 10,
    bottom: 240,
  });

  const [userAddress, setUserAddress] = useState<string>("");
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(
    null
  );

  const [destination, setDestination] = useState<string>("");
  const [destinationCoords, setDestinationCoords] = useState<
    [number, number] | null
  >(null);
  useEffect(() => {
    if (destinationCoords) {
      calculateRide(
        pickupCoords || [region.latitude, region.longitude],
        destinationCoords
      );
    }
  }, [destinationCoords]);

  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  const [rideDetails, setRideDetails] = useState<{
    distanceKm: number;
    durationMins: number;
    amount: number;
    cab: { amount: number };
    keke: { amount: number };
    suv: { amount: number };
  } | null>(null);

  const [routeCoords, setRouteCoords] = useState<CoordsType[]>([]);

  const getRoute = async (
    pickup: [number, number],
    destination: [number, number]
  ) => {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup[0]},${pickup[1]}&destination=${destination[0]},${destination[1]}&key=${API_KEY}`;

    try {
      const response = await axios.get(url);

      if (!response.data.routes || response.data.routes.length === 0) {
        return null;
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];

      // decode polyline points into [{latitude, longitude}, ...]
      const coords = decodePolyline(route.overview_polyline.points);
      // snapped pickup & destination from leg
      const pickupOnRoad = {
        latitude: leg.start_location.lat,
        longitude: leg.start_location.lng,
      };

      const destinationOnRoad = {
        latitude: leg.end_location.lat,
        longitude: leg.end_location.lng,
      };

      return {
        coords,
        pickupOnRoad,
        destinationOnRoad,
        leg,
      };
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const [pickupMarker, setPickupMarker] = useState<CoordsType | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<CoordsType | null>(
    null
  );
  const fetchRoute = async (destinationCoords: [number, number]) => {
    const result = await getRoute(
      pickupCoords || [region.latitude, region.longitude],
      destinationCoords
    );

    if (result) {
      setRouteCoords(result.coords);
      setPickupMarker(result.pickupOnRoad);
      setDestinationMarker(result.destinationOnRoad);

      // 👇 Zoom map to fit route
      mapRef.current?.fitToCoordinates(result.coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };
  useEffect(() => {
    if (destinationCoords) fetchRoute(destinationCoords);
  }, [destinationCoords]);

  const [mapSuggestions, setMapSuggestions] = useState<any>(null);

  const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API;

  const set_user_location = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
      await AsyncStorage.setItem("region", JSON.stringify(region));

      // if (region) mapRef.current?.animateToRegion(region, 1000);
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const getPlaceName = async (lat: number, lng: number): Promise<void> => {
    if (!lat || !lng) return; // prevent bad calls

    setLocationLoading(true);

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`;

    try {
      const { data } = await axios.get(url);

      if (data.results.length > 0) {
        const address = `${data.results[0].address_components[1].long_name}, ${data.results[0].address_components[2].long_name}`;
        setUserAddress(address);
      }
    } catch (error) {
      console.error("Error fetching place name", error);
    } finally {
      setLocationLoading(false);
    }
  };

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const getPickupSuggestions = async (text: string) => {
    try {
      const suggestions = await getSuggestions(text);
      setPickupSuggestions(suggestions);
    } catch (error: any) {
      console.log(error.message);
    }
  };
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const getDestinationSuggestions = async (text: string) => {
    try {
      const suggestions = await getSuggestions(text);
      setDestinationSuggestions(suggestions);
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const getSuggestions = async (text: string) => {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      text
    )}&key=${API_KEY}&location=${region.latitude},${
      region.longitude
    }&radius=5000&components=country:ng`;
    try {
      const { data } = await axios.get(url);
      if (data) {
        return data.predictions;
      }
    } catch (err: any) {
      throw new Error(
        err.response.data.message ||
          "An error occured when fetching suggestions"
      );
    }
  };

  const getPlaceCoords = async (
    place_id: string
  ): Promise<[number, number] | undefined> => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${API_KEY}`;
      const { data } = await axios.get(url);
      const location = data.result.geometry.location;

      return [location.lat, location.lng];
    } catch (error) {
      console.log(error);
    }
  };

  const decodePolyline = (points: any) => {
    let coords = Polyline.decode(points);
    return coords.map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng,
    }));
  };

  const [calculating, setCalculating] = useState<boolean>(false);

  // General function to get distance and duration from Google Maps API
  const getDistanceAndDuration = async (
    pickup: [number, number],
    destination: [number, number]
  ): Promise<{ distanceKm: number; durationMins: number } | undefined> => {
    try {
      setCalculating(true);
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${pickup[0]},${pickup[1]}&destinations=${destination[0]},${destination[1]}&key=${API_KEY}`;

      const { data } = await axios.get(url);

      if (data.rows[0].elements[0].status === "OK") {
        const distanceMeters = data.rows[0].elements[0].distance.value; // in meters
        const durationSeconds = data.rows[0].elements[0].duration.value; // in seconds

        const distanceKm = Math.round(distanceMeters / 1000);
        const durationMins = Math.round(durationSeconds / 60);

        return {
          distanceKm,
          durationMins,
        };
      }
    } catch (error) {
      console.error("Error fetching distance and duration:", error);
    } finally {
      setCalculating(false);
    }
  };

  const calculateRide = async (
    pickup: [number, number],
    destination: [number, number]
  ): Promise<{ distanceKm: number; durationMins: number } | undefined> => {
    const result = await getDistanceAndDuration(pickup, destination);

    if (result) {
      const { distanceKm, durationMins } = result;

      const BASE_FARE = Number(process.env.EXPO_PUBLIC_BASE_FARE);
      const PRICE_PER_KM = Number(process.env.EXPO_PUBLIC_PRICE_PER_KM);
      const PRICE_PER_MIN = Number(process.env.EXPO_PUBLIC_PRICE_PER_MIN);

      // multipliers for vehicle types — tweak as needed or replace with env vars
      const MULT = {
        cab: 1.0,
        keke: 0.6,
        suv: 1.4,
      };

      const computeAmount = (mult: number) => {
        const raw =
          BASE_FARE * mult +
          distanceKm * PRICE_PER_KM * mult +
          durationMins * PRICE_PER_MIN * mult;
        return Math.ceil(raw / 10) * 10;
      };

      const cabAmount = computeAmount(MULT.cab);
      const kekeAmount = computeAmount(MULT.keke);
      const suvAmount = computeAmount(MULT.suv);

      // keep top-level amount as cab for backward compatibility
      setRideDetails({
        distanceKm,
        durationMins,
        amount: cabAmount,
        cab: { amount: cabAmount },
        keke: { amount: kekeAmount },
        suv: { amount: suvAmount },
      });

      return result;
    }
  };

  const calculateDelivery = async (
    pickup: [number, number],
    destination: [number, number]
  ): Promise<
    | {
        distanceKm: number;
        durationMins: number;
        bike: { amount: number };
        cab: { amount: number };
        van: { amount: number };
        truck: { amount: number };
      }
    | undefined
  > => {
    const result = await getDistanceAndDuration(pickup, destination);

    if (result) {
      const { distanceKm, durationMins } = result;

      // Delivery pricing (adjust these as needed)
      const DELIVERY_BASE_FARE =
        Number(process.env.EXPO_PUBLIC_BASE_FARE) || 500;
      const DELIVERY_PRICE_PER_KM =
        Number(process.env.EXPO_PUBLIC_PRICE_PER_KM) || 100;
      const DELIVERY_PRICE_PER_MIN =
        Number(process.env.EXPO_PUBLIC_PRICE_PER_MIN) || 20;

      // Delivery vehicle multipliers
      const DELIVERY_MULT = {
        bike: 0.8, // Cheapest for small packages
        cab: 1.0, // Standard car delivery
        van: 1.5, // Larger packages
        truck: 2.0, // Heavy-duty deliveries
      };

      const computeDeliveryAmount = (mult: number) => {
        const raw =
          DELIVERY_BASE_FARE * mult +
          distanceKm * DELIVERY_PRICE_PER_KM * mult +
          durationMins * DELIVERY_PRICE_PER_MIN * mult;
        return Math.ceil(raw / 10) * 10;
      };

      const bikeAmount = computeDeliveryAmount(DELIVERY_MULT.bike);
      const cabAmount = computeDeliveryAmount(DELIVERY_MULT.cab);
      const vanAmount = computeDeliveryAmount(DELIVERY_MULT.van);
      const truckAmount = computeDeliveryAmount(DELIVERY_MULT.truck);

      return {
        distanceKm,
        durationMins,
        bike: { amount: bikeAmount },
        cab: { amount: cabAmount },
        van: { amount: vanAmount },
        truck: { amount: truckAmount },
      };
    }
  };

  return (
    <MapContext.Provider
      value={{
        region,
        userAddress,
        setUserAddress,
        getDestinationSuggestions,
        destinationSuggestions,
        setDestinationSuggestions,
        pickupSuggestions,
        setPickupSuggestions,
        getPickupSuggestions,
        mapSuggestions,
        setMapSuggestions,
        getPlaceName,
        getSuggestions,
        set_user_location,
        getPlaceCoords,

        getRoute,

        destination,
        setDestination,
        destinationCoords,
        setDestinationCoords,
        pickupCoords,
        setPickupCoords,

        fetchRoute,
        calculateRide,
        calculateDelivery,
        getDistanceAndDuration,
        calculating,
        setCalculating,
        rideDetails,
        setRideDetails,

        locationLoading,
        routeCoords,
        pickupMarker,
        destinationMarker,
        mapRef,
        mapPadding,
        setMapPadding,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

type MapPadding = {
  bottom: number;
  top: number;
  left: number;
  right: number;
};

type CoordsType = { latitude: number; longitude: number };

export interface MapContextType {
  region: any;
  set_user_location: () => Promise<void>;
  userAddress: string;
  setUserAddress: Dispatch<SetStateAction<string>>;
  getSuggestions: (text: string) => Promise<any>;
  mapSuggestions: any;
  setMapSuggestions: Dispatch<SetStateAction<any>>;
  getDestinationSuggestions: (text: string) => Promise<void>;
  destinationSuggestions: any;
  setDestinationSuggestions: Dispatch<SetStateAction<any>>;
  getPickupSuggestions: (text: string) => Promise<void>;
  pickupSuggestions: any;
  setPickupSuggestions: Dispatch<SetStateAction<any>>;

  getRoute: (pickup: [number, number], destination: [number, number]) => any;

  destination: string;
  setDestination: Dispatch<SetStateAction<string>>;
  destinationCoords: [number, number] | null;
  setDestinationCoords: Dispatch<SetStateAction<[number, number] | null>>;
  pickupCoords: [number, number] | null;
  setPickupCoords: Dispatch<SetStateAction<[number, number] | null>>;

  getPlaceCoords: (place_id: string) => Promise<[number, number] | undefined>;
  getPlaceName: (lat: number, lng: number) => Promise<void>;
  fetchRoute: (destinationCoords: [number, number]) => Promise<void>;
  getDistanceAndDuration: (
    pickup: [number, number],
    destination: [number, number]
  ) => Promise<{ distanceKm: number; durationMins: number } | undefined>;
  calculateRide: (
    pickup: [number, number],
    destination: [number, number]
  ) => Promise<{ distanceKm: number; durationMins: number } | undefined>;
  calculateDelivery: (
    pickup: [number, number],
    destination: [number, number]
  ) => Promise<
    | {
        distanceKm: number;
        durationMins: number;
        bike: { amount: number };
        cab: { amount: number };
        van: { amount: number };
        truck: { amount: number };
      }
    | undefined
  >;
  calculating: boolean;
  setCalculating: Dispatch<SetStateAction<boolean>>;

  rideDetails: {
    distanceKm: number;
    durationMins: number;
    amount: number;
    cab: { amount: number };
    keke: { amount: number };
    suv: { amount: number };
  } | null;
  setRideDetails: Dispatch<
    SetStateAction<{
      distanceKm: number;
      durationMins: number;
      amount: number;
      cab: { amount: number };
      keke: { amount: number };
      suv: { amount: number };
    } | null>
  >;

  locationLoading: boolean;

  routeCoords: { latitude: number; longitude: number }[];
  pickupMarker: CoordsType | null;
  destinationMarker: CoordsType | null;
  mapRef: any;
  mapPadding: MapPadding;
  setMapPadding: Dispatch<SetStateAction<MapPadding>>;
}

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context)
    throw new Error("Map context must be used inside the Map Provider");
  return context;
};

export default MapContextProvider;

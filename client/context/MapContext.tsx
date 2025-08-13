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
  useEffect(() => {
    set_user_location();
  }, []);

  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  const [userAddress, setUserAddress] = useState<string>("");

  const [destination, setDestination] = useState<string>("");
  const [destinationCoords, setDestinationCoords] = useState<[number, number]>([
    0, 0,
  ]);

  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  const mapRef = useRef<MapView>(null);
  useEffect(() => {
    const fetchRoute = async () => {
      const coords = await getRoute(
        [region.latitude, region.longitude],
        destinationCoords
      );
      if (coords) {
        setRouteCoords(coords);
        // 👇 Zoom map to fit route
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    };

    fetchRoute();
  }, [destinationCoords]);

  const [mapSuggestions, setMapSuggestions] = useState<any>(null);
  const [region, setRegion] = useState<any>(null);

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
      await getPlaceName(location.coords.latitude, location.coords.longitude);
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const getPlaceName = async (lat: number, lng: number): Promise<void> => {
    setLocationLoading(true);
    const apiKey = "AIzaSyDdZZ0ji5pbx3ddhhlvYugGNvSxOOC3Zss";

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

    try {
      const { data } = await axios.get(url);

      if (data.results.length > 0) {
        setLocationLoading(false);
        setUserAddress(data.results[0].formatted_address);
      }
    } catch (error) {
      console.error("Error fetching place name", error);
    } finally {
      setLocationLoading(false);
    }
  };

  const getSuggestions = async (text: string) => {
    const apiKey = "AIzaSyDdZZ0ji5pbx3ddhhlvYugGNvSxOOC3Zss";
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      text
    )}&key=${apiKey}&components=country:ng`;

    try {
      const { data } = await axios.get(url);
      if (data) {
        setMapSuggestions(data.predictions || []);
      }
    } catch (err: any) {
      console.log(
        err.response.data.message ||
          "An error occured when fetching suggestions"
      );
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
      const apiKey = "AIzaSyDdZZ0ji5pbx3ddhhlvYugGNvSxOOC3Zss";
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${apiKey}`;
      const { data } = await axios.get(url);
      const location = data.result.geometry.location;

      return [location.lat, location.lng];
    } catch (error) {
      console.log(error);
    }
  };

  const decodePolyline = (encoded: any) => {
    let coords = Polyline.decode(encoded);
    return coords.map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng,
    }));
  };

  const getRoute = async (
    pickup: [number, number],
    destination: [number, number]
  ) => {
    const apiKey = "AIzaSyDdZZ0ji5pbx3ddhhlvYugGNvSxOOC3Zss";
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup[0]},${pickup[1]}&destination=${destination[0]},${destination[1]}&key=${apiKey}`;

    try {
      const response = await axios.get(url);
      const points = response.data.routes[0].overview_polyline.points;
      return decodePolyline(points);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <MapContext.Provider
      value={{
        region,
        userAddress,
        setUserAddress,
        mapSuggestions,
        setMapSuggestions,
        getPlaceName,
        getSuggestions,
        set_user_location,
        getPlaceCoords,

        destination,
        setDestination,
        destinationCoords,
        setDestinationCoords,

        locationLoading,
        routeCoords,
        mapRef,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export interface MapContextType {
  region: any;
  set_user_location: () => Promise<void>;
  userAddress: string;
  setUserAddress: Dispatch<SetStateAction<string>>;
  getSuggestions: (text: string) => Promise<void>;
  mapSuggestions: any;
  setMapSuggestions: Dispatch<SetStateAction<any>>;

  destination: string;
  setDestination: Dispatch<SetStateAction<string>>;
  destinationCoords: [number, number];
  setDestinationCoords: Dispatch<SetStateAction<[number, number]>>;

  getPlaceCoords: (place_id: string) => Promise<[number, number] | undefined>;
  getPlaceName: (lat: number, lng: number) => Promise<void>;

  locationLoading: boolean;

  routeCoords: { latitude: number; longitude: number }[];
  mapRef: any;
}

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context)
    throw new Error("Map context must be used inside the Map Provider");
  return context;
};

export default MapContextProvider;

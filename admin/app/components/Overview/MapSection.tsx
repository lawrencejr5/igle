"use client";

import { useState } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

const MapSection = () => {
  const [activeTab, setActiveTab] = useState<"rides" | "deliveries">("rides");

  const mapContainerStyle = {
    width: "100%",
    height: "100%",
  };

  const center = {
    lat: 40.7128,
    lng: -74.006,
  };

  return (
    <>
      <div className="map-section__tabs">
        <button
          className={`map-section__tab ${
            activeTab === "rides" ? "map-section__tab--active" : ""
          }`}
          onClick={() => setActiveTab("rides")}
        >
          Rides Map
        </button>
        <button
          className={`map-section__tab ${
            activeTab === "deliveries" ? "map-section__tab--active" : ""
          }`}
          onClick={() => setActiveTab("deliveries")}
        >
          Deliveries Map
        </button>
      </div>
      <div className="map-section">
        <div className="map-section__content">
          <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
          >
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={12}
              options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
              }}
            />
          </LoadScript>
        </div>
      </div>
    </>
  );
};

export default MapSection;

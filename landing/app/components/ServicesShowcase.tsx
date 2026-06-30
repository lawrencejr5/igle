"use client";

import { useState, useEffect } from "react";

interface VehicleOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  capacityLabel: string;
  capacityValue: string;
  image: string;
  badge?: string;
  iconSvg: React.ReactNode;
}

const RIDE_OPTIONS: VehicleOption[] = [
  {
    id: "keke",
    name: "Igle Keke",
    tagline: "Quick & Economical",
    description: "Beat the city traffic with our swift and affordable tricycles. Perfect for quick hops, narrow streets, and budget-friendly daily commuting.",
    capacityLabel: "Seats",
    capacityValue: "3 Passengers",
    image: "/images/keke-guy.jpg",
    badge: "Popular",
    iconSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 8h4l1.5 4h-7L10 8z" />
        <path d="M6 18c1.1 0 2-.9 2-2H4c0 1.1.9 2 2 2z" />
        <path d="M18 18c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z" />
        <path d="M6 16v-2h12v2" />
        <path d="M12 8V5h-2" />
      </svg>
    )
  },
  {
    id: "cab",
    name: "Igle Cab",
    tagline: "Comfortable Everyday Rides",
    description: "Enjoy a comfortable, air-conditioned ride in a clean, standard sedan. Perfect for work commutes, running errands, or heading out with friends.",
    capacityLabel: "Seats",
    capacityValue: "4 Passengers",
    image: "/images/service-ride.jpg",
    iconSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="3" />
        <circle cx="17" cy="17" r="3" />
      </svg>
    )
  },
  {
    id: "suv",
    name: "Igle SUV",
    tagline: "Premium & Spacious",
    description: "Travel in style with extra space. Our SUVs offer premium comfort, elevated seating, and plenty of room for luggage. Great for airport runs and family trips.",
    capacityLabel: "Seats",
    capacityValue: "6 Passengers",
    image: "/images/suv.png",
    badge: "Premium",
    iconSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h20M2 12v3c0 .6.4 1 1 1h2M22 12v3c0 .6-.4 1-1 1h-2" />
        <path d="M5 16h14v-5c0-.9-.8-1.5-1.5-1.8l-3.2-1.2C13.6 7.7 12.8 7 12 7H7c-.9 0-1.5.6-1.8 1.2L3.6 11.2C3.1 11.5 2.5 12.1 2.5 13v3" />
        <circle cx="7" cy="16" r="3" />
        <circle cx="17" cy="16" r="3" />
      </svg>
    )
  }
];

const DELIVERY_OPTIONS: VehicleOption[] = [
  {
    id: "bike",
    name: "Igle Bike Dispatch",
    tagline: "Ultra-Fast Deliveries",
    description: "The fastest way to send documents, parcels, food, or small items across the city. Our dispatch riders navigate traffic with ease to deliver in minutes.",
    capacityLabel: "Max Weight",
    capacityValue: "Up to 15 kg",
    image: "/images/delivery-guy.jpg",
    badge: "Fastest",
    iconSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="16" r="3" />
        <circle cx="19" cy="16" r="3" />
        <path d="M12 16V10H8l-3 4" />
        <path d="M12 10l3-5h4M19 13v-3" />
      </svg>
    )
  },
  {
    id: "cab_delivery",
    name: "Igle Courier Cab",
    tagline: "Protected & Secure",
    description: "Need to send fragile items, cakes, or larger boxes that require air-conditioned safety? Our courier cabs keep your items flat and protected.",
    capacityLabel: "Max Weight",
    capacityValue: "Up to 50 kg",
    image: "/images/service-delivery.jpg",
    iconSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="3" />
        <circle cx="17" cy="17" r="3" />
        <rect x="9" y="3" width="6" height="4" rx="1" fill="currentColor" opacity="0.15" />
      </svg>
    )
  },
  {
    id: "van",
    name: "Igle Cargo Van",
    tagline: "Spacious & Versatile",
    description: "Ideal for e-commerce deliveries, bulk shipments, office documents, or medium furniture. Weather-protected cargo space for your business and personal needs.",
    capacityLabel: "Max Volume",
    capacityValue: "Up to 500 kg",
    image: "/images/delivery-guy-standing.jpg",
    iconSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 16h2M19 16h2" />
        <path d="M3 8h11v8H3z" />
        <path d="M14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="16" r="2.5" />
        <circle cx="17" cy="16" r="2.5" />
      </svg>
    )
  },
  {
    id: "truck",
    name: "Igle Heavy Truck",
    tagline: "Logistics & Moving",
    description: "Full-scale moving and heavy transport made simple. Book flatbeds or box trucks for industrial supplies, home relocation, and bulky logistics.",
    capacityLabel: "Max Load",
    capacityValue: "Up to 2,000+ kg",
    image: "/images/banner.png",
    badge: "Heavy Duty",
    iconSvg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 16h2M2 16h2" />
        <path d="M2 6h12v10H2z" />
        <path d="M14 9h5l3 3v4h-8z" />
        <circle cx="6" cy="16" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    )
  }
];

export default function ServicesShowcase() {
  const [activeTab, setActiveTab] = useState<"rides" | "delivery">("rides");
  const [selectedId, setSelectedId] = useState<string>("keke");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Set default selection when switching tabs
  const handleTabChange = (tab: "rides" | "delivery") => {
    setActiveTab(tab);
    setSelectedId(tab === "rides" ? "keke" : "bike");
  };

  const currentOptions = activeTab === "rides" ? RIDE_OPTIONS : DELIVERY_OPTIONS;

  const activeOption = currentOptions.find((opt) => opt.id === selectedId) || currentOptions[0];

  // Fallback image helper
  const getDisplayImage = (opt: VehicleOption) => {
    if (!opt.image) {
      if (opt.id === "bike") return "/images/delivery-guy.jpg";
      return "/images/service-delivery.jpg";
    }
    return opt.image;
  };

  // Trigger a subtle fade transition on option change
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 200);
    return () => clearTimeout(timer);
  }, [selectedId]);

  return (
    <section className="services-showcase" id="services">
      <div className="container">
        <div className="section-header text-center">
          <span className="badge-pill">Our Services</span>
          <h2>Designed for how you move and deliver</h2>
          <p className="section-subtitle">
            Whether you need a quick ride across town or want to send items of any size, Igle has a vehicle tailored for you.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === "rides" ? "active" : ""}`}
            onClick={() => handleTabChange("rides")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="3" />
              <circle cx="17" cy="17" r="3" />
            </svg>
            Ride Hailing
          </button>
          <button
            className={`tab-btn ${activeTab === "delivery" ? "active" : ""}`}
            onClick={() => handleTabChange("delivery")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Package Delivery
          </button>
        </div>

        {/* Main Content Area */}
        <div className="showcase-content">
          {/* Left: Vehicle Selection List */}
          <div className="selection-list">
            {currentOptions.map((opt) => {
              const isSelected = opt.id === selectedId;
              return (
                <button
                  key={opt.id}
                  className={`selection-item ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedId(opt.id)}
                >
                  <div className="item-left-content">
                    <div className="vehicle-icon-wrapper">
                      {opt.iconSvg}
                    </div>
                    <div className="item-meta">
                      <div className="item-title-row">
                        <span className="item-name">{opt.name}</span>
                        {opt.badge && <span className="item-badge">{opt.badge}</span>}
                      </div>
                      <span className="item-tagline">{opt.tagline}</span>
                    </div>
                  </div>
                  <div className="item-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Interactive Preview Display */}
          <div className={`preview-display ${isTransitioning ? "fade-out" : "fade-in"}`}>
            <div className="preview-image-wrapper">
              <img
                src={getDisplayImage(activeOption)}
                alt={activeOption.name}
                className="preview-image"
              />
              <div className="preview-overlay">
                <div className="capacity-badge">
                  <span className="label">{activeOption.capacityLabel}</span>
                  <span className="value">{activeOption.capacityValue}</span>
                </div>
              </div>
            </div>
            
            <div className="preview-details">
              <h3>{activeOption.name}</h3>
              <p className="tagline">{activeOption.tagline}</p>
              <p className="description">{activeOption.description}</p>
              
              <div className="preview-actions">
                <a
                  href="https://play.google.com/store/apps/details?id=com.lawrencejr.igle"
                  target="_blank"
                  className="btn-pill"
                >
                  {activeTab === "rides" ? "Book a Ride Now" : "Send a Package Now"}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: "8px" }}>
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

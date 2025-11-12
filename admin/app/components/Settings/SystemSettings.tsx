"use client";

import { useState, useEffect } from "react";
import { FiSave } from "react-icons/fi";
import {
  useSystemSettings,
  FareSettings,
  DeliveryFareSettings,
} from "../../context/SystemSettingsContext";

const SystemSettings = () => {
  const { settings, loading, fetchSettings, updateSettings } =
    useSystemSettings();

  const [rideFare, setRideFare] = useState<FareSettings>({
    baseFare: 500,
    costPerKm: 150,
    costPerMinute: 50,
    minimumFare: 800,
    commissionRate: 15,
    cancellationFee: 300,
  });

  const [deliveryFare, setDeliveryFare] = useState<DeliveryFareSettings>({
    baseDeliveryFee: 600,
    costPerKm: 100,
    weightBasedFee: 200,
    minimumDeliveryFee: 1000,
  });

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Update local state when settings are fetched
  useEffect(() => {
    if (settings) {
      if (settings.rideFare) {
        setRideFare(settings.rideFare);
      }
      if (settings.deliveryFare) {
        setDeliveryFare(settings.deliveryFare);
      }
    }
  }, [settings]);

  const handleRideFareChange = (field: keyof FareSettings, value: string) => {
    setRideFare((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleDeliveryFareChange = (
    field: keyof DeliveryFareSettings,
    value: string
  ) => {
    setDeliveryFare((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleSaveRideFare = async () => {
    try {
      await updateSettings(rideFare, undefined);
    } catch (error) {
      console.error("Failed to save ride fare settings:", error);
    }
  };

  const handleSaveDeliveryFare = async () => {
    try {
      await updateSettings(undefined, deliveryFare);
    } catch (error) {
      console.error("Failed to save delivery fare settings:", error);
    }
  };

  return (
    <div className="settings-content">
      {/* Ride Fare Settings Section */}
      <div className="settings-section">
        <h3 className="settings-section__title">Ride Fare Settings</h3>
        <div className="settings-form">
          <div className="settings-form-row">
            <div className="settings-form-group">
              <label className="settings-form-group__label">
                Base Fare (₦)
                <span className="settings-form-group__hint">
                  Initial fare when trip starts
                </span>
              </label>
              <input
                type="number"
                value={rideFare.baseFare}
                onChange={(e) =>
                  handleRideFareChange("baseFare", e.target.value)
                }
                className="settings-form-group__input"
                placeholder="500"
                min="0"
                disabled={loading}
              />
            </div>

            <div className="settings-form-group">
              <label className="settings-form-group__label">
                Cost per km (₦/km)
              </label>
              <input
                type="number"
                value={rideFare.costPerKm}
                onChange={(e) =>
                  handleRideFareChange("costPerKm", e.target.value)
                }
                className="settings-form-group__input"
                placeholder="150"
                min="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="settings-form-row">
            <div className="settings-form-group">
              <label className="settings-form-group__label">
                Cost per minute (₦/min)
              </label>
              <input
                type="number"
                value={rideFare.costPerMinute}
                onChange={(e) =>
                  handleRideFareChange("costPerMinute", e.target.value)
                }
                className="settings-form-group__input"
                placeholder="50"
                min="0"
                disabled={loading}
              />
            </div>

            <div className="settings-form-group">
              <label className="settings-form-group__label">
                Minimum Fare (₦)
              </label>
              <input
                type="number"
                value={rideFare.minimumFare}
                onChange={(e) =>
                  handleRideFareChange("minimumFare", e.target.value)
                }
                className="settings-form-group__input"
                placeholder="800"
                min="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="settings-form-row">
            <div className="settings-form-group">
              <label className="settings-form-group__label">
                Commission Rate (%)
                <span className="settings-form-group__hint">
                  For platform earnings
                </span>
              </label>
              <input
                type="number"
                value={rideFare.commissionRate}
                onChange={(e) =>
                  handleRideFareChange("commissionRate", e.target.value)
                }
                className="settings-form-group__input"
                placeholder="15"
                min="0"
                max="100"
                disabled={loading}
              />
            </div>

            <div className="settings-form-group">
              <label className="settings-form-group__label">
                Cancellation Fee (₦)
              </label>
              <input
                type="number"
                value={rideFare.cancellationFee}
                onChange={(e) =>
                  handleRideFareChange("cancellationFee", e.target.value)
                }
                className="settings-form-group__input"
                placeholder="300"
                min="0"
                disabled={loading}
              />
            </div>
          </div>

          <button
            className="btn btn--primary"
            onClick={handleSaveRideFare}
            disabled={loading}
          >
            <FiSave />
            {loading ? "Saving..." : "Save Ride Fare Settings"}
          </button>
        </div>
      </div>

      {/* Delivery Fare Settings Section */}
      <div className="settings-section">
        <h3 className="settings-section__title">Delivery Fare Settings</h3>
        <div className="settings-form">
          <div className="settings-form-row">
            <div className="settings-form-group">
              <label className="settings-form-group__label">
                Base Delivery Fee (₦)
              </label>
              <input
                type="number"
                value={deliveryFare.baseDeliveryFee}
                onChange={(e) =>
                  handleDeliveryFareChange("baseDeliveryFee", e.target.value)
                }
                className="settings-form-group__input"
                placeholder="600"
                min="0"
                disabled={loading}
              />
            </div>

            <div className="settings-form-group">
              <label className="settings-form-group__label">
                Cost per km (₦/km)
              </label>
              <input
                type="number"
                value={deliveryFare.costPerKm}
                onChange={(e) =>
                  handleDeliveryFareChange("costPerKm", e.target.value)
                }
                className="settings-form-group__input"
                placeholder="100"
                min="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="settings-form-row">
            <div className="settings-form-group">
              <label className="settings-form-group__label">
                Weight-based Fee (₦ per kg)
              </label>
              <input
                type="number"
                value={deliveryFare.weightBasedFee}
                onChange={(e) =>
                  handleDeliveryFareChange("weightBasedFee", e.target.value)
                }
                className="settings-form-group__input"
                placeholder="200"
                min="0"
                disabled={loading}
              />
            </div>

            <div className="settings-form-group">
              <label className="settings-form-group__label">
                Minimum Delivery Fee (₦)
              </label>
              <input
                type="number"
                value={deliveryFare.minimumDeliveryFee}
                onChange={(e) =>
                  handleDeliveryFareChange("minimumDeliveryFee", e.target.value)
                }
                className="settings-form-group__input"
                placeholder="1000"
                min="0"
                disabled={loading}
              />
            </div>
          </div>

          <button
            className="btn btn--primary"
            onClick={handleSaveDeliveryFare}
            disabled={loading}
          >
            <FiSave />
            {loading ? "Saving..." : "Save Delivery Fare Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;

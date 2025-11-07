"use client";

import { useState } from "react";
import { FiSave } from "react-icons/fi";

interface RideFareSettings {
  baseFare: number;
  costPerKm: number;
  costPerMinute: number;
  minimumFare: number;
  commissionRate: number;
  cancellationFee: number;
}

interface DeliveryFareSettings {
  baseDeliveryFee: number;
  costPerKm: number;
  weightBasedFee: number;
  minimumDeliveryFee: number;
}

const SystemSettings = () => {
  const [rideFare, setRideFare] = useState<RideFareSettings>({
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

  const handleRideFareChange = (
    field: keyof RideFareSettings,
    value: string
  ) => {
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

  const handleSaveRideFare = () => {
    // TODO: Implement API call to update ride fare settings
    console.log("Saving ride fare settings:", rideFare);
  };

  const handleSaveDeliveryFare = () => {
    // TODO: Implement API call to update delivery fare settings
    console.log("Saving delivery fare settings:", deliveryFare);
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
              />
            </div>
          </div>

          <button className="btn btn--primary" onClick={handleSaveRideFare}>
            <FiSave />
            Save Ride Fare Settings
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
              />
            </div>
          </div>

          <button className="btn btn--primary" onClick={handleSaveDeliveryFare}>
            <FiSave />
            Save Delivery Fare Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;

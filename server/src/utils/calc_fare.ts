import dotenv from "dotenv";
dotenv.config();

export const calculate_fare = (
  distance_km: number,
  duration_min: number
): number => {
  if (isNaN(distance_km) || isNaN(duration_min))
    throw new Error("Distance or duration isNan");

  const BASE_FARE = Number(process.env.BASE_FARE);
  const PRICE_PER_KM = Number(process.env.PRICE_PER_KM);
  const PRICE_PER_MIN = Number(process.env.PRICE_PER_MIN);

  if ([BASE_FARE, PRICE_PER_KM, PRICE_PER_MIN].some(isNaN)) {
    throw new Error(
      "One or more fare configuration values are missing or invalid"
    );
  }
  const fare =
    BASE_FARE + distance_km * PRICE_PER_KM + duration_min * PRICE_PER_MIN;
  return Math.ceil(fare / 100) * 10;
};

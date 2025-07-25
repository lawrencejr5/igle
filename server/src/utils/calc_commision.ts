import dotenv from "dotenv";
dotenv.config();

const PERCENTAGE = Number(process.env.COMMISSION_PERCENT);

export const calculate_commission = (fare: number) => {
  return Math.round((PERCENTAGE / 100) * fare);
};

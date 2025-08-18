import axios from "axios";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const paystack_api = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export interface PaystackInputType {
  email: string;
  amount: number;
  reference: string;
  callback_url: string;
}

export const initialize_paystack_transaction = async ({
  email,
  amount,
  reference,
  callback_url,
}: PaystackInputType) => {
  const { data } = await paystack_api.post("/transaction/initialize", {
    email,
    amount: amount * 100, // Paystack expects amount in kobo
    reference,
    callback_url,
  });

  return data.data; // contains authorization_url, access_code, reference
};

export const verify_paystack_transaction = async (reference: string) => {
  const { data } = await paystack_api.get(`/transaction/verify/${reference}`);
  return data.data; // contains status, customer, amount, etc.
};

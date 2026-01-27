import mongoose from "mongoose";

export const connect_db = async (url: string): Promise<void> => {
  try {
    await mongoose.connect(url, { dbName: "igle" });
    mongoose.set("transactionAsyncLocalStorage", true);
  } catch (err) {
    console.log(err);
    return;
  }
};

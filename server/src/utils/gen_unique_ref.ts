export const generate_unique_reference = (): string => {
  return `txn_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
};

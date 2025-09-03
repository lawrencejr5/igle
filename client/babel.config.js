module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"], // 👈 keeps Expo defaults
    plugins: [
      "react-native-reanimated/plugin", // 👈 adds reanimated support
    ],
  };
};

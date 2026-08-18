module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "expo-asset",
      "react-native-reanimated/plugin", // 👈 Must be the LAST plugin
    ],
  };
};

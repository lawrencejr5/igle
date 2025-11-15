import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  FlatList,
  ViewToken,
} from "react-native";
import OnboardingScreen1 from "../components/onboarding/OnboardingScreen1";
import OnboardingScreen2 from "../components/onboarding/OnboardingScreen2";
import OnboardingScreen3 from "../components/onboarding/OnboardingScreen3";
import { useOnboardingContext } from "../context/OnboardingContext";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const OnboardingScreens = () => {
  const { completeOnboarding } = useOnboardingContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const screens = [
    { id: "1", component: OnboardingScreen1 },
    { id: "2", component: OnboardingScreen2 },
    { id: "3", component: OnboardingScreen3 },
  ];

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < screens.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    await completeOnboarding();
    router.replace("get_started");
  };

  const renderItem = ({
    item,
  }: {
    item: { id: string; component: React.FC };
  }) => {
    const Component = item.component;
    return (
      <View style={{ width }}>
        <Component />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={screens}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {screens.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.activeIndicator,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentIndex < screens.length - 1 ? (
            <>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
                activeOpacity={0.7}
              >
                <Text style={styles.nextText}>Next</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleNext}
              activeOpacity={0.7}
            >
              <Text style={styles.nextText}>Get Started</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default OnboardingScreens;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
    paddingTop: 20,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  indicator: {
    width: 10,
    height: 6,
    borderRadius: 5,
    backgroundColor: "#404040",
    marginHorizontal: 5,
  },
  activeIndicator: {
    backgroundColor: "#fff",
    width: 30,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  skipText: {
    color: "#b0b0b0",
    fontSize: 16,
    fontFamily: "raleway-semibold",
  },
  nextButton: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    minWidth: 150,
    alignItems: "center",
  },
  getStartedButton: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
  },
  nextText: {
    color: "#121212",
    fontSize: 16,
    fontFamily: "raleway-bold",
  },
});

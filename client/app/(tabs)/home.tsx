import { StyleSheet, View, Text } from "react-native";
import React, { useMemo } from "react";

import Notification from "../../components/Notification";
import { useNotificationContext } from "../../context/NotificationContext";

import { useLoading } from "../../context/LoadingContext";
import AppLoading from "../../loadings/AppLoading";

import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

const Home = () => {
  const { notification } = useNotificationContext();
  const { appLoading } = useLoading();

  const snapPoints = useMemo(() => ["25%", "50%", "75%"], []);

  return (
    <>
      {appLoading ? (
        <AppLoading />
      ) : (
        <>
          <Notification notification={notification} />
          <View style={{ flex: 1, backgroundColor: "grey" }}>
            <BottomSheet
              index={0}
              snapPoints={snapPoints}
              backgroundStyle={{ backgroundColor: "lightblue" }}
            >
              <BottomSheetView
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text>Visible?</Text>
              </BottomSheetView>
            </BottomSheet>
          </View>
        </>
      )}
    </>
  );
};

export default Home;

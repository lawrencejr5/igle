import { StyleSheet } from "react-native";

export const auth_styles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#121212",
      paddingHorizontal: 10,
      paddingTop: 50,
      paddingBottom: 30,
    },
    header_text: {
      fontFamily: "raleway-bold",
      color: "#fff",
      fontSize: 27,
    },
    sub_header_text: {
      fontFamily: "raleway-semibold",
      color: "#bfbaba",
      fontSize: 12,
      marginTop: 5,
    },
    inp_container: { marginTop: 15 },
    inp_label: {
      color: "#fff",
      fontFamily: "raleway-semibold",
      fontSize: 12,
    },
    inp_holder: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      backgroundColor: "#757575ff",
      gap: 10,
      paddingHorizontal: 15,
      paddingVertical: 7,
      marginTop: 10,
      borderRadius: 7,
    },
    inp_text: {
      fontFamily: "raleway-semibold",
      color: "#e2e1e1ff",
      fontSize: 10,
      marginLeft: 3,
    },
    text_input: {
      backgroundColor: "transparent",
      flex: 1,
      fontFamily: "raleway-semibold",
      color: "#fff",
      fontSize: 14,
    },
    password_input: {
      flexDirection: "row",
      justifyContent: "flex-start",
      gap: 10,
    },
    check_container: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
    },
    sign_btn: {
      backgroundColor: "#fff",
      width: "100%",
      padding: 12,
      borderRadius: 30,
      marginTop: 30,
      alignItems: "center",
    },
    sign_btn_text: {
      color: "#000",
      fontFamily: "raleway-bold",
      fontSize: 16,
    },
    or_container: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 20,
    },
    or_text: {
      marginHorizontal: 10,
      color: "#fff",
      fontFamily: "raleway-semibold",
    },
    oauth_btn: {
      backgroundColor: "#ffffff50",
      width: 160,
      flexDirection: "row",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 15,
      paddingHorizontal: 10,
      borderRadius: 30,
    },
    oauth_img: {
      width: 20,
      height: 20,
    },
    oauth_text: {
      color: "#fff",
      fontFamily: "raleway-bold",
      fontSize: 14,
    },
  });

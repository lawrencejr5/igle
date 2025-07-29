import { StyleSheet } from "react-native";

export const auth_styles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#121212",
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    header_text: {
      fontFamily: "raleway-bold",
      color: "#fff",
      fontSize: 27,
    },
    sub_header_text: {
      fontFamily: "raleway-semibold",
      color: "#bfbabaff",
      fontSize: 12,
      marginTop: 5,
    },
    inp_container: {
      backgroundColor: "#ffffff60",
      paddingHorizontal: 15,
      paddingTop: 10,
      borderRadius: 12,
      marginTop: 25,
    },
    inp_text: {
      fontFamily: "raleway-semibold",
      color: "#e2e1e1ff",
      fontSize: 10,
      marginLeft: 3,
    },
    text_input: {
      color: "#fff",
      fontFamily: "raleway-semibold",
      fontSize: 14,
      paddingBottom: 15,
      paddingTop: 5,
      width: "90%",
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
      marginTop: 20,
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
      marginVertical: 20,
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
      gap: 5,
      paddingVertical: 15,
      paddingHorizontal: 10,
      borderRadius: 30,
    },
    oauth_img: {
      width: 15,
      height: 15,
    },
    oauth_text: {
      color: "#fff",
      fontFamily: "raleway-bold",
      fontSize: 10,
    },
  });

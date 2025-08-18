import { WebView } from "react-native-webview";

import axios from "axios";

export default function PaystackScreen({ route, navigation }: any) {
  const { paymentUrl } = route.params; // pass it from fundWallet call

  const handleNavigation = (event: any) => {
    if (event.url.startsWith("igle://paystack-redirect")) {
      // Paystack redirected back to your deep link
      const reference = new URL(event.url).searchParams.get("reference");

      // call your backend verify_payment
      axios
        .get(`http://<your-api>/verify_payment?reference=${reference}`)
        .then((res) => {
          console.log("Payment verified:", res.data);
          navigation.goBack(); // or navigate to success screen
        })
        .catch((err) => console.error("Verification failed:", err));
    }
  };

  return (
    <WebView
      source={{ uri: paymentUrl }}
      onNavigationStateChange={handleNavigation}
    />
  );
}

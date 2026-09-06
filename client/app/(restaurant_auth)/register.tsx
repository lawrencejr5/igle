import { Redirect } from "expo-router";
import React from "react";

// The restaurant registration flow now starts at restaurant_details.
// This redirect ensures any link to "register" lands on the right page.
const Register = () => {
  return <Redirect href="/(restaurant_auth)/restaurant_details" />;
};

export default Register;

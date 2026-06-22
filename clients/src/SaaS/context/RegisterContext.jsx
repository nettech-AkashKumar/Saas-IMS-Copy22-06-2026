import { createContext, useContext, useState } from "react";

const RegisterContext = createContext();

export const RegisterProvider = ({ children }) => {
  const [registerData, setRegisterData] = useState({
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    phone: "",

    companyName: "",
    companyEmail: "",
    companyPhone: "",
    employeeSize: "",
    industry: "",
    gst: "",

    subdomain: "",
    website: "",
    plan: "FREE",
  });

  return (
    <RegisterContext.Provider value={{ registerData, setRegisterData }}>
      {children}
    </RegisterContext.Provider>
  );
};

export const useRegister = () => useContext(RegisterContext);
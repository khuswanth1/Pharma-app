import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("pharmacy_user");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });



  const loginUser = (userData, token) => {
    setUser(userData);
    localStorage.setItem("pharmacy_user", JSON.stringify(userData));
    if (token) {
      localStorage.setItem("pharmacy_token", token);
    }
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem("pharmacy_user");
    localStorage.removeItem("pharmacy_token");
  };

  // Restore login from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("pharmacy_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};


import React, { createContext, useState, useContext } from 'react';

// Create the authentication context
const AuthContext = createContext();

// AuthProvider component will manage the authentication state and provide it
export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(
        Boolean(localStorage.getItem('user')) // Check if user is already logged in
    );

    const login = () => {
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify({ username: 'user' })); // Set user in localStorage
    };

    const logout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('user'); // Remove user from localStorage
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to access the authentication context
export const useAuth = () => useContext(AuthContext);

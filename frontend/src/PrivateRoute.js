import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ element: Component }) => {
    const user = JSON.parse(localStorage.getItem('user')); // Get user data from localStorage
    return user ? <Component /> : <Navigate to="/login" />; // Redirect to login if not logged in
};

export default PrivateRoute;

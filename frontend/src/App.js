import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'; // <-- Add Navigate here
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import Logout from './Logout';
// A component to protect the dashboard and portfolio routes
const PrivateRoute = ({ element: Component }) => {
    const user = JSON.parse(localStorage.getItem('user')); // Get user data from localStorage
    return user ? <Component /> : <Navigate to="/login" />; // Redirect to login if not logged in
};

const Welcome = () => {
    return (
        <div>
            <h1>Welcome to the App!</h1>
            <p>To get started, please log in or register.</p>
            <nav>
                <Link to="/login">Login</Link> |
                <Link to="/register">Register</Link>
            </nav>
        </div>
    );
};

const App = () => {
    return (
        <Router>
            <div>
                <nav>
                    <Link to="/">Home</Link> |
                    <Link to="/login">Login</Link> |
                    <Link to="/register">Register</Link>

                </nav>

                <Routes>
                    <Route path="/" element={<Welcome />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/logout" element={<Logout />} />
                    {/* Protected Routes */}
                    <Route path="/dashboard" element={<PrivateRoute element={Dashboard} />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;

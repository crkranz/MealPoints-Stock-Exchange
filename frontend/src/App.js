import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import Offer from './Offer';
import MyOffer from './MyOffer';
import DM from './DM';
import MyDMs from './MyDMs';

const Welcome = () => {
    return (
        <div style={styles.welcomeContainer}>
            <div style={styles.heroSection}>
                <h1 style={styles.heroTitle}>Welcome to MealPoint Exchange</h1>
                <p style={styles.heroSubtitle}>Buy, sell, and trade MealPoints easily.</p>
                <div style={styles.buttonContainer}>
                    <Link to="/login" style={styles.button}>Login</Link>
                    <Link to="/register" style={styles.button}>Register</Link>
                </div>
            </div>

            <div style={styles.featuresSection}>
                <div style={styles.featureCard}>
                    <h2 style={styles.featureTitle}>Trade MealPoints</h2>
                    <p style={styles.featureDescription}>Buy and sell MealPoints quickly, easily, and securely.</p>
                </div>
                <div style={styles.featureCard}>
                    <h2 style={styles.featureTitle}>Track Your Portfolio</h2>
                    <p style={styles.featureDescription}>Make offers and execute instant transactions.</p>
                </div>
                <div style={styles.featureCard}>
                    <h2 style={styles.featureTitle}>Real-Time Market Data</h2>
                    <p style={styles.featureDescription}>Receive real-time updates on MealPoint prices and market trends.</p>
                </div>
            </div>
        </div>
    );
};
const App = () => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        // Retrieve loggedIn and username from localStorage
        const loggedInState = localStorage.getItem('loggedIn');
        const storedUsername = localStorage.getItem('storedUsername');

        if (loggedInState === 'true' && storedUsername) {
            setLoggedIn(true);
            setUsername(storedUsername);
        }
    }, []);

    const handleLogout = () => {
        // Remove loggedIn and username from localStorage
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('storedUsername');

        // Update state
        setLoggedIn(false);
        setUsername("");

        // Redirect to home
        navigate('/');
    };

    const handleMyOffer = () => {
        navigate('/myoffer', { state: { username } });
    };

    const handleMyDMs = () => {
        navigate('/mydms', { state: { username } });
    };

    const handleDashboard = () => {
        navigate('/dashboard', { state: { username } });
    };

    return (
        <div style={styles.mainContainer}>
            <nav style={styles.navbar}>
                <Link to="/" style={styles.navLink}>Home</Link>
                {loggedIn ? (
                    <>
                        <button onClick={handleDashboard} style={styles.navLink}>Dashboard</button>
                        <button onClick={handleMyOffer} style={styles.navLink}>My Offers</button>
                        <button onClick={handleMyDMs} style={styles.navLink}>Private Messages</button>
                        <button onClick={handleLogout} style={styles.navLink}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={styles.navLink}>Login</Link>
                        <Link to="/register" style={styles.navLink}>Register</Link>
                    </>
                )}
            </nav>

            <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/login" element={<Login setLoggedIn={setLoggedIn} setUsername={setUsername} />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/offer" element={<Offer />} />
                <Route path="/myoffer" element={<MyOffer />} />
                <Route path="/dm" element={<DM />} />
                <Route path="/mydms" element={<MyDMs />} />
            </Routes>

            <footer style={styles.footer}>
                <p>© 2024 MealPoint Exchange. All rights reserved.</p>
            </footer>
        </div>
    );
};

const styles = {
    mainContainer: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh', // Ensures footer sticks to the bottom
        fontFamily: 'Arial, sans-serif', // Unified font for the main content
    },
    navbar: {
        backgroundColor: 'rgb(204, 255, 0)', // Bright yellow-green
        color: '#000',
        padding: '3px 0', // Reduced padding
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px', // Reduced font size
    },
    navLink: {
        color: '#000', // Black text for the links
        margin: '0 13px',
        textDecoration: 'none',
        fontSize: '15px',
        background: 'none',
        border: 'none',
        fontFamily: 'Arial, sans-serif', // Ensure all links use the same font family
    },

    welcomeContainer: {
        background: '#fff', // White background
        color: '#000', // Black text for the body content
        textAlign: 'center',
        padding: '50px 20px',
        flexGrow: 1, // Ensures content area grows to fill the space
        paddingTop: '200px', // Increase top padding to push content down more
        fontFamily: 'Arial, sans-serif', // Unified font for content
    },
    heroSection: {
        marginBottom: '50px',
    },
    heroTitle: {
        fontSize: '48px',
        fontWeight: 'bold',
        margin: '0 0 10px',
    },
    heroSubtitle: {
        fontSize: '24px',
        marginBottom: '30px',
        fontWeight: '300',
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
    },
    button: {
        backgroundColor: 'rgb(204, 255, 0)', // Warm red tone
        color: '#000',
        padding: '15px 30px',
        textDecoration: 'none',
        borderRadius: '50px',
        fontSize: '18px',
        transition: 'background-color 0.3s',
        fontFamily: 'Arial, sans-serif', // Consistent font for buttons
    },
    buttonHover: {
        backgroundColor: '#FF3B2F',
    },
    featuresSection: {
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        marginTop: '50px',
    },
    featureCard: {
        backgroundColor: '#fff',
        color: '#2C3E50',
        padding: '20px',
        borderRadius: '10px',
        width: '250px',
        textAlign: 'center',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    featureTitle: {
        fontSize: '22px',
        fontWeight: 'bold',
        marginBottom: '15px',
    },
    featureDescription: {
        fontSize: '16px',
        fontWeight: '300',
    },
    footer: {
        backgroundColor: 'rgb(204, 255, 0)', // Bright yellow-green
        color: '#000',
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box',
        position: 'fixed',
        bottom: 0,
        left: 0,
        zIndex: 1000,
        height: '30px', // Set a fixed, smaller height
        display: 'flex', // Use flexbox for centering
        alignItems: 'center', // Vertically center text
        justifyContent: 'center', // Horizontally center text
        overflow: 'hidden', // Prevent content overflow
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px', // Smaller font size
        padding: '0 10px', // Add horizontal padding to avoid cutting text
        margin: 0, // Ensure no extra margin
    }

}

export default App;

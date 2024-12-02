import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (response.ok) {
                // Redirect to login page after successful registration
                navigate('/login');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('An error occurred during registration');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formContainer}>
                <h2 style={styles.title}>Register for MealPoint Exchange</h2>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                    />
                    <button type="submit" style={styles.button}>Register</button>
                </form>

                {error && <p style={styles.errorMessage}>{error}</p>}
            </div>
        </div>
    );
};

const styles = {
    container: {
        backgroundColor: '#fff', // White background
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
    },
    title: {
        textAlign: 'center',
        fontSize: '32px',
        fontWeight: 'bold',
        marginBottom: '20px',
        color: '#2C3E50', // Dark blue-grey color
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    input: {
        padding: '15px',
        fontSize: '16px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        outline: 'none',
        width: '100%',
    },
    button: {
        backgroundColor: '#3498db', // Blue button
        color: '#fff',
        padding: '15px',
        fontSize: '18px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    },
    buttonHover: {
        backgroundColor: '#2980b9',
    },
    errorMessage: {
        color: 'red',
        textAlign: 'center',
        marginTop: '10px',
    },
};

export default Register;

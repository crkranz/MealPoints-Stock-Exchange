import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DMsList = () => {
    const { state } = useLocation(); // Retrieve state passed through navigate
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // Initialize navigate

    // Get the username from the state passed through navigation
    const { username } = state || {};

    useEffect(() => {
        if (!username) {
            navigate('/login'); // Redirect to login if no username is passed
        } else {
            fetchDMUsers(username); // Fetch users who have sent DMs to the current user
        }
    }, [username, navigate]);

    const fetchDMUsers = async (username) => {
        try {
            const response = await fetch(`http://localhost:3000/getDMUsers?user=${username}`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                console.error('Failed to fetch DM users');
            }
        } catch (error) {
            console.error('Error fetching DM users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrivateMessage = (targetUser) => {
        // Redirect to the DM page for the selected user
        navigate('/dm', { state: { currentUser: username, targetUser } });
    };

    const styles = {
        container: {
            padding: '20px',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: 'black',
            display: 'flex',
            flexDirection: 'column',
        },
        heading: {
            fontSize: '2rem',
            color: '#ffcc00',
            marginBottom: '20px',
            textAlign: 'left',
        },
        loadingText: {
            color: 'white',
        },
        noMessagesText: {
            color: 'gray',
        },
        userList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
        },
        userItem: {
            backgroundColor: '#333',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
        username: {
            color: '#fff',
            fontSize: '1rem',
        },
        privateMessageButton: {
            backgroundColor: 'rgba(255, 80, 0, 1)',
            color: 'white',
            padding: '6px 12px',
            border: '2px solid rgba(255, 80, 0, 1)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.85rem',
        },
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>Your DMs</h2>
            {loading ? (
                <p style={styles.loadingText}>Loading...</p>
            ) : (
                <div style={styles.userList}>
                    {users.length === 0 ? (
                        <p style={styles.noMessagesText}>No users have DM'd you yet.</p>
                    ) : (
                        users.map((user, index) => (
                            <div key={index} style={styles.userItem}>
                                <span style={styles.username}>{user}</span>
                                <button onClick={() => handlePrivateMessage(user)} style={styles.privateMessageButton}>
                                    Private Message
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default DMsList;

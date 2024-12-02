import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const MyOffer = () => {
    const { state } = useLocation(); // Retrieve state passed through the navigate
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); 

    const username = localStorage.getItem("storedUsername");

    useEffect(() => {
        if (!localStorage.getItem("loggedIn") || !username) {
            navigate('/login'); // Redirect to login if no username or not logged in
        } else {
            fetchUserOffers(username); // Fetch offers using the username
        }
    }, [username, navigate]);

    const fetchUserOffers = async (username) => {
        try {
            const response = await fetch(`http://localhost:3000/offers/user/${username}`);
            if (response.ok) {
                const data = await response.json();
                setOffers(data);
            } else {
                console.error('Failed to fetch offers');
            }
        } catch (error) {
            console.error('Error fetching user offers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDashboard = () => {
        navigate('/dashboard', { state: { username } });
    };

    const handleAccept = async (offer) => {
        try {
            let endpoint;
            if (offer.orderId.type === 'bid') {
                endpoint = `http://localhost:3000/acceptOfferOnBid/${offer._id}`;
            } else if (offer.orderId.type === 'ask') {
                endpoint = `http://localhost:3000/acceptOfferOnAsk/${offer._id}`;
            } else {
                alert('Invalid offer type.');
                return;
            }

            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'accepted' }),
            });

            if (response.ok) {
                alert('Offer accepted successfully!');
                setOffers(offers.map(o => o._id === offer._id ? { ...o, status: 'accepted' } : o));
            } else {
                const errorData = await response.json();
                alert(`Failed to accept the offer: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error accepting the offer:', error);
            alert('An error occurred while accepting the offer.');
        }
    };

    const handleReject = async (offer) => {
        try {
            const response = await fetch(`http://localhost:3000/reject/${offer._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'denied' }),
            });

            if (response.ok) {
                alert('Offer rejected successfully!');
                setOffers(offers.map(o => o._id === offer._id ? { ...o, status: 'denied' } : o));
            } else {
                const errorData = await response.json();
                alert(`Failed to reject the offer: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error rejecting the offer:', error);
            alert('An error occurred while rejecting the offer.');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.heading}>Pending Offers for {username}:</h1>
            <button onClick={handleDashboard} style={styles.button}>Back To Dashboard</button>
            <div>
                {offers.length > 0 ? (
                    <ul style={styles.offerList}>
                        {offers.map((offer) => (
                            <li key={offer._id} style={styles.offerItem}>
                                <p><strong>From:</strong> {offer.senderUsername}</p>
                                <p><strong>Order ID:</strong> {offer.orderId._id}</p>
                                <p><strong>Order Type:</strong> {offer.orderId.type}</p>
                                <p><strong>Meal Points (Original Order):</strong> {offer.orderId.mealPoints}</p>
                                <p><strong>Price Per Meal Point (Original Order):</strong> ${offer.orderId.pricePerMealPoint}</p>
                                <p><strong>Offer Meal Points:</strong> {offer.mealPoints}</p>
                                <p><strong>Offer Price Per Meal Point:</strong> ${offer.pricePerMealPoint}</p>
                                <p><strong>Status:</strong> {offer.status}</p>
                                <p><strong>Sent At:</strong> {new Date(offer.timestamp).toLocaleString()}</p>
                                <div style={styles.buttonGroup}>
                                    {offer.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleAccept(offer)} style={styles.acceptButton}>Accept</button>
                                            <button onClick={() => handleReject(offer)} style={styles.rejectButton}>Reject</button>
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No offers found.</p>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
    },
    heading: {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px',
        color: '#fff', 
    },
    button: {
        backgroundColor: 'rgb(0, 128, 0)', 
        color: '#fff', 
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        fontSize: '16px',
        cursor: 'pointer',
        marginBottom: '20px',
    },
    offerList: {
        listStyleType: 'none',
        padding: 0,
        textAlign: 'left',
    },
    offerItem: {
        backgroundColor: '#fff', 
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        marginBottom: '10px',
        color: '#333', 
    },
    buttonGroup: {
        marginTop: '10px',
    },
    acceptButton: {
        backgroundColor: '#28a745', 
        color: '#fff', 
        padding: '8px 16px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginRight: '10px',
    },
    rejectButton: {
        backgroundColor: '#dc3545', 
        color: '#fff', 
        padding: '8px 16px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
};


export default MyOffer;

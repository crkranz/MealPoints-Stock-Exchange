import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Offer = () => {
    const { state } = useLocation();  // Retrieve state passed through navigate
    const [username, setUsername] = useState(state?.username || null); // Use username
    const [recipient, setRecipient] = useState('');
    const [mealPoints, setMealPoints] = useState('');
    const [pricePerMealPoint, setPricePerMealPoint] = useState('');
    const [orderDetails, setOrderDetails] = useState(state?.order || null);
    const navigate = useNavigate();  

    useEffect(() => {
        console.log("Location state:", state); // Debugging log

        if (!localStorage.getItem("loggedIn") || !orderDetails) {
            navigate('/login');
        } else {
            setRecipient(orderDetails.user.username); // Assuming orderDetails has 'user' object
        }
    }, [username, orderDetails, state, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!mealPoints || !pricePerMealPoint) {
            return alert('Please enter both meal points and price per meal point.');
        }

        try {
            const offerData = {
                senderUsername: username,  
                receiverUsername: recipient,
                mealPoints,
                pricePerMealPoint,
                orderId: orderDetails._id,
            };

            const response = await fetch('http://localhost:3000/create-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(offerData),
            });

            if (response.ok) {
                const responseData = await response.json();
                alert('Offer sent successfully!');
                console.log('Offer created successfully:', responseData);
            } else {
                const errorData = await response.json();
                alert(`Failed to send offer: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error creating offer:', error);
            alert('An error occurred while creating the offer.');
        }
    };

    const handleDashboard = () => {
        // Ensure username is available before navigating
        if (username) {
            navigate('/dashboard', { state: { username } });  // Pass username here
        } else {
            navigate('/login');
        }
    };

    if (!username || !orderDetails) {
        return <div>Loading...</div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Submit Private Offer to {recipient}</h1>
            <button onClick={handleDashboard} style={styles.backButton}>Back To {username}'s Dashboard</button>
            <div style={styles.orderDetails}>
                <h3 style={styles.orderDetailsTitle}>Order Details:</h3>
                <p><strong>Price Per Meal Point:</strong> {orderDetails.pricePerMealPoint}</p>
                <p><strong>Meal Points:</strong> {orderDetails.mealPoints}</p>
                <p><strong>Order Type:</strong> {orderDetails.type}</p>
            </div>
            <h3 style={styles.offerTitle}>Proposed Offer:</h3>
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.inputGroup}>
                    <label htmlFor="mealPoints" style={styles.label}>Meal Points:</label>
                    <input
                        type="number"
                        id="mealPoints"
                        value={mealPoints}
                        onChange={(e) => setMealPoints(e.target.value)}
                        placeholder="Enter meal points"
                        style={styles.input}
                    />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="pricePerMealPoint" style={styles.label}>Price Per Meal Point:</label>
                    <input
                        type="number"
                        id="pricePerMealPoint"
                        value={pricePerMealPoint}
                        onChange={(e) => setPricePerMealPoint(e.target.value)}
                        placeholder="Enter price per meal point"
                        style={styles.input}
                    />
                </div>
                <button type="submit" style={styles.submitButton}>Send Offer</button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        padding: '20px', 
        maxWidth: '400px', 
        width: '100%', 
        margin: '65px auto', 
        backgroundColor: '#fff', 
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', 
        borderRadius: '10px',
        textAlign: 'center',
        height: 'auto', 
        minHeight: '200px', 
    },
    header: {
        fontSize: '28px',
        marginBottom: '20px',
        color: '#000', // Black text
    },
    backButton: {
        backgroundColor: 'rgb(204, 255, 0)', 
        color: '#000', 
        padding: '10px 20px',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        marginBottom: '20px',
        transition: 'background-color 0.3s',
    },
    backButtonHover: {
        backgroundColor: '#FF3B2F', 
    },
    orderDetails: {
        backgroundColor: '#f9f9f9', 
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', 
        color: '#000',
    },
    orderDetailsTitle: {
        fontSize: '22px',
        marginBottom: '15px',
        color: '#000', 
    },
    offerTitle: {
        fontSize: '22px',
        marginBottom: '15px',
        color: '#000', 
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    inputGroup: {
        textAlign: 'left',
    },
    label: {
        fontSize: '16px',
        marginBottom: '5px',
        fontWeight: 'bold',
        color: '#000', 
    },
    input: {
        padding: '10px',
        width: '100%',
        border: '1px solid #ccc', 
        borderRadius: '5px',
        fontSize: '16px',
    },
    submitButton: {
        backgroundColor: 'rgb(204, 255, 0)', 
        color: '#000', // Black text
        padding: '12px 25px',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        fontSize: '18px',
        transition: 'background-color 0.3s',
    },
};


export default Offer;

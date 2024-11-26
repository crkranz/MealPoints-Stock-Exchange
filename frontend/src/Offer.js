import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Offer = () => {
    const { state } = useLocation();  // Retrieve state passed through navigate
    const [username, setUsername] = useState(state?.username || null); // Use username
    const [recipient, setRecipient] = useState('');
    const [mealPoints, setMealPoints] = useState('');
    const [pricePerMealPoint, setPricePerMealPoint] = useState('');
    const [orderDetails, setOrderDetails] = useState(state?.order || null);
    const navigate = useNavigate();  // Initialize navigate

    useEffect(() => {
        console.log("Location state:", state); // Debugging log

        if (!username || !orderDetails) {
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
                senderUsername: username,  // Use username instead of user.username
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
        <div>
            <h1>Submit Private Offer to {recipient}</h1>
            <button onClick={handleDashboard}>Back To {username}'s Dashboard</button>
            <div>
                <h3>Order Details:</h3>
                <p><strong>Price Per Meal Point:</strong> {orderDetails.pricePerMealPoint}</p>
                <p><strong>Meal Points:</strong> {orderDetails.mealPoints}</p>
                <p><strong>Order Type:</strong> {orderDetails.type}</p>
            </div>
            <h3>Proposed Offer:</h3>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="mealPoints">Meal Points:</label>
                    <input
                        type="number"
                        id="mealPoints"
                        value={mealPoints}
                        onChange={(e) => setMealPoints(e.target.value)}
                        placeholder="Enter meal points"
                    />
                </div>
                <div>
                    <label htmlFor="pricePerMealPoint">Price Per Meal Point:</label>
                    <input
                        type="number"
                        id="pricePerMealPoint"
                        value={pricePerMealPoint}
                        onChange={(e) => setPricePerMealPoint(e.target.value)}
                        placeholder="Enter price per meal point"
                    />
                </div>
                <button type="submit">Send Offer</button>
            </form>
        </div>
    );
};

export default Offer;

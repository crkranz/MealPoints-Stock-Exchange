import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const MyOffer = () => {
    const { state } = useLocation(); // Retrieve state passed through the navigate
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();  // Initialize navigate

    // Get the username from the state passed through navigation
    const { username } = state || {};

    useEffect(() => {
        if (!username) {
            navigate('/login');  // Redirect to login if no username is passed
        } else {
            fetchUserOffers(username);  // Fetch offers using the username
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
        // Redirect the user to the dashboard with username in state
        navigate('/dashboard', { state: { username } });
    };

    const handleAccept = async (offer) => {
        try {
            // Determine the endpoint based on the order type (bid or ask)
            let endpoint;
            if (offer.orderId.type === 'bid') {
                endpoint = `http://localhost:3000/acceptOfferOnBid/${offer._id}`;
            } else if (offer.orderId.type === 'ask') {
                endpoint = `http://localhost:3000/acceptOfferOnAsk/${offer._id}`;
            } else {
                alert('Invalid offer type.');
                return;
            }

            // Send request to the appropriate endpoint
            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'accepted' }),  // Update the status to 'accepted'
            });

            if (response.ok) {
                const updatedOffer = await response.json();
                alert('Offer accepted successfully! Transaction has been completed.');

                // Update the offers state to reflect the new status
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
            // Assuming you want to update the status of the offer to 'denied'
            const response = await fetch(`http://localhost:3000/reject/${offer._id}`, {
                method: 'PATCH',  // We use PATCH to update the status of the offer
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'denied' }),  // Send status 'denied'
            });

            if (response.ok) {
                const updatedOffer = await response.json();
                alert('Offer rejected successfully!');
                // Optionally, update the offers state to reflect the new status
                setOffers(offers.map(o => o._id === offer._id ? updatedOffer : o));
            } else {
                const errorData = await response.json();
                alert(`Failed to reject the offer: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error rejecting offer:', error);
            alert('An error occurred while rejecting the offer.');
        }
    };



    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Private Offers for {username}:</h1>
            <button onClick={handleDashboard}>Back To Dashboard</button>
            <div>
                {offers.length > 0 ? (
                    <ul>
                        {offers.map((offer) => (
                            <li key={offer._id}>
                                <p><strong>From:</strong> {offer.senderUsername}</p>

                                {/* Show original order details */}
                                <p><strong>Order ID:</strong> {offer.orderId._id}</p>  {/* Assuming orderId is an object */}
                                <p><strong>Order Type:</strong> {offer.orderId.type}</p>
                                <p><strong>Meal Points (Original Order):</strong> {offer.orderId.mealPoints}</p>
                                <p><strong>Price Per Meal Point (Original Order):</strong> ${offer.orderId.pricePerMealPoint}</p>

                                {/* Offer details */}
                                <p><strong>Offer Meal Points:</strong> {offer.mealPoints}</p>
                                <p><strong>Offer Price Per Meal Point:</strong> ${offer.pricePerMealPoint}</p>
                                <p><strong>Status:</strong> {offer.status}</p>
                                <p><strong>Sent At:</strong> {new Date(offer.timestamp).toLocaleString()}</p>

                                {/* Accept/Reject Buttons */}
                                <button onClick={() => handleAccept(offer)}>Accept</button>
                                <button onClick={() => handleReject(offer)}>Reject</button>
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


export default MyOffer;

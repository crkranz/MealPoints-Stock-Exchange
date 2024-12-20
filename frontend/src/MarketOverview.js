import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { useLocation, useNavigate } from 'react-router-dom';
//import './Dashboard.css';


const socket = io('http://localhost:3000', {
    transports: ['websocket'], // Force WebSocket transport
});
const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [mealPoints, setMealPoints] = useState(0);
    const [accountBalance, setAccountBalance] = useState(0);
    const [orders, setOrders] = useState([]);  // Store bid/ask orders
    const [orderMealPoints, setOrderMealPoints] = useState(0);
    const [orderPricePerMealPoint, setOrderPricePerMealPoint] = useState(0);
    const [selectedOption, setSelectedOption] = useState('mealPoints');
    const [inputValue, setInputValue] = useState('');
    const [matchedDetails, setMatchedDetails] = useState([]);
    const [allMatches, setAllMatches] = useState([]);
    const [recentMatches, setRecentMatches] = useState([]);
    const location = useLocation();
    const { username } = location.state || {};

    useEffect(() => {
        if (username) {
            setUser({ username });
            const fetchUserDetails = async () => {
                try {
                    const response = await fetch(`http://localhost:3000/user/${username}`);
                    const data = await response.json();
                    setMealPoints(data.mealPoints); // Set initial meal points
                    setAccountBalance(data.accountBalance); // Set initial account balance
                    console.log(username);
                } catch (error) {
                    console.error('Error fetching user details:', error);
                }
            };

            fetchUserDetails();
        } else {
            window.location.href = '/login';  // Redirect to login if no username is found
        }

        const fetchOrders = async () => {
            try {

                const response = await fetch('http://localhost:3000/orders');
                const data = await response.json();
                if (Array.isArray(data)) {
                    setOrders(data);
                } else {
                    console.error("Invalid data format for orders", data);
                }
            } catch (error) {
                console.error("Error fetching orders:", error);
            }
        };
        fetchOrders();
        const fetchMatches = async () => {
            try {
                const response = await fetch('http://localhost:3000/getMatches');
                if (!response.ok) {
                    throw new Error('Failed to fetch matches');
                }
                const matches = await response.json();

                // Set the initial matches (both all and recent)
                setAllMatches(matches);
                setRecentMatches(matches.slice(0, 5)); // Assuming you want the 5 most recent matches
            } catch (error) {
                console.error('Error fetching matches:', error);
            }
        };

        fetchMatches();
        socket.on('ordersUpdate', (data) => {
            console.log('Orders Update Received:', data);  // Debugging
            setOrders(data);  // Update orders in real-time
        });



        // Listen for matches from the server
        socket.on('allMatches', (data) => {
            setAllMatches(data);
        });

        // Listen for recent matches (list data)
        socket.on('recentMatches', (data) => {
            setRecentMatches(data);
        });

        // Clean up the socket connection
        return () => {
            socket.disconnect();
        };

    }, []);

    const bids = orders.filter(order => order?.type === 'bid');
    const asks = orders.filter(order => order?.type === 'ask');

    const chartData = {
        labels: allMatches.map((match) =>
            new Date(match.createdAt).toLocaleString()
        ),
        datasets: [
            {
                label: 'Match Price',
                data: allMatches.map((match) => match.price),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 1,
            },
        ],
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };




    const fetchOrders = async () => {
        try {
            const response = await fetch('http://localhost:3000/orders');
            const data = await response.json();
            if (Array.isArray(data)) {
                setOrders(data);
            } else {
                console.error("Invalid data format for orders", data);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };


    const handleInstantBidTransaction = async (order) => {
        const { pricePerMealPoint, mealPoints: orderMealPoints } = order;

        try {
            // Place a bid to fulfill the ask
            const response = await fetch('http://localhost:3000/placeBid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username, // Current user
                    mealPoints: orderMealPoints,
                    pricePerMealPoint,
                }),
            });

            if (response.ok) {
                alert('Transaction completed successfully!');
            } else {
                const errorData = await response.json();
                alert(`Failed to complete transaction: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error completing transaction:', error);
            alert('An error occurred while completing the transaction.');
        }
    };



    const handleInstantAskTransaction = async (order) => {
        const { pricePerMealPoint, mealPoints: orderMealPoints } = order;

        try {
            // Place an ask to fulfill the bid
            const response = await fetch('http://localhost:3000/placeAsk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username, // Current user
                    mealPoints: orderMealPoints,
                    pricePerMealPoint,
                }),
            });

            if (response.ok) {
                alert('Transaction completed successfully!');
            } else {
                const errorData = await response.json();
                alert(`Failed to complete transaction: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error completing transaction:', error);
            alert('An error occurred while completing the transaction.');
        }
    };

    const handleOffer = (order) => {
        console.log("Navigating with username:", username, "and order:", order);  // Debugging log
        navigate('/offer', { state: { username, order } });
    };

    const handleMyOffer = () => {
        // Pass username when navigating to 'myoffer' page
        navigate('/myoffer', { state: { username } });
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Welcome to Market Overview, {user.username}</h1>
            <div>
                <h3>Current Value:</h3>
                {recentMatches.length > 0 ? (
                    <p>
                        <strong>Price:</strong> {recentMatches[0].price}
                    </p>
                ) : (
                    <p>No recent matches available.</p>
                )}
            </div>
            <div>
                <h3>Order Book</h3>
                <div>
                    <h4>Bids</h4>
                    {bids.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Meal Points</th>
                                    <th>Price per MealPoint</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bids.map(order => (
                                    <tr key={order._id}>
                                        <td>{order.user.username}</td>
                                        <td>{order.mealPoints}</td>
                                        <td>${order.pricePerMealPoint?.toFixed(2) || "0.00"}</td>
                                        <td>
                                            <button onClick={() => handleInstantAskTransaction(order)}>
                                                Instant Transaction
                                            </button>
                                            <button onClick={() => handleOffer(order)}>
                                                Private Offer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No bids available</p>
                    )}
                </div>


                <div>
                    <h4>Asks</h4>
                    {asks.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Meal Points</th>
                                    <th>Price per MealPoint</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {asks.map(order => (
                                    <tr key={order._id}>
                                        <td>{order.user.username}</td>
                                        <td>{order.mealPoints}</td>
                                        <td>${order.pricePerMealPoint.toFixed(2)}</td>
                                        <td>
                                            <button onClick={() => handleInstantBidTransaction(order)}>
                                                Instant Transaction
                                            </button>
                                            <button onClick={() => handleOffer(order)}>
                                                Private Offer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No asks available</p>
                    )}
                </div>

            </div>
            <div>
                <h4>Place a Bid or Ask</h4>
                <input
                    type="number"
                    placeholder="Meal Points"
                    value={orderMealPoints}
                    onChange={(e) => setOrderMealPoints(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Price per MealPoint"
                    value={orderPricePerMealPoint}
                    onChange={(e) => setOrderPricePerMealPoint(e.target.value)}
                />
                <button onClick={handlePlaceBid}>Place Bid</button>
                <button onClick={handlePlaceAsk}>Place Ask</button>
            </div>

            <div>
                <h3>Recent Matches</h3>
                {recentMatches.map((match, index) => (
                    <div key={index} className="match">
                        <p><strong>Price:</strong> {match.price}</p>
                        <p><strong>Points Matched:</strong> {match.pointsMatched}</p>
                        <p><strong>Created At:</strong> {new Date(match.createdAt).toLocaleString()}</p>
                        <hr />
                    </div>
                ))}
            </div>
            <div>
                <h3>Match Price Over Time</h3>
                {allMatches.length > 0 ? (
                    <Line data={chartData} />
                ) : (
                    <p>Loading match data...</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

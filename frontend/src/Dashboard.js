import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { useLocation, useNavigate } from 'react-router-dom';
import './Dashboard.css';


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
                setRecentMatches(matches.slice(0, 20)); // Assuming you want the 5 most recent matches
            } catch (error) {
                console.error('Error fetching matches:', error);
            }
        };

        fetchMatches();
        socket.on('ordersUpdate', (data) => {
            console.log('Orders Update Received:', data);  // Debugging
            setOrders(data);  // Update orders in real-time
        });

        socket.on('balanceUpdate', (data) => {
            console.log('Balance updated:', data);
            // Assuming you have the current user's username stored in a variable
            const currentUser = username;  // Replace this with the actual variable holding the logged-in user's username
            if (data.username === currentUser) {
                console.log('Balance updated:', data);
                // Update UI only for the current logged-in user
                setMealPoints(data.mealPoints);  // Update meal points
                setAccountBalance(data.accountBalance);  // Update account balance
            }
            console.log('Balance updated:not matching');
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
    const sortedMatches = allMatches.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const chartData = {
        labels: sortedMatches.map((match) =>
            new Date(match.createdAt).toLocaleString()
        ),
        datasets: [
            {
                data: allMatches.map((match) => match.price), // Removed the label property
                borderColor: 'rgba(255, 80, 0, 1)', // Red color for the line
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                borderWidth: 1,
                pointHoverRadius: 8, // Larger points when hovered
                pointRadius: 0, // Removed visible points
            },
        ],
    };

    const chartOptions = {
        interaction: {
            mode: 'index', // Ensures tooltip interacts with the closest point on the x-axis
            intersect: false, // Tooltip appears even if not directly on a point
        },
        plugins: {
            tooltip: {
                enabled: true, // Show tooltip with data
                mode: 'index',
                intersect: false,
            },
            legend: {
                display: false, // Hides the legend completely
            },
        },
        scales: {
            x: {
                ticks: {
                    display: false, // Hides the x-axis labels
                },
                grid: {
                    display: false, // Optional: Hides the grid lines for the x-axis
                },
            },
            y: {
                ticks: {
                    beginAtZero: true, // Keeps the y-axis starting at zero
                },
                grid: {
                    display: false, // Optional: Hides the grid lines for the y-axis
                },
            },
        },
    };

    const verticalLinePlugin = {
        id: 'verticalLine',
        afterDraw: (chart) => {
            if (chart.tooltip._active && chart.tooltip._active.length) {
                const ctx = chart.ctx;
                const activePoint = chart.tooltip._active[0];
                const x = activePoint.element.x;
                const topY = chart.scales.y.top;
                const bottomY = chart.scales.y.bottom;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, topY);
                ctx.lineTo(x, bottomY);
                ctx.lineWidth = 2; // Increased line thickness for better visibility
                ctx.strokeStyle = 'white'; // White line for better contrast
                ctx.stroke();
                ctx.restore();
            }
        },
    };


    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };


    const handleUpdatePoints = async () => {
        try {
            const valueToUpdate = parseFloat(inputValue);

            if (isNaN(valueToUpdate)) {
                alert('Please enter a valid number');
                return;
            }

            // Send updated points to the server
            const response = await fetch('http://localhost:3000/updatepoints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: user.username,
                    mealPoints: selectedOption === 'mealPoints' ? valueToUpdate : 0,
                    accountBalance: selectedOption === 'accountBalance' ? valueToUpdate : 0,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                setMealPoints(data.user.mealPoints);
                setAccountBalance(data.user.accountBalance);
                setInputValue(''); // Clear the input after successful update
                alert('Updated successfully!');
            } else {
                alert('Failed to update');
            }
        } catch (error) {
            console.error(error);
            alert('Error updating user data');
        }
    };



    const handlePlaceBid = async () => {
        try {
            const response = await fetch('http://localhost:3000/placeBid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    mealPoints: parseFloat(orderMealPoints),
                    pricePerMealPoint: parseFloat(orderPricePerMealPoint),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                alert('Bid placed successfully!');

                // Optionally, update the orders list with the new bid
                setOrders(prevOrders => [...prevOrders, data.order]);
            } else {
                const errorData = await response.json();
                alert(`Failed to place bid: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error placing bid:', error);
            alert('An error occurred while placing the bid.');
        }
    };

    const handleDM = (order) => {
        const targetUser = order.user.username;
        navigate('/dm', { state: { currentUser: username, targetUser } });
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

    const handlePlaceAsk = async () => {
        try {
            const response = await fetch('http://localhost:3000/placeAsk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    mealPoints: parseFloat(orderMealPoints),
                    pricePerMealPoint: parseFloat(orderPricePerMealPoint),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                alert('Ask placed successfully!');

                // If matched details are returned, store them in the state
                if (data.matchedDetails && data.matchedDetails.length > 0) {
                    setMatchedDetails(data.matchedDetails);
                }

                // Optionally, update the orders list with the new ask
                setOrders(prevOrders => [...prevOrders, data.order]);
            } else {
                const errorData = await response.json();
                alert(`Failed to place ask: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error placing ask:', error);
            alert('An error occurred while placing the ask.');
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
                fetchOrders();
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
                fetchOrders();
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


    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">Welcome {user.username}</h1>

            <div className="info-section">
                <div className="current-value-container">
                    <h3 className="info-title">MealPoints</h3>
                    {recentMatches.length > 0 ? (
                        <p className="current-value">
                            <strong>$</strong> {recentMatches[0].price}
                        </p>
                    ) : (
                        <p className="current-value">No recent matches available.</p>
                    )}
                </div>
            </div>
            <div className="main-content">
                {/* Graph Section */}
                <div className="graph-section">
                    {/* <h3>Match Price Over Time</h3> */}
                    {allMatches.length > 0 ? (
                        <Line data={chartData} options={chartOptions} plugins={[verticalLinePlugin]} />


                    ) : (
                        <p>Loading match data...</p>
                    )}
                </div>

                {/* Account Info Section */}
                <div className="account-info">
                    <div className="balance-info">
                        <h3>Your Balance</h3>
                        <p><strong>Meal Points:</strong> {mealPoints}</p>
                        <p><strong>Account Balance:</strong> ${accountBalance && !isNaN(accountBalance) ? accountBalance.toFixed(2) : "0.00"}</p>
                    </div>

                    <div className="update-points-section">
                        <h3>Update Points</h3>
                        <div className="update-inputs">
                            <select
                                value={selectedOption}
                                onChange={(e) => setSelectedOption(e.target.value)}
                                className="select-option"
                            >
                                <option value="mealPoints">Meal Points</option>
                                <option value="accountBalance">Account Balance</option>
                            </select>
                            <input
                                type="number"
                                value={inputValue}
                                onChange={handleInputChange}
                                placeholder="Enter new value"
                                className="input-field"
                            />
                            <button onClick={handleUpdatePoints} className="primary-button">Update</button>
                        </div>
                    </div>
                    {/* Place Order Section */}
                    <div className="place-order">
                        <h4>Place a Bid or Ask</h4>
                        <input
                            type="number"
                            placeholder="Meal Points"
                            value={orderMealPoints}
                            onChange={(e) => setOrderMealPoints(e.target.value)}
                            className="order-input"
                        />
                        <input
                            type="number"
                            placeholder="Price per MealPoint"
                            value={orderPricePerMealPoint}
                            onChange={(e) => setOrderPricePerMealPoint(e.target.value)}
                            className="order-input"
                        />
                        <button onClick={handlePlaceBid} className="primary-button">Place Bid</button>
                        <button onClick={handlePlaceAsk} className="primary-button">Place Ask</button>
                    </div>
                </div>
            </div>



            {/* Order Book Section - Bids and Asks side by side */}
            <div className="order-book">
                <h3>Order Book</h3>
                <div className="orders-container">
                    {/* Bids */}
                    <div className="order-column">
                        <h4>Bids</h4>
                        {bids.length > 0 ? (
                            <table className="order-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Meal Points</th>
                                        <th>Price</th>
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
                                                <button onClick={() => handleDM(order)}>
                                                    Private Message
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

                    {/* Asks */}
                    <div className="order-column">
                        <h4>Asks</h4>
                        {asks.length > 0 ? (
                            <table className="order-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Meal Points</th>
                                        <th>Price</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {asks.map(order => (
                                        <tr key={order._id}>
                                            <td>{order.user.username}</td>
                                            <td>{order.mealPoints}</td>
                                            <td>${order.pricePerMealPoint?.toFixed(2) || "0.00"}</td>
                                            <td>
                                                <button onClick={() => handleInstantBidTransaction(order)}>
                                                    Instant Transaction
                                                </button>
                                                <button onClick={() => handleOffer(order)}>
                                                    Private Offer
                                                </button>
                                                <button onClick={() => handleDM(order)}>
                                                    Private Message
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
            </div>

            {/* Recent Matches */}
            <div className="recent-matches-title">
                <h3>Recent Matches</h3>
            </div>

            <div className="recent-matches">
                {recentMatches.map((match, index) => (
                    <div key={index} className="match-card">
                        <p><strong>Price:</strong> {match.price}</p>
                        <p><strong>Points Matched:</strong> {match.pointsMatched}</p>
                        <p><strong>Matched At:</strong> {new Date(match.createdAt).toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>

    );
};
export default Dashboard;

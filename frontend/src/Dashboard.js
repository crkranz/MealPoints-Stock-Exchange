import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const socket = io('http://localhost:3000', {
    transports: ['websocket'], // Force WebSocket transport
});


const Portfolio = () => {
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

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser.user);

            const fetchUserDetails = async () => {
                try {
                    const response = await fetch(`http://localhost:3000/user/${parsedUser.user.username}`);
                    const data = await response.json();
                    setMealPoints(data.mealPoints); // Set initial meal points
                    setAccountBalance(data.accountBalance); // Set initial account balance
                } catch (error) {
                    console.error('Error fetching user details:', error);
                }
            };

            fetchUserDetails();
        } else {
            window.location.href = '/login';
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

        if (user) {
            console.log('User set, initializing socket listener');
            socket.on('balanceUpdate', (data) => {
                console.log('Balance update received:', data);
                if (data.username === user.username) {
                    setMealPoints(data.mealPoints);
                    setAccountBalance(data.accountBalance);
                } else {
                    console.warn('User does not match the update.');
                }
            });

            return () => {
                socket.off('balanceUpdate');
            };
        }
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


    const handleUpdatePoints = async () => {
        try {
            const valueToUpdate = parseFloat(inputValue) || 0;

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


    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Welcome to Dashboard, {user.username}</h1>
            <div>
                <p><strong>Meal Points:</strong> {mealPoints}</p>
                <strong>Account Balance:</strong> ${accountBalance?.toFixed(2) || "0.00"}
            </div>
            <div>
                <h3>Update Points</h3>
                <select
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                >
                    <option value="mealPoints">Meal Points</option>
                    <option value="accountBalance">Account Balance</option>
                </select>
                <input
                    type="number"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Enter new value"
                />
                <button onClick={handleUpdatePoints}>Submit</button>
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

export default Portfolio;

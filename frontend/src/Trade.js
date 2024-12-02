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
    const handleLogout = () => {
        // Clear user state
        setUser(null);

        // Disconnect from the socket server
        socket.disconnect();

        // Redirect the user to the login page
        navigate('/login');
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
            <h1>Welcome to Dashboard, {user.username}</h1>


            <button onClick={handleLogout}>Logout</button>
            <button onClick={handleMyOffer}>My Offers</button>

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

        </div>
    );
};

export default Dashboard;

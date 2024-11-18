import React, { useState } from 'react';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [buySell, setBuySell] = useState('buying'); // Default to "buying"
    const [mealPoints, setMealPoints] = useState(0); // Default to 0 meal points
    const [buySellPrice, setBuySellPrice] = useState(''); // What you're willing to buy/sell for

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                    buySell,
                    mealPoints,
                    buySellPrice,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                alert('User registered successfully!');
            } else {
                alert('Registration failed: ' + data.error);
            }
        } catch (err) {
            console.error('Error:', err);
            alert('An error occurred during registration');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            {/* Dropdown for Buy or Sell */}
            <select
                value={buySell}
                onChange={(e) => setBuySell(e.target.value)}
            >
                <option value="buying">Buying</option>
                <option value="selling">Selling</option>
            </select>

            {/* Input for Meal Points */}
            <input
                type="number"
                placeholder="How many meal points you have/want"
                value={mealPoints}
                onChange={(e) => setMealPoints(e.target.value)}
            />

            {/* Input for What you're willing to buy/sell for */}
            <input
                type="text"
                placeholder="What you're willing to buy/sell for"
                value={buySellPrice}
                onChange={(e) => setBuySellPrice(e.target.value)}
            />

            <button type="submit">Register</button>
        </form>
    );
};

export default Register;

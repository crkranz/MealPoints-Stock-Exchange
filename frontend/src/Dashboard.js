import React, { useEffect, useState } from 'react';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [mealPoints, setMealPoints] = useState(0);
    const [accountBalance, setAccountBalance] = useState(0);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser.user);
        } else {
            window.location.href = '/login';
        }
    }, []);
    const handleUpdatePoints = async () => {
        try {
            const response = await fetch('http://localhost:3000/updatepoints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: user.username,  // Ensure you're passing a valid MongoDB ObjectId
                    mealPoints: parseFloat(mealPoints),
                    accountBalance: parseFloat(accountBalance),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);  // Update frontend state
                alert('Updated successfully!');
            } else {
                alert('Failed to update');
            }
        } catch (error) {
            console.error(error);
            alert('Error updating user data');
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Welcome to Dashboard, {user.username}</h1>
            <div>
                <h2>Meal Points: {user.mealPoints || 0}</h2>
                <h2>Account Balance: ${user.accountBalance || 0}</h2>
            </div>

            <div>
                <h3>Update Points and Balance</h3>
                <input
                    type="number"
                    placeholder="Add Meal Points"
                    value={mealPoints}
                    onChange={(e) => setMealPoints(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Add Account Balance"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(e.target.value)}
                />
                <button onClick={handleUpdatePoints}>Update</button>
            </div>
        </div>
    );
};

export default Dashboard;

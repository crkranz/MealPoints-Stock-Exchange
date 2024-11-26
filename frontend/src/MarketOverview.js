import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2'; // For displaying the graph

const MarketOverview = () => {
    const [mealPointValue, setMealPointValue] = useState(0);
    const [historicalValues, setHistoricalValues] = useState([]);

    useEffect(() => {
        const fetchMealPointValue = async () => {
            try {
                const response = await fetch('http://localhost:3000/mealpoint-value');
                const data = await response.json();
                setMealPointValue(data.mealPointValue);
            } catch (error) {
                console.error('Error fetching meal point value:', error);
            }
        };

        const fetchHistoricalValues = async () => {
            try {
                const response = await fetch('http://localhost:3000/historical-values');
                const data = await response.json();
                setHistoricalValues(data);
            } catch (error) {
                console.error('Error fetching historical values:', error);
            }
        };

        fetchMealPointValue();
        fetchHistoricalValues();

        // Refresh real-time value every minute
        const interval = setInterval(fetchMealPointValue, 60000);

        return () => clearInterval(interval); // Clean up the interval when the component unmounts
    }, []);

    // Format the data for the chart
    const chartData = {
        labels: historicalValues.map(value => value.timestamp),
        datasets: [{
            label: 'Meal Point Value',
            data: historicalValues.map(value => value.value),
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            fill: false,
        }],
    };
    const saveHistoricalValue = (value) => {
        const newHistoricalValue = new HistoricalMealPointValue({
            value,
            timestamp: new Date(),
        });
        newHistoricalValue.save();
    };

    // Periodically save the historical data (e.g., every minute)
    setInterval(() => {
        const mealPointValue = calculateMealPointValue();
        saveHistoricalValue(mealPointValue);
    }, 60000);

    return (
        <div>
            <h1>Market Overview</h1>
            <p>Current Meal Point Value: ${mealPointValue}</p>

            <div>
                <h3>Historical Meal Point Value</h3>
                <Line data={chartData} />
            </div>
        </div>
    );
};

export default MarketOverview;

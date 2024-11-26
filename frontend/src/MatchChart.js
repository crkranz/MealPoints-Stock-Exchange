import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js';

const MatchChart = ({ matches }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (matches.length === 0) return;

        const ctx = chartRef.current.getContext('2d');
        const data = {
            labels: matches.map(match => new Date(match.createdAt).toLocaleString()),
            datasets: [
                {
                    label: 'Match Price',
                    data: matches.map(match => match.price),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.3,
                },
            ],
        };

        const config = {
            type: 'line', // You can also use 'bar', 'scatter', etc.
            data,
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true, position: 'top' },
                },
                scales: {
                    x: { title: { display: true, text: 'Match Created At' } },
                    y: { title: { display: true, text: 'Price ($)' } },
                },
            },
        };

        const myChart = new Chart(ctx, config);

        // Cleanup function to destroy chart instance
        return () => {
            myChart.destroy();
        };
    }, [matches]);

    return <canvas ref={chartRef} />;
};

export default MatchChart;

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import './DM.css';

const DM = () => {
    const location = useLocation();
    const { currentUser, targetUser } = location.state || {};
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([]);
    const socket = io('http://localhost:3000'); // Connect to Socket.IO server

    useEffect(() => {
        if (!currentUser || !targetUser) {
            console.error("Invalid user or target user");
            return;
        }

        // Register the current user for real-time messaging
        socket.emit('register', currentUser);

        // Fetch chat history initially
        const fetchChatHistory = async () => {
            try {
                const response = await fetch(
                    `http://localhost:3000/getMessages?from=${currentUser}&to=${targetUser}`
                );
                const chatHistory = await response.json();
                setChat(chatHistory);
            } catch (error) {
                console.error('Error fetching chat history:', error);
            }
        };

        fetchChatHistory();

        // Listen for new messages from the server
        socket.on('receiveMessage', (data) => {
            if (data.from === targetUser || data.from === currentUser) {
                setChat(prevChat => [...prevChat, data]);
            }
        });

        // Cleanup on component unmount
        return () => {
            socket.off('receiveMessage');
        };
    }, [currentUser, targetUser, socket]);

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        // Send message to backend via socket and also store it in DB
        socket.emit('sendMessage', { from: currentUser, to: targetUser, message });

        // Update local chat immediately to reflect the sent message
        setChat(prevChat => [...prevChat, { from: currentUser, message }]);

        // Optionally, save to the server as well (you already have a fetch API for this)
        try {
            const response = await fetch('http://localhost:3000/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: currentUser, to: targetUser, message }),
            });
            if (response.ok) {
                setMessage('');
            } else {
                alert('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="dm-container">
            <h2>Chat with {targetUser}</h2>
            <div className="chat-box">
                {chat.map((msg, index) => (
                    <p
                        key={index}
                        className={msg.from === currentUser ? 'current-user' : 'target-user'}
                    >
                        <strong>{msg.from}: </strong>{msg.message}
                    </p>
                ))}
            </div>
            <div className="input-container">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message"
                />
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
};

export default DM;

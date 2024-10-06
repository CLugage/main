// pages/afk.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const AFKPage = () => {
    const { data: session } = useSession();
    const [credits, setCredits] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        // Exit early if there's no active session
        if (!session) {
            console.log("Session not available");
            return; 
        }

        console.log('Session Data:', session); // Log session data for debugging

        const creditInterval = setInterval(() => {
            // Call API to update the balance in the database
            fetch('/api/updateBalance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: session.user.id, creditsEarned: 1 }),
            })
            .then(response => {
                if (!response.ok) {
                    // Log the error response status
                    console.error('Failed to update balance:', response.status, response.statusText);
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Updated balance:', data.balance);
                setCredits(prev => prev + 1);
            })
            .catch(error => {
                console.error('Error updating balance:', error.message); // More specific error logging
            });
        }, 10000); // 30 seconds

        const timerInterval = setInterval(() => setElapsedTime(prev => prev + 1), 1000); // 1 second

        // Cleanup function to clear intervals on unmount
        return () => {
            clearInterval(creditInterval);
            clearInterval(timerInterval);
        };
    }, [session]);

    const formatTime = seconds => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                <h1 className="text-3xl font-bold mb-4 text-black">You're Earning Credits!</h1>
                <p className="text-xl mb-2 text-black">Credits Earned: {credits} 🌟</p>
                <p className="text-lg text-black">Elapsed Time: {formatTime(elapsedTime)}</p>
                <p className="mt-4 text-gray-700">Stay away from your keyboard, and we'll keep rewarding you for every minute you're AFK!</p>
            </div>
        </div>
    );
};

export default AFKPage;

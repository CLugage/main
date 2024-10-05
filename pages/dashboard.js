// src/pages/dashboard.js
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get('/api/user');
                setUser(response.data);
            } catch (error) {
                console.error('Error fetching user data:', error);
                router.push('/'); // Redirect to home if there's an error
            }
        };

        fetchUserData();
    }, [router]);

    return (
        <div>
            <h1>Welcome to the Proxmox Client Dashboard</h1>
            {user ? (
                <div>
                    <p>Logged in as {user.username} ({user.email})</p>
                    <a href="/api/auth/signout">Logout</a>
                </div>
            ) : (
                <p>Please log in.</p>
            )}
        </div>
    );
};

export default Dashboard;

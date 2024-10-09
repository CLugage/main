import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react'; // Importing the session hook

const CreateInstance = () => {
    const [instanceName, setInstanceName] = useState('');
    const [selectedOS, setSelectedOS] = useState('');
    const [loading, setLoading] = useState(false);  // Loading state
    const [error, setError] = useState('');  // Error state
    const router = useRouter();
    const { data: session } = useSession(); // Get the session

    const getRandomIP = () => {
        const randomPart = Math.floor(Math.random() * 254) + 1;
        return `10.10.10.${randomPart}`;
    };

    const getRandomPort = () => {
        return Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024;
    };

    const getRandomVMID = async () => {
        let vmid;
        do {
            vmid = Math.floor(Math.random() * 10000) + 100;
            const response = await fetch(`/api/vpsExists?proxID=${vmid}`);
            const data = await response.json();
            if (data.exists) {
                vmid = null;
            }
        } while (!vmid);
        return vmid;
    };

    const handleCreateInstance = async (e) => {
        e.preventDefault();
        setLoading(true);  // Start loading
        setError('');  // Reset error
    
        try {
            const ip = getRandomIP();
            const sshPort = getRandomPort();
            const proxID = await getRandomVMID();

            // Ensure userID is available from the session
            const userID = session?.user?.id; // Get userID from session
    
            if (!userID) {
                setError('User not found. Please log in again.');
                return;
            }

            const requestBody = {
                name: instanceName,
                proxID: proxID,
                ip: ip,
                sshPort: sshPort,
                os: selectedOS,
                userID: userID,  // Add userID to the request
            };
    
            const response = await fetch('/api/createVPS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
    
            if (response.ok) {
                router.push('/dashboard');
            } else {
                setError('Failed to create instance. Please try again.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);  // End loading
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
            <h1 className="text-4xl font-bold text-black mb-6">Create Instance</h1>
            <form onSubmit={handleCreateInstance} className="bg-white p-6 rounded shadow-md w-full max-w-md">
                {error && <p className="text-red-600 mb-4">{error}</p>}
                <div className="mb-4">
                    <label htmlFor="instanceName" className="block text-sm font-medium text-gray-700">
                        Instance Name
                    </label>
                    <input
                        type="text"
                        id="instanceName"
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="os" className="block text-sm font-medium text-gray-700">
                        Select Operating System
                    </label>
                    <select
                        id="os"
                        value={selectedOS}
                        onChange={(e) => setSelectedOS(e.target.value)}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    >
                        <option value="" disabled>Select an OS</option>
                        <option value="alpine">Alpine</option>
                        <option value="debian">Debian</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className={`w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create Instance'}
                </button>
            </form>
        </div>
    );
};

export default CreateInstance;

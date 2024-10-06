import { useState } from 'react';
import { useRouter } from 'next/router';

const CreateInstance = () => {
    const [instanceName, setInstanceName] = useState('');
    const [selectedOS, setSelectedOS] = useState('');
    const router = useRouter();

    // Function to generate a random IP address
    const getRandomIP = () => {
        const randomPart = Math.floor(Math.random() * 254) + 1; // Random number between 1 and 254
        return `10.10.10.${randomPart}`; // Example IP in the 10.10.10.x range
    };

    // Function to generate a random SSH port
    const getRandomPort = () => {
        return Math.floor(Math.random() * (65535 - 1024 + 1)) + 1024; // Random port between 1024 and 65535
    };

    // Function to generate a random VMID
    const getRandomVMID = async () => {
        // Generate a random VMID that doesn't already exist
        let vmid;
        do {
            vmid = Math.floor(Math.random() * 10000) + 100; // Random VMID between 100 and 10000
            const response = await fetch(`/api/vpsExists?proxID=${vmid}`);
            const data = await response.json();
            if (data.exists) {
                vmid = null; // Reset if exists
            }
        } while (!vmid);
        return vmid;
    };

    const handleCreateInstance = async (e) => {
        e.preventDefault();

        // Generate random IP, port, and VMID
        const ip = getRandomIP();
        const sshPort = getRandomPort();
        const proxID = await getRandomVMID();

        // Prepare the request body
        const requestBody = {
            name: instanceName,
            proxID: proxID,
            ip: ip,
            sshPort: { port: sshPort },
            os: selectedOS, // Sending the selected OS to the backend
        };

        // Make the API call to create the VPS
        const response = await fetch('/api/createVPS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (response.ok) {
            console.log('VPS created successfully');
            // Navigate back to the dashboard after creation
            router.push('/dashboard');
        } else {
            console.error('Error creating VPS');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
            <h1 className="text-4xl font-bold text-black mb-6">Create Instance</h1>
            <form onSubmit={handleCreateInstance} className="bg-white p-6 rounded shadow-md w-full max-w-md">
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
                        {/* Add more OS options as needed */}
                    </select>
                </div>
                <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Create Instance
                </button>
            </form>
        </div>
    );
};

export default CreateInstance;

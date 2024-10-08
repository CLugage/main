import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import DashHeader from './components/DashHeader';

const Dashboard = () => {
    const { data: session, status } = useSession();
    const [instances, setInstances] = useState([]);
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedInstance, setSelectedInstance] = useState(null);
    const [controlMenuVisible, setControlMenuVisible] = useState(false);
    const [upgradeMenuVisible, setUpgradeMenuVisible] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false); // New state variable

    const plans = [
        { id: 1, name: 'Basic Plan', memory: 2048, cores: 1, cost: 10 }, // 2GB RAM, 1 core
        { id: 2, name: 'Standard Plan', memory: 4096, cores: 2, cost: 20 }, // 4GB RAM, 2 cores
        { id: 3, name: 'Premium Plan', memory: 8192, cores: 4, cost: 30 } // 8GB RAM, 4 cores
    ];

    useEffect(() => {
        if (status === 'loading') return;
        if (status === 'unauthenticated') {
            router.push('/login');
        }

        const fetchData = async () => {
            if (status === 'authenticated') {
                try {
                    const instancesResponse = await fetch(`/api/instances?userID=${session.user.id}`);
                    if (!instancesResponse.ok) throw new Error('Failed to fetch instances');
                    const instancesData = await instancesResponse.json();
                    console.log("Instances Data:", instancesData); // Log the instances data
                    setInstances(instancesData);
        
                    const creditsResponse = await fetch(`/api/credits?userID=${session.user.id}`);
                    if (!creditsResponse.ok) throw new Error('Failed to fetch credits');
                    const creditsData = await creditsResponse.json();
                    console.log("Credits Data:", creditsData); // Log the credits data
                    setCredits(creditsData.credits);
                } catch (error) {
                    console.error("Error fetching data:", error);
                    alert(error.message); // Display error message to the user
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        

        fetchData(); // Initial fetch

        // Set up interval to fetch data every 10 seconds
        const interval = setInterval(() => {
            fetchData();
        }, 10000); // 10000 milliseconds = 10 seconds

        return () => clearInterval(interval); // Clean up the interval on unmount
    }, [session, status, router]);

    const handleInstanceClick = (instance) => {
        setSelectedInstance(instance);
        setControlMenuVisible(true);
    };

    const handleCloseMenu = () => {
        setControlMenuVisible(false);
        setSelectedInstance(null);
        setUpgradeMenuVisible(false);
        setSelectedPlan(null);
        setShowPassword(false); // Reset password visibility when closing menu
    };

    const handleStartInstance = async () => {
        try {
            const response = await fetch('/api/vpsHandler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start', proxID: selectedInstance.proxID })
            });

            const data = await response.json();
            console.log(data.message);
            handleCloseMenu();
        } catch (error) {
            console.error("Error starting instance:", error);
        }
    };

    const handleStopInstance = async () => {
        try {
            const response = await fetch('/api/vpsHandler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop', proxID: selectedInstance.proxID })
            });

            const data = await response.json();
            console.log(data.message);
            handleCloseMenu();
        } catch (error) {
            console.error("Error stopping instance:", error);
        }
    };

    const handleUpgradeClick = () => {
        setUpgradeMenuVisible(true);
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
    };

    const handleUpgradeInstance = async () => {
        if (!selectedPlan || !selectedInstance) return;
    
        try {
            // Fetch the latest balance from the database
            const balanceResponse = await fetch(`/api/credits?userID=${session.user.id}`);
            const balanceData = await balanceResponse.json();
            const userBalance = balanceData.credits || 0; // Default to 0 if no balance found
    
            // Check if the user has enough balance
            if (userBalance < selectedPlan.cost) {
                alert("You do not have enough balance to upgrade to this plan."); // Notify the user
                return;
            }
    
            // Proceed with the upgrade
            const response = await fetch('/api/vpsHandler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'upgrade',
                    proxID: selectedInstance.proxID,
                    memory: selectedPlan.memory,
                    cores: selectedPlan.cores,
                    userID: session.user.id, // Pass userID to the backend
                    planCost: selectedPlan.cost // Pass plan cost to the backend
                })
            });
    
            const data = await response.json();
            console.log(data.message);
            setUpgradeMenuVisible(false);
            setSelectedPlan(null); // Reset selected plan after upgrade
            handleCloseMenu(); // Close the control menu after upgrading
        } catch (error) {
            console.error("Error upgrading instance:", error);
        }
    };
    
    const handleCreateClick = () => {
        router.push('/create'); // Navigate to the create page
    };

    // Function to copy password to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                console.log('Password copied to clipboard!');
            })
            .catch((error) => {
                console.error('Failed to copy password:', error);
            });
    };

    if (loading) {
        return <div className="text-center text-black">Loading...</div>;
    }

    return (
        <>
            <DashHeader />
            <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6 text-black">
                <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
                <h2 className="text-2xl mb-4">Welcome, {session.user.name}</h2>
                <h3 className="text-xl mb-4">Your Credits: {credits}</h3>
                <h3 className="text-xl mb-4">Your Instances:</h3>

                <button
                    onClick={handleCreateClick}
                    className="mb-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    Create Instance
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
                    {instances.length > 0 ? (
                        instances.map(instance => (
                            <div
                                key={instance.proxID}
                                className="bg-white shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow cursor-pointer"
                                onClick={() => handleInstanceClick(instance)}
                            >
                                <h4 className="text-lg font-semibold">{instance.name}</h4>
                                <p>IP: {instance.ip}</p>
                                <p>Port: {instance.sshPort}</p>
                                <p>SSH: ssh root@45.137.70.53 -p {instance.sshPort}</p>
                                <div
                                    className="relative"
                                    onMouseEnter={() => setShowPassword(true)} // Show password on hover
                                    onMouseLeave={() => setShowPassword(false)} // Hide password on hover out
                                >
                                    <p
                                        onClick={() => {
                                            copyToClipboard(instance.password); // Copy password when clicked
                                        }}
                                        className="cursor-pointer"
                                    >
                                        Password: 
                                        {showPassword ? instance.password : '••••••••'}
                                    </p>
                                </div>
                                <p>Status: {instance.status}</p>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-4 rounded-lg shadow">No instances found.</div>
                    )}
                </div>

                {/* Control Menu */}
                {controlMenuVisible && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                        <div className="bg-white p-6 rounded shadow-lg">
                            <h2 className="text-2xl font-bold mb-4">Control Menu for {selectedInstance.name}</h2>
                            <p>ProxID: {selectedInstance.proxID}</p>
                            <p>IP: {selectedInstance.ip}</p>
                            <div className="flex flex-col mt-4">
                                <button className="mb-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleStartInstance}>
                                    Start Instance
                                </button>
                                <button className="mb-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={handleStopInstance}>
                                    Stop Instance
                                </button>
                                {/* <button className="mb-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700" onClick={handleUpgradeClick}>
                                    Upgrade Instance
                                </button> */}
                            </div>
                            <button onClick={handleCloseMenu} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Upgrade Menu */}
                {upgradeMenuVisible && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                        <div className="bg-white p-6 rounded shadow-lg">
                            <h2 className="text-2xl font-bold mb-4">Upgrade Instance</h2>
                            <p>Select a new plan:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                {plans.map(plan => (
                                    <div
                                        key={plan.id}
                                        onClick={() => handlePlanSelect(plan)}
                                        className={`p-4 border rounded cursor-pointer transition-colors ${selectedPlan && selectedPlan.id === plan.id ? 'border-blue-600 bg-blue-100' : 'border-gray-300 hover:bg-gray-100'}`}
                                    >
                                        <h3 className="font-semibold">{plan.name}</h3>
                                        <p>{plan.memory} MB RAM</p>
                                        <p>{plan.cores} Cores</p>
                                        <p>${plan.cost} / month</p>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleUpgradeInstance} className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                                Upgrade
                            </button>
                            <button onClick={handleCloseMenu} className="mt-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Dashboard;

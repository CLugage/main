import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const Login = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated") {
            router.push('/dashboard'); // Redirect to dashboard if logged in
        }
    }, [session, status]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="bg-gray-100 p-8 rounded-lg shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">Login</h1>
                <button 
                    onClick={() => signIn('discord')} 
                    className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition duration-200">
                    Login with Discord
                </button>
            </div>
        </div>
    );
};

export default Login;

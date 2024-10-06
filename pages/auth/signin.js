// src/pages/auth/signin.js

import { signIn } from "next-auth/react";

const SignIn = () => {
    const handleSignIn = async () => {
        await signIn("discord", { callbackUrl: "/dashboard" });
    };

    return (
        <div>
            <h1>Sign In</h1>
            <button onClick={handleSignIn}>Sign in with Discord</button>
        </div>
    );
};

export default SignIn;

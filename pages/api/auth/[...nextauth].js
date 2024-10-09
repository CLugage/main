// src/pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export default NextAuth({
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            authorization: {
                // Ensure the correct authorization URL
                url: 'https://discord.com/oauth2/authorize',
                params: { grant_type: 'authorization_code' },
            },
            // Specify the redirect URI, ensuring it matches Discord settings
            redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/discord`,
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60,    // 1 day
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id; // Add user ID to the token
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id; // Get user ID from the token
            return session;
        },
    },
    pages: {
        signIn: '/login', // Custom sign-in page
    },
    events: {
        // You can add an event to log successful sign-ins
        signIn: async (message) => {
            console.log("User signed in:", message);
        },
        // Log errors for better debugging
        error: async (message) => {
            console.error("Authentication error:", message);
        },
    },
});

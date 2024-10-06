// pages/api/updateBalance.js
import dbConnect from '../utils/dbConnect'; 
import { User } from '../models/database'; 

export default async function handler(req, res) {
    // Allow only POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    await dbConnect(); // Connect to your database

    const { userId, creditsEarned } = req.body;

    // Input validation
    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    if (creditsEarned === undefined || typeof creditsEarned !== 'number') {
        return res.status(400).json({ message: 'Invalid credits earned' });
    }

    try {
        // Update user's balance in the database
        const user = await User.findOne({ userID: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Increment user's balance
        user.balance += creditsEarned; 
        await user.save();

        return res.status(200).json({ balance: user.balance });
    } catch (error) {
        console.error('Error updating balance:', error); // Log the error for debugging
        return res.status(500).json({ message: 'Error updating balance', error: error.message });
    }
}

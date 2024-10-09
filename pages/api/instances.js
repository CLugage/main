// pages/api/instances.js
import dbConnect from '../../utils/dbConnect'; 
import { VPS } from '../../models/database'; // Assuming you have a VPS model

export default async function handler(req, res) {
    const { userID } = req.query;

    // Allow only GET requests
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    await dbConnect(); // Connect to your database

    // Input validation
    if (!userID || typeof userID !== 'string') {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        // Fetch all instances for the user from the database
        const instances = await VPS.find({ userID });

        if (instances.length === 0) {
            return res.status(404).json({ message: 'No instances found for this user' });
        }

        // Return instances in the response
        return res.status(200).json(instances);
    } catch (error) {
        console.error('Error fetching instances:', error); // Log the error for debugging
        return res.status(500).json({ message: 'Error fetching instances', error: error.message });
    }
}

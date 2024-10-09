import { getSession } from 'next-auth/react';
import db from '../../models/database'; // Adjust the path if necessary

export default async function handler(req, res) {
    const session = await getSession({ req });

    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userID = session.user.id;

    try {
        // Use findOne instead of findById for non-ObjectId userIDs
        const user = await db.User.findOne({ userID }).exec(); // Adjust based on your User schema
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const credits = user.balance || 0; // Default to 0 if no credits found

        return res.status(200).json({ credits }); // Send credits back to the client
    } catch (error) {
        console.error('Error fetching credits:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

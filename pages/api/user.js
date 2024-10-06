// src/pages/api/user.js
import { getSession } from 'next-auth/react';

export default async (req, res) => {
    const session = await getSession({ req });

    if (session) {
        res.status(200).json({ username: session.user.name, email: session.user.email });
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
};

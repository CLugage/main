// src/pages/api/instances.js

import { getSession } from 'next-auth/react';
import db from '../models/database'; // adjust the path if necessary

export default async function handler(req, res) {
    const session = await getSession({ req });

    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userID = session.user.id;

    try {
        const instances = await db.VPS.find({ userID }).exec();
        res.status(200).json(instances);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

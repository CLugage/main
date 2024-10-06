import dbConnect from '../utils/dbConnect';
import { User } from '../models/database';

export default async function handler(req, res) {
    await dbConnect();

    if (req.method === 'GET') {
        const users = await User.find();
        res.json(users);
    } else if (req.method === 'POST') {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json(newUser);
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

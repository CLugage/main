import dbConnect from '../utils/dbConnect';
import { Earn } from '../models/database';

export default async function handler(req, res) {
    await dbConnect();

    if (req.method === 'GET') {
        const earnings = await Earn.find();
        res.json(earnings);
    } else if (req.method === 'POST') {
        const newEarn = new Earn(req.body);
        await newEarn.save();
        res.status(201).json(newEarn);
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

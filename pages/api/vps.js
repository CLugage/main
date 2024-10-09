import dbConnect from '../../utils/dbConnect';
import { VPS } from '../../models/database';

export default async function handler(req, res) {
    await dbConnect();

    if (req.method === 'GET') {
        const vpsList = await VPS.find();
        res.json(vpsList);
    } else if (req.method === 'POST') {
        const newVPS = new VPS(req.body);
        await newVPS.save();
        res.status(201).json(newVPS);
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

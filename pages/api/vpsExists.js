// pages/api/vpsExists.js
import db from '../../models/database'; // Update with your actual DB path

const vpsExists = async (req, res) => {
    const { proxID } = req.query;

    const existingVPS = await db.VPS.findOne({ proxID });
    if (existingVPS) {
        return res.status(200).json({ exists: true });
    }

    return res.status(200).json({ exists: false });
};

export default vpsExists;

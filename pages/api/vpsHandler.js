import { exec } from 'child_process';
import dbConnect from '../../utils/dbConnect';
import { VPS } from '../../models/database'; // Assuming VPS is your Mongoose model

const vpsHandler = async (req, res) => {
    if (req.method === 'POST') {
        const { action, proxID, memory, cores, userID, planCost } = req.body;

        if (!action || !proxID) {
            return res.status(400).json({ message: 'Action and proxID are required.' });
        }

        let command;
        switch (action) {
            case 'start':
                command = `pct start ${proxID}`;
                break;
            case 'stop':
                command = `pct stop ${proxID}`;
                break;
            case 'restart':
                command = `pct restart ${proxID}`;
                break;
            case 'upgrade':
                command = `pct set ${proxID} -memory ${memory} -cores ${cores}`;
                break;
            default:
                return res.status(400).json({ message: 'Invalid action.' });
        }

        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                return res.status(500).json({ message: 'Failed to execute command.', error: error.message });
            }
            if (stderr) {
                console.error(`Error: ${stderr}`);
                return res.status(500).json({ message: 'Command executed with errors.', error: stderr });
            }

            // If the action was an upgrade, deduct credits
            if (action === 'upgrade') {
                try {
                    await dbConnect(); // Connect to the database

                    const user = await VPS.findOne({ userID }); // Use your model directly
                    if (user && user.balance >= planCost) {
                        // Deduct credits
                        await VPS.updateOne(
                            { userID },
                            { $inc: { credits: -planCost } }
                        );
                        console.log(`Credits deducted: ${planCost}`);
                    } else {
                        return res.status(400).json({ message: 'Insufficient credits for upgrade.' });
                    }
                } catch (dbError) {
                    console.error(`Database error: ${dbError.message}`);
                    return res.status(500).json({ message: 'Failed to update credits.', error: dbError.message });
                }
            }

            console.log(`Command output: ${stdout}`);
            return res.status(200).json({ message: `Successfully executed ${action} for VPS ID: ${proxID}`, output: stdout });
        });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default vpsHandler;

import { exec } from 'child_process';

// Function to handle VPS commands
const vpsHandler = (req, res) => {
    if (req.method === 'POST') {
        const { action, proxID, memory, cores } = req.body;

        if (!action || !proxID) {
            return res.status(400).json({ message: 'Action and proxID are required.' });
        }

        let command;
        if (action === 'start') {
            command = `pct start ${proxID}`;
        } else if (action === 'stop') {
            command = `pct stop ${proxID}`;
        } else if (action === 'restart') {
            command = `pct restart ${proxID}`;
        } else if (action === 'upgrade') {
            // Create upgrade command using selected plan parameters
            command = `pct set ${proxID} -memory ${memory} -cores ${cores}`; 
        } else {
            return res.status(400).json({ message: 'Invalid action.' });
        }

        // Execute the command
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                return res.status(500).json({ message: 'Failed to execute command.', error: error.message });
            }
            if (stderr) {
                console.error(`Error: ${stderr}`);
                return res.status(500).json({ message: 'Command executed with errors.', error: stderr });
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

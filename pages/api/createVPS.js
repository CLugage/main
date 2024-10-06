import db from '../models/database'; // Adjust the path to your db.js file
import shell from 'shell-exec'; // Ensure this package is installed
import fs from 'fs';

async function createVPS(name, ip, os) {
    console.log(`Creating ${name} with IP: ${ip} | OS: ${os}`);

    // Fetch the node to get the next available proxID
    const node = await db.Node.findOne(); // You might want to specify a particular node if you have multiple
    if (!node) {
        console.error(`No node found in the database.`);
        return { success: false, message: `No node found in the database.` };
    }

    const proxID = node.nextID; // Get the current nextID from the node

    // Check if the VPS already exists
    const userVPS = await db.VPS.findOne({ proxID });
    if (userVPS) {
        console.error(`VPS already exists: ${proxID}`);
        return { success: false, message: `VPS already exists: ${proxID}` }; // Prevent duplication if you don't want duplicates
    }

    // Fetch available ports from the database
    const availablePort = await db.Port.findOne({ isUsed: false });
    if (!availablePort) {
        console.error(`No available ports found.`);
        return { success: false, message: `No available ports found.` };
    }

    // Assign the port to the VPS
    const sshPort = availablePort.port;

    let osPath = '';
    // Map OS names to template file names
    if (os === 'alpine') {
        osPath = 'alpine-3.20-default_20240908_amd64.tar.xz';
    } else if (os === 'debian') {
        osPath = 'debian-12-standard_12.7-1_amd64.tar.zst';
    } else {
        console.error(`Unsupported OS: ${os}`);
        return { success: false, message: `Unsupported OS: ${os}` }; // Exit if the OS is not supported
    }

    const createCMD = getCreateCMD(osPath, proxID, { os, ip, memory: 1024, cores: 1 }); // Adjust memory and cores as needed
    console.log(`Creating VPS with command: ${createCMD}`);

    // Execute the VPS creation command
    const vpsCreateRes = await shell(createCMD);
    if (vpsCreateRes.stderr.length > 0) {
        console.error(`Error creating VPS: ${vpsCreateRes.stderr}`);
        return { success: false, message: `Error creating VPS: ${vpsCreateRes.stderr}` };
    }

    // Copy firewall rules
    await shell(`cp /etc/pve/firewall/100.fw /etc/pve/firewall/${proxID}.fw`);

    // Perform OS-specific setup
    await setupOS(os, proxID);

    // Add port forwarding for SSH
    await addForward(sshPort, 22, ip);

    // Create the VPS entry in the database
    const newVPS = new db.VPS({
        name,
        proxID,
        ip,
        sshPort,
        os,
        status: 'active',
    });
    await newVPS.save();

    // Update the nextID in the Node collection
    node.nextID += 1; // Increment the nextID
    await node.save();

    // Mark the port as used
    availablePort.isUsed = true;
    availablePort.vpsID = newVPS._id; // Link to the created VPS
    await availablePort.save();

    console.log(`${name} - Create done!`);
    return { success: true, message: `${name} created successfully.` };
}

async function setupOS(os, proxID) {
    // Execute OS-specific commands for setup
    try {
        if (os === 'alpine') {
            await shell(`pct exec ${proxID} sh -- -c "apk update"`);
            await shell(`pct exec ${proxID} sh -- -c "apk add openssh zsh git wget curl htop sudo bash htop neofetch"`);
            await shell(`pct exec ${proxID} sh -- -c "echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config"`);
            await shell(`pct exec ${proxID} sh -- -c "rc-update add sshd"`);
            await shell(`pct exec ${proxID} sh -- -c "service sshd start"`);
            await shell(`pct exec ${proxID} sh -- -c "echo '\tFree VPS by Dekos.' > /etc/motd"`);
            await shell(`pct exec ${proxID} sh -- -c "bash <(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"`);
            await shell(`pct exec ${proxID} sh -- -c "sed -i 's#/bin/ash#/bin/zsh#' /etc/passwd"`);
        } else if (os === 'debian') {
            await shell(`pct exec ${proxID} bash -- -c "apt update -y"`);
            await shell(`pct exec ${proxID} bash -- -c "apt install openssh-server zsh git wget curl htop sudo htop neofetch -y"`);
            await shell(`pct exec ${proxID} bash -- -c "echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config"`);
            await shell(`pct exec ${proxID} bash -- -c "service sshd restart"`);
            await shell(`pct exec ${proxID} bash -- -c "echo '\tFree VPS by Dekos.' > /etc/motd"`);
            await shell(`pct exec ${proxID} bash -- -c "bash <(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"`);
            await shell(`pct exec ${proxID} bash -- -c "sed -i 's#/bin/bash#/bin/zsh#' /etc/passwd"`);
        }
    } catch (error) {
        console.error(`Error setting up OS ${os} for proxID ${proxID}: ${error.message}`);
    }
}

async function addForward(port, intPort, ip) {
    console.log(`Adding port forwarding: ${port} -> ${ip}:${intPort}`);

    const natPreDownPath = '/root/nat-pre-down.sh';
    const natPostUpPath = '/root/nat-post-up.sh';

    const preDownContent = `iptables -t nat -D PREROUTING -i vmbr0 -p tcp --dport ${port} -j DNAT --to ${ip}:${intPort}\n`;
    const postUpContent = `iptables -t nat -A PREROUTING -i vmbr0 -p tcp --dport ${port} -j DNAT --to ${ip}:${intPort}\n`;

    // Append commands to the NAT scripts
    fs.appendFileSync(natPreDownPath, preDownContent);
    fs.appendFileSync(natPostUpPath, postUpContent);

    const result = await shell(`bash ${natPostUpPath}`);
    if (result.stderr) {
        console.error(`Error executing nat-post-up.sh: ${result.stderr}`);
    } else {
        console.log(`Executed nat-post-up.sh for port ${port}`);
    }

    console.log(`Added port forwarding rule for port ${port}`);
}

function getCreateCMD(path, proxID, data) {
    let cmd = `pct create ${proxID} /var/lib/vz/template/cache/${path} --swap=256 --hostname=${data.os}${proxID} --memory=${data.memory} --cores=${data.cores} --net0 name=eth0,bridge=vmbr0,ip=${data.ip},gw=10.10.10.1 --rootfs=local-lvm:3`;

    // Optional disk configuration
    if (data.disk) {
        cmd += ` --rootfs=local-lvm:${data.disk}`;
    }

    return cmd;
}

// API handler
export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { name, ip, os } = req.body;

        // Call createVPS and handle the response
        const result = await createVPS(name, ip, os);
        if (result && result.success) {
            return res.status(200).json({ message: result.message });
        } else {
            return res.status(500).json({ message: result.message || 'Failed to create VPS.' });
        }
    }
    return res.status(405).json({ message: 'Method not allowed' });
}

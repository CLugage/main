import db from '../../models/database'; // Adjust the path to your db.js file
import shell from 'shell-exec'; // Ensure this package is installed
import fs from 'fs';

function generateRandomPassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_+";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}

async function createVPS(userID, name, ip, os) {
    console.log(`Creating VPS: ${name} with IP: ${ip} | OS: ${os}`);

    const node = await db.Node.findOne();
    if (!node) {
        console.error(`No node found in the database.`);
        return { success: false, message: `No node found in the database.` };
    }

    const proxID = node.nextID; // Get the current nextID
    const userVPS = await db.VPS.findOne({ proxID });
    if (userVPS) {
        console.error(`VPS already exists: ${proxID}`);
        return { success: false, message: `VPS already exists: ${proxID}` };
    }

    const availablePort = await db.Port.findOne({ isUsed: false });
    if (!availablePort) {
        console.error(`No available ports found.`);
        return { success: false, message: `No available ports found.` };
    }

    const sshPort = availablePort.port;
    let osPath = '';

    // Define OS paths
    if (os === 'alpine') {
        osPath = 'alpine-3.20-default_20240908_amd64.tar.xz';
    } else if (os === 'debian') {
        osPath = 'debian-12-standard_12.7-1_amd64.tar.zst';
    } else {
        console.error(`Unsupported OS: ${os}`);
        return { success: false, message: `Unsupported OS: ${os}` };
    }

    const password = generateRandomPassword(); // Generate a random password
    const createCMD = getCreateCMD(osPath, proxID, { os, ip: `${ip}/24`, memory: 4000, cores: 2, password });

    console.log(`Creating VPS with command: [HIDDEN]`); // Avoid logging the command with the password
    const vpsCreateRes = await shell(createCMD);

    if (vpsCreateRes.stderr.length > 0 || vpsCreateRes.stdout.length === 0) {
        console.error(`Error creating VPS: ${vpsCreateRes.stderr || 'No output received'}`);
        return { success: false, message: `Error creating VPS: ${vpsCreateRes.stderr || 'No output received'}` };
    }

    // Copy firewall rules
    await shell(`cp /etc/pve/firewall/100.fw /etc/pve/firewall/${proxID}.fw`);
    await setupOS(os, proxID);
    await addForward(sshPort, 22, ip);

    const newVPS = new db.VPS({
        userID,
        name,
        proxID,
        ip,
        sshPort,
        os,
        password, // Save the generated password in the database
        status: 'active',
    });
    await newVPS.save();

    // Increment nextID and save the node
    node.nextID += 1; // Increment nextID by 1
    await node.save();

    // Update the available port status
    availablePort.isUsed = true;
    availablePort.vpsID = newVPS._id;
    await availablePort.save();

    console.log(`${name} - Create done!`);
    return { success: true, message: `${name} created successfully.`, password }; 
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
        console.error(`Error setting up OS: ${error.message}`);
    }
}

async function addForward(port, intPort, ip) {
    console.log(`Adding port forwarding: ${port} -> ${ip}:${intPort}`);

    // Ensure the directory for port scripts exists
    const natPreDownPath = '/root/nat-pre-down.sh';
    const natPostUpPath = '/root/nat-post-up.sh';

    // Add NAT rule for the port
    const preDownContent = `iptables -t nat -D PREROUTING -i vmbr0 -p tcp --dport ${port} -j DNAT --to ${ip}:${intPort}\n`;
    const postUpContent = `iptables -t nat -A PREROUTING -i vmbr0 -p tcp --dport ${port} -j DNAT --to ${ip}:${intPort}\n`;

    // Append rules to the NAT scripts
    fs.appendFileSync(natPreDownPath, preDownContent);
    fs.appendFileSync(natPostUpPath, postUpContent);

    // Execute the nat-post-up.sh script to apply changes immediately
    const result = await shell(`bash ${natPostUpPath}`);

    if (result.stderr) {
        console.error(`Error executing nat-post-up.sh: ${result.stderr}`);
    } else {
        console.log(`Executed nat-post-up.sh for port ${port}`);
    }

    console.log(`Added port forwarding rule for port ${port}`);
}

function getCreateCMD(path, proxID, data) {
    console.log("Creating VPS with the following parameters:");
    console.log("Path:", path);
    console.log("ProxID:", proxID);
    console.log("OS:", data.os);
    console.log("IP:", data.ip);
    
    let cmd = '';
    cmd += `pct create ${proxID} /var/lib/vz/template/cache/${path} `;
    cmd += `--swap=256 `;
    cmd += `--hostname=${data.os}${proxID} `;
    cmd += `--memory=${data.memory} `;
    cmd += `--cmode=shell `;
    cmd += `--net0 name=eth0,bridge=vmbr0,firewall=1,gw=10.10.10.1,ip=${data.ip},rate=3 `;
    cmd += `--ostype=${data.os} `;
    cmd += `--password ${data.password} `; 
    cmd += `--start=1 `;
    cmd += `--unprivileged=1 `;
    cmd += `--cores=${data.cores} `;
    cmd += `--features fuse=1,nesting=1,keyctl=1 `;
    cmd += `--rootfs local-lvm:3`;

    console.log("VPS Creation Command: [HIDDEN]"); // Avoid logging sensitive information

    return cmd;
}

// Default export for the API route
export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { userID, name, ip, os } = req.body;

        if (!userID || !name || !ip || !os) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const result = await createVPS(userID, name, ip, os);
        res.status(result.success ? 200 : 400).json(result);
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

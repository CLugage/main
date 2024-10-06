// components/CreateVPSForm.js
import { useState } from 'react';

export default function CreateVPSForm() {
    const [name, setName] = useState('');
    const [proxID, setProxID] = useState('');
    const [ip, setIP] = useState('');
    const [sshPort, setSshPort] = useState({ port: 22 }); // Adjust accordingly
    const [os, setOs] = useState('alpine'); // Default OS

    const handleSubmit = async (e) => {
        e.preventDefault();

        const response = await fetch('/api/createVPS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, proxID, ip, sshPort, os }),
        });

        const result = await response.json();
        if (response.ok) {
            alert('VPS created successfully!');
        } else {
            alert('Error creating VPS: ' + result.error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Instance Name" required />
            <input type="text" value={proxID} onChange={(e) => setProxID(e.target.value)} placeholder="ProxID" required />
            <input type="text" value={ip} onChange={(e) => setIP(e.target.value)} placeholder="IP Address" required />
            <select value={os} onChange={(e) => setOs(e.target.value)}>
                <option value="alpine">Alpine</option>
                <option value="debian">Debian</option>
            </select>
            <button type="submit">Create Instance</button>
        </form>
    );
}

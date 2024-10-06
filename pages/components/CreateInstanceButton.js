import React from 'react';
import axios from 'axios';

const CreateInstanceButton = ({ name, proxID, ip, sshPort, os }) => {
    const handleCreateInstance = async () => {
        try {
            const response = await axios.post('/api/create-instance', {
                name,
                proxID,
                ip,
                sshPort,
                os,
            });
            console.log(response.data);
            // Handle success (e.g., show a message, redirect, etc.)
        } catch (error) {
            console.error('Error creating instance:', error);
            // Handle error (e.g., show an error message)
        }
    };

    return (
        <button onClick={handleCreateInstance} className="btn">
            Create Instance
        </button>
    );
};

export default CreateInstanceButton;

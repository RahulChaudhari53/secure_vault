const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = process.env.ENCRYPTION_KEY; 

// Ensure key is valid length (32 bytes)
if (!key || key.length !== 32) {
    throw new Error('Invalid ENCRYPTION_KEY: Must be exactly 32 characters long.');
}

exports.encrypt = (text) => {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return {
            iv: iv.toString('hex'),
            encryptedData: encrypted.toString('hex')
        };
    } catch (error) {
        console.error("Encryption Error:", error);
        throw new Error('Encryption failed');
    }
};

exports.decrypt = (encryptedData, ivHex) => {
    try {
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(encryptedData, 'hex');
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Decryption Error:", error);
        throw new Error('Decryption failed or invalid key'); 
    }
};

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const validateFile = async (req, res, next) => {
  if (!req.file) return next(); 

  try {
    // Dynamic Import for ESM package 'file-type'
    const { fileTypeFromBuffer } = await import('file-type');
    
    // Inspect the actual bytes (Magic Numbers)
    const detectedType = await fileTypeFromBuffer(req.file.buffer);

    // Allowed Extensions
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    // Check if detection failed or type is not allowed
    if (!detectedType || !allowedExtensions.includes(detectedType.ext)) {
       console.error(`Security Block: File claimed to be ${req.file.mimetype} but detected as ${detectedType ? detectedType.ext : 'unknown'}`);
       throw new Error('Invalid image content. File signature does not match allowed types.');
    }

    // Generate Safe Filename
    const uploadDir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const filename = crypto.randomBytes(16).toString('hex') + '.' + detectedType.ext;
    const filepath = path.join(uploadDir, filename);

    // Write Validated Buffer to Disk
    fs.writeFileSync(filepath, req.file.buffer);

    // Update req.file for Controller Usage
    req.file.path = filepath;
    req.file.filename = filename;
    req.file.destination = uploadDir;
    
    delete req.file.buffer; 

    next();
  } catch (error) {
    next(error); 
  }
};

module.exports = validateFile;

// Sync version 1.0.1
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Determine storage engine
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

let storage;

if (useCloudinary) {
    console.log('Using Cloudinary Storage');
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'fixxev_uploads',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
            resource_type: 'auto',
            public_id: (req, file) => {
                const name = path.parse(file.originalname).name.replace(/\s+/g, '-');
                return `${Date.now()}-${name}`;
            },
        },
    });
} else {
    console.log('Using Local Storage (Cloudinary credentials missing)');
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit is safer for Cloudinary free tier
    fileFilter: (req, file, cb) => {
        console.log('Filtering file:', {
            originalname: file.originalname,
            mimetype: file.mimetype
        });

        const filetypes = /jpeg|jpg|png|webp|gif|svg/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        // On some platforms/browsers, mimetype might be generic. 
        // We'll allow it if either mimetype or extension matches, 
        // or if it's application/octet-stream but has an image-like extension.
        if (mimetype || extname) {
            return cb(null, true);
        }

        cb(new Error(`File validation failed. Type: ${file.mimetype}, Name: ${file.originalname}. Only image files are allowed!`));
    }
});

// Upload endpoint
router.post('/', (req, res) => {
    console.log('Upload request received');

    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Multer/Upload Error:', err);
            return res.status(400).json({
                message: err.message,
                error: err
            });
        }

        if (!req.file) {
            console.error('No file found in request. Check if the field name is "image"');
            return res.status(400).json({ message: 'No file uploaded. Field name must be "image"' });
        }

        try {
            console.log('File uploaded successfully:', req.file.path || req.file.filename);

            // Cloudinary provides 'path' as the secure URL
            let url = useCloudinary ? req.file.path : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

            res.json({
                url,
                fileName: req.file.filename || req.file.originalname,
                public_id: req.file.public_id || null,
                message: 'Upload successful'
            });
        } catch (error) {
            console.error('Post-upload handler error:', error);
            res.status(500).json({ message: 'Error processing uploaded file' });
        }
    });
});

module.exports = router;

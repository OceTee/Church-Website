import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { query, run } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(projectRoot, 'public'))); // Serve uploaded files

// Ensure uploads directory exists
const uploadsDir = path.join(projectRoot, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- ROOT ENDPOINT ---
app.get('/', (req, res) => {
    res.send('Backend API is running. The React frontend is on port 5173 (http://localhost:5173).');
});

// --- GALLERY ENDPOINTS ---

// Get all gallery photos
app.get('/api/gallery', async (req, res) => {
    try {
        const photos = await query('SELECT * FROM gallery ORDER BY createdAt DESC');
        res.json(photos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload new gallery photo
app.post('/api/gallery', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
        
        const { date } = req.body;
        const imageUrl = `/uploads/${req.file.filename}`;
        
        const result = await run(
            'INSERT INTO gallery (imageUrl, date) VALUES (?, ?)',
            [imageUrl, date || new Date().toISOString().split('T')[0]]
        );
        
        res.status(201).json({ id: result.lastID, imageUrl, date });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a gallery photo
app.delete('/api/gallery/:id', async (req, res) => {
    try {
        const photo = await query('SELECT * FROM gallery WHERE id = ?', [req.params.id]);
        if (photo.length > 0) {
            const filePath = path.join(projectRoot, 'public', photo[0].imageUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            await run('DELETE FROM gallery WHERE id = ?', [req.params.id]);
        }
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- EVENTS ENDPOINTS ---

// Get all upcoming events
app.get('/api/events', async (req, res) => {
    try {
        const events = await query('SELECT * FROM events ORDER BY date ASC');
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new event
app.post('/api/events', upload.single('flyer'), async (req, res) => {
    try {
        const { title, description, date, time } = req.body;
        let flyerUrl = null;
        if (req.file) {
            flyerUrl = `/uploads/${req.file.filename}`;
        }

        const result = await run(
            'INSERT INTO events (title, description, date, time, flyerUrl) VALUES (?, ?, ?, ?, ?)',
            [title, description, date, time, flyerUrl]
        );

        res.status(201).json({ id: result.lastID, title, description, date, time, flyerUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete an event
app.delete('/api/events/:id', async (req, res) => {
    try {
        const event = await query('SELECT * FROM events WHERE id = ?', [req.params.id]);
        if (event.length > 0 && event[0].flyerUrl) {
            const filePath = path.join(projectRoot, 'public', event[0].flyerUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await run('DELETE FROM events WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SERMONS ENDPOINTS ---

// Get all sermons
app.get('/api/sermons', async (req, res) => {
    try {
        const sermons = await query('SELECT * FROM sermons ORDER BY createdAt DESC');
        res.json(sermons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload new sermon audio
app.post('/api/sermons', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });
        
        const { title, date } = req.body;
        const audioUrl = `/uploads/${req.file.filename}`;
        
        const result = await run(
            'INSERT INTO sermons (title, date, audioUrl) VALUES (?, ?, ?)',
            [title, date || new Date().toISOString().split('T')[0], audioUrl]
        );
        
        res.status(201).json({ id: result.lastID, title, date, audioUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a sermon
app.delete('/api/sermons/:id', async (req, res) => {
    try {
        const sermon = await query('SELECT * FROM sermons WHERE id = ?', [req.params.id]);
        if (sermon.length > 0) {
            const filePath = path.join(projectRoot, 'public', sermon[0].audioUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            await run('DELETE FROM sermons WHERE id = ?', [req.params.id]);
        }
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});

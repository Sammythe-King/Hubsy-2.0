require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const cors = require('cors'); // Needed to allow frontend to talk to backend

const app = express();

// --- CONFIGURATION ---
// You will get this connection string from MongoDB Atlas
const uri = process.env.MONGO_URI; 
const port = process.env.PORT || 3000;

// --- MIDDLEWARE ---

// 1. Logger Middleware (Requirement: 4%)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
    next();
});

// 2. CORS (Allows your GitHub Pages frontend to talk to this server)
app.use(cors());

// 3. JSON Parsing
app.use(express.json());

// 4. Static File Middleware (Requirement: 4%)
// This serves images from a folder named 'images' in your backend directory
app.use('/images', express.static(path.join(__dirname, 'images')));


// --- MONGODB CONNECTION ---
let db;
MongoClient.connect(uri)
    .then(client => {
        db = client.db('hubsy'); // Your database name
        console.log('Connected to MongoDB');
    })
    .catch(err => console.error(err));


// --- ROUTES ---

// 1. GET All Lessons (Requirement: 3%)
app.get('/api/lessons', async (req, res) => {
    try {
        const lessons = await db.collection('lessons').find({}).toArray();
        res.json(lessons);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. POST New Order (Requirement: 4%)
app.post('/api/orders', async (req, res) => {
    try {
        const order = req.body;
        const result = await db.collection('orders').insertOne(order);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. PUT Update Spaces (Requirement: 5%)
app.put('/api/lessons/:id', async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        const { spaces } = req.body; // Expecting { spaces: 4 }
        
        const result = await db.collection('lessons').updateOne(
            { _id: id },
            { $set: { spaces: spaces } }
        );
        
        res.json({ message: 'Spaces updated', result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. SEARCH Route (Requirement: 7% for Backend Search)
// Currently your index.html filters locally. To get full marks, 
// you should call this endpoint from Vue when typing.
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q; // e.g., ?q=math
        const results = await db.collection('lessons').find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { location: { $regex: query, $options: 'i' } }
            ]
        }).toArray();
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
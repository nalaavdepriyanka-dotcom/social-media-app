const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// ✅ FIX 1: Public folder serve karna (HTML file ke liye)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ FIX 2: Root route - jab koi localhost:3000 khole
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== MONGOOSE MODELS ====================

const roomSchema = new mongoose.Schema({
    room_no: { type: String, required: true, unique: true },
    location: String,
    sharing_capacity: Number,
    image_url: { type: String, default: '' },
    created_at: { type: Date, default: Date.now }
});
const Room = mongoose.model('Room', roomSchema);

const bedSchema = new mongoose.Schema({
    room_no: { type: String, required: true },
    bed_label: { type: String, required: true },
    status: { type: String, default: 'vacant' },
    roommate_name: { type: String, default: 'Vacant' },
    roommate_degree: { type: String, default: '-' }
});
bedSchema.index({ room_no: 1, bed_label: 1 }, { unique: true });
const Bed = mongoose.model('Bed', bedSchema);

const entryLogSchema = new mongoose.Schema({
    student_name: String,
    room_no: String,
    entry_type: String,
    created_at: { type: Date, default: Date.now }
});
const EntryLog = mongoose.model('EntryLog', entryLogSchema);

const lateArrivalSchema = new mongoose.Schema({
    student_name: String,
    expected_time: String,
    reason: String,
    created_at: { type: Date, default: Date.now }
});
const LateArrival = mongoose.model('LateArrival', lateArrivalSchema);

const emergencyContactSchema = new mongoose.Schema({
    contact_name: String,
    phone_number: String,
    created_at: { type: Date, default: Date.now }
});
const EmergencyContact = mongoose.model('EmergencyContact', emergencyContactSchema);

const faceRegistrationSchema = new mongoose.Schema({
    student_name: String,
    room_no: String,
    face_descriptor: [Number],
    created_at: { type: Date, default: Date.now }
});
const FaceRegistration = mongoose.model('FaceRegistration', faceRegistrationSchema);

const sosAlertSchema = new mongoose.Schema({
    alert_type: String,
    latitude: Number,
    longitude: Number,
    shake_intensity: String,
    student_name: String,
    room_no: String,
    voice_command: String,
    photo_name: String,
    photo_data: String, // ✅ NEW: Photo ka base64 data save karne ke liye
    created_at: { type: Date, default: Date.now }
});
const SosAlert = mongoose.model('SosAlert', sosAlertSchema);

const expenseSchema = new mongoose.Schema({
    title: String,
    amount: Number,
    payer_name: String,
    split_members: [String],
    created_at: { type: Date, default: Date.now }
});
const Expense = mongoose.model('Expense', expenseSchema);

const personalBudgetSchema = new mongoose.Schema({
    budget_amount: Number,
    created_at: { type: Date, default: Date.now }
});
const PersonalBudget = mongoose.model('PersonalBudget', personalBudgetSchema);

const personalExpenseSchema = new mongoose.Schema({
    title: String,
    amount: Number,
    created_at: { type: Date, default: Date.now }
});
const PersonalExpense = mongoose.model('PersonalExpense', personalExpenseSchema);

const complaintSchema = new mongoose.Schema({
    student_name: String,
    room_no: String,
    category: String,
    priority: String,
    description: String,
    status: { type: String, default: 'pending' },
    resolution_note: { type: String, default: '' },
    created_at: { type: Date, default: Date.now }
});
const Complaint = mongoose.model('Complaint', complaintSchema);

// 🔧 MongoDB Connection (Render + Local dono ke liye)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pg_safety_db';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Database connected successfully!'))
    .catch(err => console.error('❌ Database connection failed:', err.message));

// ==================== 1. BED TRACKER APIs ====================
app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await Room.find().sort({ created_at: -1 });
        const beds = await Bed.find();
        res.json({ rooms, beds });
    } catch (err) {
        console.error('Error fetching rooms:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/rooms', async (req, res) => {
    try {
        const { room_no, location, sharing, image_url } = req.body;
        console.log('📥 Adding room:', { room_no, location, sharing });
        
        const newRoom = new Room({
            room_no,
            location,
            sharing_capacity: sharing,
            image_url: image_url || ''
        });
        await newRoom.save();

        // Auto-create beds
        const labels = sharing > 2 ? ['A', 'B', 'C', 'D'].slice(0, sharing) : (sharing === 1 ? ['1'] : ['A', 'B']);
        for (const label of labels) {
            const newBed = new Bed({ room_no, bed_label: label });
            await newBed.save().catch(() => {});
        }
        console.log(`✅ Room ${room_no} added successfully`);
        res.json({ success: true, message: 'Room added!' });
    } catch (err) {
        console.error('❌ Error adding room:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/beds/update', async (req, res) => {
    try {
        const { room_no, bed_label, status, name, degree } = req.body;
        await Bed.findOneAndUpdate(
            { room_no, bed_label },
            { 
                status, 
                roommate_name: name || 'Vacant', 
                roommate_degree: degree || '-' 
            },
            { new: true, upsert: true }
        );
        console.log(`✅ Bed ${room_no}-${bed_label} updated to ${status}`);
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating bed:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==================== 2. PG MANAGEMENT APIs ====================
app.get('/api/entry-log', async (req, res) => {
    try {
        const logs = await EntryLog.find().sort({ created_at: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        console.error('Error fetching entry logs:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/entry-log', async (req, res) => {
    try {
        const { student_name, room_no, entry_type } = req.body;
        const newLog = new EntryLog({ student_name, room_no, entry_type });
        await newLog.save();
        console.log(`✅ Entry logged: ${student_name} ${entry_type}`);
        res.json({ success: true, message: 'Entry logged!' });
    } catch (err) {
        console.error('Error logging entry:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/late-arrival', async (req, res) => {
    try {
        const rows = await LateArrival.find().sort({ created_at: -1 });
        res.json(rows);
    } catch (err) {
        console.error('Error fetching late arrivals:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/late-arrival', async (req, res) => {
    try {
        const { student_name, expected_time, reason } = req.body;
        const newLate = new LateArrival({ student_name, expected_time, reason });
        await newLate.save();
        console.log(`✅ Late arrival: ${student_name}`);
        res.json({ success: true, message: 'Late arrival recorded!' });
    } catch (err) {
        console.error('Error recording late arrival:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/emergency-contact', async (req, res) => {
    try {
        const rows = await EmergencyContact.find().sort({ created_at: -1 });
        res.json(rows);
    } catch (err) {
        console.error('Error fetching contacts:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/emergency-contact', async (req, res) => {
    try {
        const { contact_name, phone_number } = req.body;
        const newContact = new EmergencyContact({ contact_name, phone_number });
        await newContact.save();
        console.log(`✅ Contact added: ${contact_name}`);
        res.json({ success: true, message: 'Contact saved!' });
    } catch (err) {
        console.error('Error adding contact:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/emergency-contact/:id', async (req, res) => {
    try {
        await EmergencyContact.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Contact removed!' });
    } catch (err) {
        console.error('Error deleting contact:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/face-register', async (req, res) => {
    try {
        const { student_name, room_no, face_descriptor } = req.body;
        const newFace = new FaceRegistration({ 
            student_name, 
            room_no, 
            face_descriptor 
        });
        await newFace.save();
        console.log(`✅ Face registered: ${student_name}`);
        res.json({ success: true, message: 'Face registered!' });
    } catch (err) {
        console.error('Error registering face:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/face-recognition', async (req, res) => {
    try {
        const { face_descriptor } = req.body;
        const registrations = await FaceRegistration.find();

        let bestMatch = null;
        let minDistance = Infinity;

        for (const reg of registrations) {
            const storedDesc = reg.face_descriptor;
            const distance = Math.sqrt(
                storedDesc.reduce((sum, val, i) => sum + Math.pow(val - face_descriptor[i], 2), 0)
            );
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = reg;
            }
        }

        if (bestMatch && minDistance < 0.6) {
            res.json({
                matched: true,
                student: {
                    student_name: bestMatch.student_name,
                    room_no: bestMatch.room_no
                }
            });
        } else {
            res.json({ matched: false });
        }
    } catch (err) {
        console.error('Error in face recognition:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== 3. EMERGENCY SOS APIs ====================
app.get('/api/sos-alerts', async (req, res) => {
    try {
        const rows = await SosAlert.find().sort({ created_at: -1 }).limit(100);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching SOS alerts:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/shake-sos', async (req, res) => {
    try {
        const { latitude, longitude, shake_intensity } = req.body;
        const newAlert = new SosAlert({
            alert_type: 'shake',
            latitude,
            longitude,
            shake_intensity
        });
        await newAlert.save();
        console.log(`🚨 SHAKE SOS triggered!`);
        res.json({ success: true, message: 'Shake SOS saved!' });
    } catch (err) {
        console.error('Error saving shake SOS:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/voice-sos', async (req, res) => {
    try {
        const { student_name, room_no, voice_command, latitude, longitude } = req.body;
        const newAlert = new SosAlert({
            alert_type: 'voice',
            student_name,
            room_no,
            voice_command,
            latitude,
            longitude
        });
        await newAlert.save();
        console.log(`🚨 VOICE SOS triggered: ${voice_command}`);
        res.json({ success: true, message: 'Voice SOS saved!' });
    } catch (err) {
        console.error('Error saving voice SOS:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/manual-sos', async (req, res) => {
    try {
        // ✅ NEW: photo_data bhi receive karta hai
        const { latitude, longitude, photo_name, photo_data } = req.body;
        const newAlert = new SosAlert({
            alert_type: 'manual',
            latitude,
            longitude,
            photo_name,
            photo_data // ✅ NEW: Photo MongoDB mein save hogi
        });
        await newAlert.save();
        console.log(`🚨 MANUAL SOS triggered!`);
        res.json({ success: true, message: 'Manual SOS saved!' });
    } catch (err) {
        console.error('Error saving manual SOS:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== 4. EXPENSE TRACKER APIs ====================
app.post('/api/expenses', async (req, res) => {
    try {
        const { title, amount, payer_name, split_members } = req.body;
        const newExpense = new Expense({
            title,
            amount,
            payer_name,
            split_members
        });
        await newExpense.save();
        console.log(`💰 Expense added: ${title} - ₹${amount}`);
        res.json({ success: true, message: 'Expense saved!' });
    } catch (err) {
        console.error('Error adding expense:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/expenses', async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ created_at: -1 });
        res.json(expenses);
    } catch (err) {
        console.error('Error fetching expenses:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/personal-budget', async (req, res) => {
    try {
        const { budget_amount } = req.body;
        await PersonalBudget.deleteMany({});
        const newBudget = new PersonalBudget({ budget_amount });
        await newBudget.save();
        console.log(`✅ Budget set: ₹${budget_amount}`);
        res.json({ success: true, message: 'Budget saved!' });
    } catch (err) {
        console.error('Error setting budget:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/personal-expense', async (req, res) => {
    try {
        const { title, amount } = req.body;
        const newExpense = new PersonalExpense({ title, amount });
        await newExpense.save();
        console.log(`💸 Personal expense: ${title} - ₹${amount}`);
        res.json({ success: true, message: 'Personal expense saved!' });
    } catch (err) {
        console.error('Error adding personal expense:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/personal-expenses', async (req, res) => {
    try {
        const expenses = await PersonalExpense.find().sort({ created_at: -1 });
        const budget = await PersonalBudget.findOne().sort({ created_at: -1 });
        res.json({ expenses, budget: budget || null });
    } catch (err) {
        console.error('Error fetching personal expenses:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== 5. COMPLAINTS APIs ====================
app.get('/api/complaints', async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ created_at: -1 });
        res.json(complaints);
    } catch (err) {
        console.error('Error fetching complaints:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/complaints', async (req, res) => {
    try {
        const { student_name, room_no, category, priority, description } = req.body;
        const newComplaint = new Complaint({
            student_name,
            room_no,
            category,
            priority,
            description
        });
        await newComplaint.save();
        console.log(`📝 Complaint filed: ${student_name} - ${category}`);
        res.json({ success: true, message: 'Complaint submitted!' });
    } catch (err) {
        console.error('Error filing complaint:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/complaints/:id', async (req, res) => {
    try {
        const { status, resolution_note } = req.body;
        await Complaint.findByIdAndUpdate(
            req.params.id,
            { status, resolution_note: resolution_note || '' },
            { new: true }
        );
        console.log(`✅ Complaint ${req.params.id} updated to ${status}`);
        res.json({ success: true, message: 'Complaint updated!' });
    } catch (err) {
        console.error('Error updating complaint:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/complaints/:id', async (req, res) => {
    try {
        await Complaint.findByIdAndDelete(req.params.id);
        console.log(`🗑️ Complaint ${req.params.id} deleted`);
        res.json({ success: true, message: 'Complaint deleted!' });
    } catch (err) {
        console.error('Error deleting complaint:', err);
        res.status(500).json({ error: err.message });
    }
});

// Start Server (Render + Local dono ke liye)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('\n===========================================');
    console.log(`✅ SERVER RUNNING on port ${PORT}`);
    console.log(`✅ Database: pg_safety_db (MongoDB)`);
    console.log('===========================================\n');
});
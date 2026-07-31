const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// 🔧 MySQL Connection - APNA PASSWORD YAHAN DALO
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'pass@2006',  // ⚠️ Agar MySQL password hai toh yahan likho
    database: 'pg_safety_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test Connection
async function testConnection() {
    try {
        const connection = await db.getConnection();
        console.log('✅ Database connected successfully!');
        connection.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
    }
}
testConnection();

// ==================== 1. BED TRACKER APIs ====================
app.get('/api/rooms', async (req, res) => {
    try {
        const [rooms] = await db.query('SELECT * FROM rooms ORDER BY created_at DESC');
        const [beds] = await db.query('SELECT * FROM beds');
        res.json({ rooms, beds });
    } catch (err) { 
        console.error('Error fetching rooms:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/rooms', async (req, res) => {
    try {
        const { room_no, location, sharing, image_url } = req.body;
        await db.query(
            'INSERT INTO rooms (room_no, location, sharing_capacity, image_url) VALUES (?, ?, ?, ?)', 
            [room_no, location, sharing, image_url]
        );
        
        // Auto-create beds
        const labels = sharing > 2 ? ['A', 'B', 'C', 'D'].slice(0, sharing) : (sharing === 1 ? ['1'] : ['A', 'B']);
        for (const label of labels) {
            await db.query('INSERT IGNORE INTO beds (room_no, bed_label) VALUES (?, ?)', [room_no, label]);
        }
        console.log(`✅ Room ${room_no} added successfully`);
        res.json({ success: true, message: 'Room added!' });
    } catch (err) { 
        console.error('Error adding room:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/beds/update', async (req, res) => {
    try {
        const { room_no, bed_label, status, name, degree } = req.body;
        await db.query(
            `UPDATE beds SET status = ?, roommate_name = ?, roommate_degree = ? WHERE room_no = ? AND bed_label = ?`,
            [status, name || 'Vacant', degree || '-', room_no, bed_label]
        );
        console.log(`✅ Bed ${room_no}-${bed_label} updated to ${status}`);
        res.json({ success: true });
    } catch (err) { 
        console.error('Error updating bed:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// ==================== 2. PG MANAGEMENT APIs ====================
app.post('/api/entry-log', async (req, res) => {
    try {
        const { student_name, room_no, entry_type } = req.body;
        await db.query(
            'INSERT INTO entry_logs (student_name, room_no, entry_type) VALUES (?, ?, ?)', 
            [student_name, room_no, entry_type]
        );
        console.log(`✅ Entry logged: ${student_name} ${entry_type}`);
        res.json({ success: true, message: 'Entry logged!' });
    } catch (err) { 
        console.error('Error logging entry:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/late-arrival', async (req, res) => {
    try {
        const { student_name, expected_time, reason } = req.body;
        await db.query(
            'INSERT INTO late_arrivals (student_name, expected_time, reason) VALUES (?, ?, ?)', 
            [student_name, expected_time, reason]
        );
        console.log(`✅ Late arrival: ${student_name}`);
        res.json({ success: true, message: 'Late arrival recorded!' });
    } catch (err) { 
        console.error('Error recording late arrival:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/emergency-contact', async (req, res) => {
    try {
        const { contact_name, phone_number } = req.body;
        await db.query(
            'INSERT INTO emergency_contacts (contact_name, phone_number) VALUES (?, ?)', 
            [contact_name, phone_number]
        );
        console.log(`✅ Contact added: ${contact_name}`);
        res.json({ success: true, message: 'Contact saved!' });
    } catch (err) { 
        console.error('Error adding contact:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/face-register', async (req, res) => {
    try {
        const { student_name, room_no, face_descriptor } = req.body;
        await db.query(
            'INSERT INTO face_registrations (student_name, room_no, face_descriptor) VALUES (?, ?, ?)', 
            [student_name, room_no, JSON.stringify(face_descriptor)]
        );
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
        const [registrations] = await db.query('SELECT * FROM face_registrations');
        
        let bestMatch = null;
        let minDistance = Infinity;

        for (const reg of registrations) {
            const storedDesc = JSON.parse(reg.face_descriptor);
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
app.post('/api/shake-sos', async (req, res) => {
    try {
        const { latitude, longitude, shake_intensity } = req.body;
        await db.query(
            'INSERT INTO sos_alerts (alert_type, latitude, longitude, shake_intensity) VALUES (?, ?, ?, ?)', 
            ['shake', latitude, longitude, shake_intensity]
        );
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
        await db.query(
            'INSERT INTO sos_alerts (alert_type, voice_command, latitude, longitude) VALUES (?, ?, ?, ?)', 
            ['voice', voice_command, latitude, longitude]
        );
        console.log(`🚨 VOICE SOS triggered: ${voice_command}`);
        res.json({ success: true, message: 'Voice SOS saved!' });
    } catch (err) { 
        console.error('Error saving voice SOS:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/manual-sos', async (req, res) => {
    try {
        const { latitude, longitude, photo_name } = req.body;
        await db.query(
            'INSERT INTO sos_alerts (alert_type, latitude, longitude, photo_name) VALUES (?, ?, ?, ?)', 
            ['manual', latitude, longitude, photo_name]
        );
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
        await db.query(
            'INSERT INTO expenses (title, amount, payer_name, split_members) VALUES (?, ?, ?, ?)', 
            [title, amount, payer_name, JSON.stringify(split_members)]
        );
        console.log(` Expense added: ${title} - ₹${amount}`);
        res.json({ success: true, message: 'Expense saved!' });
    } catch (err) { 
        console.error('Error adding expense:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.get('/api/expenses', async (req, res) => {
    try {
        const [expenses] = await db.query('SELECT * FROM expenses ORDER BY created_at DESC');
        res.json(expenses);
    } catch (err) { 
        console.error('Error fetching expenses:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/personal-budget', async (req, res) => {
    try {
        const { budget_amount } = req.body;
        await db.query('DELETE FROM personal_budget'); // Clear old
        await db.query('INSERT INTO personal_budget (budget_amount) VALUES (?)', [budget_amount]);
        console.log(`💵 Budget set: ₹${budget_amount}`);
        res.json({ success: true, message: 'Budget saved!' });
    } catch (err) { 
        console.error('Error setting budget:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/personal-expense', async (req, res) => {
    try {
        const { title, amount } = req.body;
        await db.query(
            'INSERT INTO personal_expenses (title, amount) VALUES (?, ?)', 
            [title, amount]
        );
        console.log(`💸 Personal expense: ${title} - ₹${amount}`);
        res.json({ success: true, message: 'Personal expense saved!' });
    } catch (err) { 
        console.error('Error adding personal expense:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.get('/api/personal-expenses', async (req, res) => {
    try {
        const [expenses] = await db.query('SELECT * FROM personal_expenses ORDER BY created_at DESC');
        const [budget] = await db.query('SELECT * FROM personal_budget LIMIT 1');
        res.json({ expenses, budget: budget[0] || null });
    } catch (err) { 
        console.error('Error fetching personal expenses:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// ==================== 5. COMPLAINTS APIs ====================
app.get('/api/complaints', async (req, res) => {
    try {
        const [complaints] = await db.query('SELECT * FROM complaints ORDER BY created_at DESC');
        res.json(complaints);
    } catch (err) { 
        console.error('Error fetching complaints:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/complaints', async (req, res) => {
    try {
        const { student_name, room_no, category, priority, description } = req.body;
        await db.query(
            'INSERT INTO complaints (student_name, room_no, category, priority, description) VALUES (?, ?, ?, ?, ?)', 
            [student_name, room_no, category, priority, description]
        );
        console.log(` Complaint filed: ${student_name} - ${category}`);
        res.json({ success: true, message: 'Complaint submitted!' });
    } catch (err) { 
        console.error('Error filing complaint:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.put('/api/complaints/:id', async (req, res) => {
    try {
        const { status, resolution_note } = req.body;
        await db.query(
            'UPDATE complaints SET status = ?, resolution_note = ? WHERE id = ?', 
            [status, resolution_note, req.params.id]
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
        await db.query('DELETE FROM complaints WHERE id = ?', [req.params.id]);
        console.log(`🗑️ Complaint ${req.params.id} deleted`);
        res.json({ success: true, message: 'Complaint deleted!' });
    } catch (err) { 
        console.error('Error deleting complaint:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log('===========================================');
    console.log(`✅ SERVER RUNNING on http://localhost:${PORT}`);
    console.log(`✅ Database: pg_safety_db`);
    console.log('===========================================');
});
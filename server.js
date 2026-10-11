console.log("🔥 SUPERCHARGED PG-MITRA AI - TRILINGUAL (HINDI/MARATHI/ENGLISH) & ADVANCED SMART PG SYSTEM 🔥");

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { HfInference } = require('@huggingface/inference');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/favicon.ico', (req, res) => {
res.status(204).end();
});

const hf = process.env.HUGGINGFACE_API_KEY ? new HfInference(process.env.HUGGINGFACE_API_KEY) : null;

// ==================== MONGOOSE SCHEMAS & MODELS ====================
const roomSchema = new mongoose.Schema({
room_no: { type: String, required: true, unique: true },
location: { type: String, default: 'Main Wing' },
sharing_capacity: { type: Number, default: 2 },
image_url: { type: String, default: '' },
submeter_prev: { type: Number, default: 0 },
submeter_current: { type: Number, default: 0 },
created_at: { type: Date, default: Date.now }
});
const Room = mongoose.model('Room', roomSchema);

const bedSchema = new mongoose.Schema({
room_no: { type: String, required: true },
bed_label: { type: String, required: true },
status: { type: String, default: 'vacant' },
roommate_name: { type: String, default: 'Vacant' },
roommate_degree: { type: String, default: '-' },
rent_amount: { type: Number, default: 8500 }
});
bedSchema.index({ room_no: 1, bed_label: 1 }, { unique: true });
const Bed = mongoose.model('Bed', bedSchema);

const entryLogSchema = new mongoose.Schema({
entry_number: { type: String, default: '' },
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
photo_data: String,
created_at: { type: Date, default: Date.now }
});
const SosAlert = mongoose.model('SosAlert', sosAlertSchema);

const expenseSchema = new mongoose.Schema({
title: String,
amount: Number,
payer_name: String,
split_members: [String],
ai_category: { type: String, default: 'Other' },
ai_tip: { type: String, default: '' },
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
category: { type: String, default: 'Maintenance' },
priority: { type: String, default: 'Normal' },
description: String,
ai_reason: { type: String, default: '' },
status: { type: String, default: 'pending' },
resolution_note: { type: String, default: '' },
created_at: { type: Date, default: Date.now }
});
const Complaint = mongoose.model('Complaint', complaintSchema);

const messMenuSchema = new mongoose.Schema({
day: { type: String, required: true, unique: true },
breakfast: String,
lunch: String,
snacks: String,
dinner: String
});
const MessMenu = mongoose.model('MessMenu', messMenuSchema);

const mealSkipSchema = new mongoose.Schema({
student_name: String,
room_no: String,
date: { type: String, default: () => new Date().toISOString().split('T')[0] },
meal_type: { type: String, default: 'dinner' },
created_at: { type: Date, default: Date.now }
});
const MealSkip = mongoose.model('MealSkip', mealSkipSchema);

const messFeedbackSchema = new mongoose.Schema({
student_name: String,
room_no: String,
rating: { type: Number, default: 5 },
meal_type: { type: String, default: 'Dinner' },
comment: String,
date: { type: String, default: () => new Date().toISOString().split('T')[0] },
created_at: { type: Date, default: Date.now }
});
const MessFeedback = mongoose.model('MessFeedback', messFeedbackSchema);

// Connect to MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/pg_safety_db?retryWrites=true&w=majority';
mongoose.connect(MONGODB_URI)
.then(async () => {
console.log('✅ Database connected successfully: pg_safety_db');
await seedDefaultMessMenu();
})
.catch(err => console.error('❌ Database connection failed:', err.message));

async function seedDefaultMessMenu() {
try {
const count = await MessMenu.countDocuments();
if (count === 0) {
const defaultMenu = [
{ day: "Monday", breakfast: "Aloo Paratha with Fresh Curd & Pickle, Tea/Coffee", lunch: "Dal Tadka, Steamed Basmati Rice, Paneer Butter Masala, Roti, Fresh Salad", snacks: "Samosa with Mint Chutney, Masala Chai", dinner: "Veg Pulao, Dal Makhani, Mixed Seasonal Veg, Chapati, Gulab Jamun" },
{ day: "Tuesday", breakfast: "Crispy Masala Dosa, Sambar, Coconut Chutney, Filter Coffee", lunch: "Punjabi Rajma Chawal, Jeera Rice, Bhindi Masala, Phulka, Boondi Raita", snacks: "Veg Grilled Cheese Sandwich, Hot Tea", dinner: "Egg Curry / Kadai Paneer, Yellow Dal Fry, Steamed Rice, Tawa Roti" },
{ day: "Wednesday", breakfast: "Indori Poha with Sev & Roasted Peanuts, Boiled Eggs / Banana, Tea", lunch: "Amritsari Chole Bhature / Rice, Dal Fry, Cucumber Tomato Salad", snacks: "Bhel Puri, Masala Cutting Chai", dinner: "Butter Chicken / Shahi Paneer, Jeera Rice, Laccha Paratha, Kheer" },
{ day: "Thursday", breakfast: "Soft Idli & Medu Vada Combo, Gunpowder Podi, Sambar, Filter Coffee", lunch: "Gujarati Kadhi Pakora, Steamed Rice, Aloo Gobi Masala, Roti, Roasted Papad", snacks: "Kanda Bhajji (Onion Fritters), Ginger Tea", dinner: "Dal Palak, Matar Mushroom Gravy, Jeera Rice, Phulka, Moong Dal Halwa" },
{ day: "Friday", breakfast: "Paneer Stuffed Kulcha / Butter Toast, Fluffy Omelette, Tea", lunch: "Royal South Indian Thali: Sambar, Tomato Rasam, Curd Rice, Crisp Appalam", snacks: "Mumbai Pav Bhaji, Filter Coffee", dinner: "Chicken Dum Biryani / Veg Hyderabadi Biryani, Mirchi Ka Salan, Raita, Ice Cream" },
{ day: "Saturday", breakfast: "Poori Saagu with Chana Masala, Suji Halwa, Tea", lunch: "Dal Fry, Veg Fried Rice, Manchurian Gravy, Hakka Noodles, Kimchi Salad", snacks: "Crispy Corn Chaat, Masala Tea", dinner: "Malai Kofta, Kashmiri Pulao, Butter Naan, Green Salad, Rasgulla" },
{ day: "Sunday", breakfast: "Special Onion Uttapam & Medu Vada, Coconut Chutney, Filter Coffee", lunch: "Sunday Grand Feast: Paneer Tikka / Mutton Curry, Dal Bukhara, Pulao, Breads", snacks: "Bakery Biscuits, Hot Tea & Coffee", dinner: "Comfort Khichdi & Kadhi, Aloo Chokha, Papad, Mango Pickle" }
];
await MessMenu.insertMany(defaultMenu);
console.log('✅ Default 7-day Mess Menu initialized!');
}
} catch (e) {
console.warn('Mess menu seed error:', e.message);
}
}

// ==================== DETERMINISTIC COMPLAINT AI CLASSIFICATION ====================
function classifyComplaint(desc) {
const text = (desc || "").toLowerCase().trim();
let category = "Maintenance";
let priority = "Normal";
let estTime = "Same Day (4 to 6 Hours)";
let reason = "Standard maintenance request auto-detected by AI";

if (/(shock|current|spark|short circuit|fire|aag|gas|smoke|dhua|dhuvand|flood|pani bhar|overflow|theft|chori|broken lock|lock toot|darwaja toot|kulup|tutla|stolen|emergency|khatra)/i.test(text)) {
category = "Safety & Electrical";
priority = "Urgent";
estTime = "Immediate (30 Mins)";
reason = "Critical safety hazard or security risk auto-detected by AI";
} else if (/(water|pani|leak|leakage|galati|tap|nal|pipe|flush|washbasin|basin|geyser|drain|drainage|tank|clog|sandas|toilet|bathroom)/i.test(text)) {
category = "Plumbing";
priority = "High";
estTime = "1 to 2 Hours";
reason = "Essential daily water / sanitation amenity disruption";
} else if (/(fan|pankha|ac|light|tube|tubelight|bulb|switch|socket|wiring|plug|inverter|bijli|power|diva)/i.test(text)) {
category = "Electrical";
priority = "High";
estTime = "2 to 3 Hours";
reason = "Room electrical fixture or ventilation problem";
} else if (/(wifi|wi-fi|internet|net|router|speed|network|range|signal)/i.test(text)) {
category = "Wi-Fi & Network";
priority = "High";
estTime = "1 to 2 Hours";
reason = "Digital study & remote work network disruption";
} else if (/(food|khana|jevan|meal|mess|roti|sabzi|bhaji|poli|dinner|lunch|breakfast|quality|taste|raw|stale|kharab|swad)/i.test(text)) {
category = "Mess & Food";
priority = "High";
estTime = "Next Meal Schedule";
reason = "Hostel mess food quality / dining issue";
} else if (/(clean|safai|kachra|trash|dust|dustbin|broom|jhadu|pocha|swachhata|bedsheet|mattress|gadda|wardrobe|almirah|cupboard|window|khidki|curtain|parda|chair|table)/i.test(text)) {
category = "Housekeeping";
priority = "Normal";
estTime = "Same Day (Afternoon)";
reason = "Standard room cleanliness and furniture upkeep";
}

return { category, priority, estTime, reason };
}

// ==================== LIVE PG CONTEXT BUILDER ====================
async function getFullPGContext() {
const rooms = await Room.find();
const beds = await Bed.find();
const complaints = await Complaint.find();
const expenses = await Expense.find();
const contacts = await EmergencyContact.find();
const lateArrivals = await LateArrival.find().sort({ created_at: -1 }).limit(5);
const personalBudget = await PersonalBudget.findOne().sort({ created_at: -1 });
const personalExpenses = await PersonalExpense.find();
const today = new Date().toISOString().split('T')[0];
const skipsToday = await MealSkip.find({ date: today });
const feedbacksToday = await MessFeedback.find({ date: today }).sort({ created_at: -1 });
const currentDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
const todayMenu = await MessMenu.findOne({ day: currentDay });

const totalRooms = rooms.length;
const totalBeds = beds.length;
const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
const vacantBeds = beds.filter(b => b.status === 'vacant').length;
const totalPgExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
const personalSpent = personalExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
const budgetAmount = personalBudget ? personalBudget.budget_amount : 0;
const remainingBudget = budgetAmount - personalSpent;

return {
totalRooms, totalBeds, occupiedBeds, vacantBeds,
rooms, beds, complaints, expenses, contacts,
lateArrivals, personalBudget, personalExpenses,
totalPgExpense, personalSpent, budgetAmount, remainingBudget,
skipsToday, feedbacksToday, todayMenu, currentDay
};
}

// ==================== TRILINGUAL NLP ENGINE ====================
function detectLanguage(text, forcedLang) {
if (forcedLang && ['mr', 'hi', 'en'].includes(forcedLang)) return forcedLang;

const t = (text || "").toLowerCase();
const mrTokens = ['kiti', 'kuthe', 'rikam', 'aahe', 'aahet', 'jevnaat', 'jevan', 'kay', 'konta', 'konti', 'konte', 'kashi', 'kasa', 'kholit', 'kholi', 'sang', 'sanga', 'takraar', 'nav', 'naav', 'madhe', 'aani', 'paise', 'ahes', 'aaho', 'dya', 'karu', 'kutha'];
if (mrTokens.some(tok => t.includes(tok)) || /[\u0900-\u097F]/.test(t) && (t.includes('आहे') || t.includes('आहेत') || t.includes('नाही') || t.includes('जेवण') || t.includes('तक्रार') || t.includes('किती') || t.includes('कुठे') || t.includes('सांगा') || t.includes('नाव'))) {
return 'mr';
}

const hiTokens = ['kitna', 'kitni', 'kitne', 'kaha', 'khali', 'khaali', 'hai', 'hain', 'khane', 'khana', 'kya', 'kaunsa', 'kaunsi', 'konsi', 'kisme', 'batao', 'shikayat', 'naam', 'aur', 'bhi', 'karein', 'karo', 'mujhe', 'konasi', 'konai'];
if (hiTokens.some(tok => t.includes(tok)) || /[\u0900-\u097F]/.test(t)) {
return 'hi';
}

return 'en';
}

async function getDatabaseInfo(query, forcedLang = null) {
const rawMsg = (query || "").trim();
const msg = rawMsg.toLowerCase().replace(/['"?,.!]/g, ' ').replace(/\s+/g, ' ').trim();
const lang = detectLanguage(rawMsg, forcedLang);
const ctx = await getFullPGContext();

const L = (mr, hi, en) => lang === 'mr' ? mr : (lang === 'hi' ? hi : en);

// 1. PERSONAL BUDGET & EXPENSES
const isBudgetQuery = /\b(buget|budget)\b/i.test(msg) || msg.includes('buget') || msg.includes('budget') || (msg.includes('personal') && (msg.includes('spent') || msg.includes('balance') || msg.includes('limit') || msg.includes('saving') || msg.includes('expense') || msg.includes('cost') || msg.includes('kya') || msg.includes('kitna') || msg.includes('kiti') || msg.includes('how')));

if (isBudgetQuery) {
if (lang === 'mr') {
let res = `💰 **वैयक्तिक बजेट आणि खर्चाचा तपशील:**\n`;
if (ctx.personalBudget && ctx.budgetAmount > 0) {
const pctUsed = Math.round((ctx.personalSpent / ctx.budgetAmount) * 100);
const health = ctx.remainingBudget >= 0 ? `उत्तम (${pctUsed}% वापर, ₹${ctx.remainingBudget.toFixed(2)} शिल्लक)` : `बजेट ओलांडले (₹${Math.abs(ctx.remainingBudget).toFixed(2)} जास्त खर्च झाला)!`;
res += `• 🎯 **मासिक बजेट मर्यादा:** ₹${ctx.budgetAmount.toFixed(2)}\n• 💸 **या महिन्यातील एकूण खर्च:** ₹${ctx.personalSpent.toFixed(2)}\n• ${ctx.remainingBudget >= 0 ? '🟢' : ''} **शिल्लक रक्कम:** **₹${ctx.remainingBudget.toFixed(2)}**\n• 📊 **बजेट आरोग्य:** ${health}\n`;
} else {
res += `• 🎯 **मासिक बजेट मर्यादा:** अद्याप सेट केलेली नाही.\n• 💸 **एकूण खर्च:** ₹${ctx.personalSpent.toFixed(2)}\n`;
}
if (ctx.personalExpenses.length > 0) {
res += `**नुकतेच केलेले खर्च:**\n`;
ctx.personalExpenses.slice(0, 5).forEach((e, idx) => { res += `${idx + 1}. ${e.title}: **${e.amount.toFixed(2)}**\n`; });
}
return res;
} else if (lang === 'hi') {
let res = `💰 **व्यक्तिगत बजट और खर्च का विवरण:**\n`;
if (ctx.personalBudget && ctx.budgetAmount > 0) {
const pctUsed = Math.round((ctx.personalSpent / ctx.budgetAmount) * 100);
const health = ctx.remainingBudget >= 0 ? `संतुलित (${pctUsed}% उपयोग, ₹${ctx.remainingBudget.toFixed(2)} शेष)` : `बजट से ₹${Math.abs(ctx.remainingBudget).toFixed(2)} अधिक खर्च!`;
res += `• 🎯 **मासिक बजट सीमा:** ₹${ctx.budgetAmount.toFixed(2)}\n• 💸 **इस महीने का कुल खर्च:** ₹${ctx.personalSpent.toFixed(2)}\n• ${ctx.remainingBudget >= 0 ? '🟢' : '🔴'} **शेष राशि (Remaining):** **₹${ctx.remainingBudget.toFixed(2)}**\n• 📊 **बजट स्थिति:** ${health}\n`;
} else {
res += `• 🎯 **मासिक बजट सीमा:** अभी सेट नहीं की गई है।\n• 💸 **कुल खर्च:** ₹${ctx.personalSpent.toFixed(2)}\n`;
}
if (ctx.personalExpenses.length > 0) {
res += `**हाल ही के व्यक्तिगत खर्च:**\n`;
ctx.personalExpenses.slice(0, 5).forEach((e, idx) => { res += `${idx + 1}. ${e.title}: **₹${e.amount.toFixed(2)}**\n`; });
}
return res;
} else {
let res = ` **Personal Budget & Expense Overview:**\n`;
if (ctx.personalBudget && ctx.budgetAmount > 0) {
const pctUsed = Math.round((ctx.personalSpent / ctx.budgetAmount) * 100);
res += `•  **Monthly Budget Limit:** ₹${ctx.budgetAmount.toFixed(2)}\n• 💸 **Total Spent This Month:** ₹${ctx.personalSpent.toFixed(2)}\n• ${ctx.remainingBudget >= 0 ? '🟢' : ''} **Remaining Balance:** **₹${ctx.remainingBudget.toFixed(2)}**\n•  **Budget Health:** ${ctx.remainingBudget >= 0 ? `Healthy (${pctUsed}% used)` : `Exceeded by ₹${Math.abs(ctx.remainingBudget).toFixed(2)}`}\n`;
} else {
res += `•  **Monthly Budget Limit:** Not configured yet.\n• 💸 **Total Spent:** ₹${ctx.personalSpent.toFixed(2)}\n`;
}
if (ctx.personalExpenses.length > 0) {
res += `**Recent Personal Transactions:**\n`;
ctx.personalExpenses.slice(0, 5).forEach((e, idx) => { res += `${idx + 1}. ${e.title}: **₹${e.amount.toFixed(2)}**\n`; });
}
return res;
}
}

// 2. ROOMMATE NAMES & OCCUPANT DIRECTORY
const isRoommateQuery = (msg.includes('roomate') || msg.includes('roommate') || msg.includes('occupant') || msg.includes('resident') || msg.includes('student') || msg.includes('rehta') || msg.includes('rehti') || msg.includes('rahto') || msg.includes('rahte') || msg.includes('living')) && (msg.includes('name') || msg.includes('naam') || msg.includes('nav') || msg.includes('naav') || msg.includes('kya') || msg.includes('kay') || msg.includes('who') || msg.includes('list') || msg.includes('detail') || msg.includes('occupied') || msg.includes('room'));

if (isRoommateQuery) {
const occupiedBeds = ctx.beds.filter(b => b.status === 'occupied');
if (lang === 'mr') {
let res = `👥 **पीजीमधील सध्याचे रूममेट्स आणि रहिवाशांची यादी:**\nसध्या एकूण **${occupiedBeds.length} विद्यार्थी / रहिवासी** ${ctx.totalRooms} रूम्समध्ये राहत आहेत:\n`;
ctx.rooms.forEach(r => {
const rBeds = ctx.beds.filter(b => b.room_no === r.room_no);
res += `🏠 **रूम ${r.room_no}** (${r.sharing_capacity}-शेअरिंग, ${r.location}):\n`;
rBeds.forEach(b => {
res += b.status === 'occupied' ? `   • 🔴 **Bed ${b.bed_label}:** **${b.roommate_name}** | शिक्षण/काम: *${b.roommate_degree || '-'}*\n` : `   • 🟢 **Bed ${b.bed_label}:** [रिकामे बेड - प्रवेशासाठी उपलब्ध]\n`;
});
res += `\n`;
});
res += `💡 *वॉर्डन कंट्रोल मोड वापरून आपण कधीही रूममेटची माहिती अपडेट करू शकता!*`;
return res;
} else if (lang === 'hi') {
let res = `👥 **पीजी के वर्तमान रूममेट्स और रहने वाले सदस्यों की सूची:**\nवर्तमान में **${occupiedBeds.length} सदस्य** ${ctx.totalRooms} रूम्स में रह रहे हैं:\n`;
ctx.rooms.forEach(r => {
const rBeds = ctx.beds.filter(b => b.room_no === r.room_no);
res += `🏠 **रूम ${r.room_no}** (${r.sharing_capacity}-शेयरिंग, ${r.location}):\n`;
rBeds.forEach(b => {
res += b.status === 'occupied' ? `   •  **Bed ${b.bed_label}:** **${b.roommate_name}** | डिग्री/जॉब: *${b.roommate_degree || '-'}*\n` : `   • 🟢 **Bed ${b.bed_label}:** [खाली बेड - तुरंत उपलब्ध]\n`;
});
res += `\n`;
});
res += `💡 *वार्डन कंट्रोल मोड से आप रूममेट की जानकारी कभी भी अपडेट कर सकते हैं!*`;
return res;
} else {
let res = `👥 **Current Roommates & Resident Directory:**\nCurrently, **${occupiedBeds.length} occupant(s)** are residing across ${ctx.totalRooms} rooms:\n`;
ctx.rooms.forEach(r => {
const rBeds = ctx.beds.filter(b => b.room_no === r.room_no);
res += ` **Room ${r.room_no}** (${r.sharing_capacity}-Sharing, ${r.location}):\n`;
rBeds.forEach(b => {
res += b.status === 'occupied' ? `   • 🔴 **Bed ${b.bed_label}:** **${b.roommate_name}** | Degree/Job: *${b.roommate_degree || '-'}*\n` : `   • 🟢 **Bed ${b.bed_label}:** [Vacant Bed - Ready to Move]\n`;
});
res += `\n`;
});
res += `💡 *Switch to Warden Control Mode in the Bed Tracker to update roommate details!*`;
return res;
}
}

// 3. SPECIFIC ROOM SEARCH
const roomNumberMatch = msg.match(/\b(?:room|kamra|kholi|rm|no|number)?\s*(\d{1,4})\b/i);
if (roomNumberMatch && (msg.includes('room') || msg.includes('kamra') || msg.includes('kholi') || msg.includes('bed') || msg.includes('detail') || msg.includes('check') || msg.includes('status') || msg.includes('kya') || msg.includes('kay') || msg.includes('hai') || msg.includes('aahe')) && !msg.includes('100') && !msg.includes('112') && !msg.includes('102') && !msg.includes('101') && !msg.includes('police')) {
const targetRoomNo = roomNumberMatch[1];
const targetRoom = ctx.rooms.find(r => r.room_no === targetRoomNo);
const roomBeds = ctx.beds.filter(b => b.room_no === targetRoomNo);

if (targetRoom || roomBeds.length > 0) {
const vacantBeds = roomBeds.filter(b => b.status === 'vacant');
if (lang === 'mr') {
let res = `🏠 **रूम ${targetRoomNo} संपूर्ण माहिती:**\n• 📍 **स्थान (Location):** ${targetRoom?.location || 'Main Wing'}\n• 👥 **रूमचा प्रकार:** ${targetRoom?.sharing_capacity || roomBeds.length}-शेअरिंग रूम\n• ️ **उपलब्धता:** ${roomBeds.length} पैकी **${vacantBeds.length} बेड्स रिकामे आहेत**\n**प्रत्येक बेडची थेट स्थिती:**\n`;
roomBeds.forEach(bed => { res += bed.status === 'vacant' ? `• 🟢 **Bed ${bed.bed_label}:** ✅ **रिकामे (VACANT)** - त्वरित उपलब्ध\n` : `• 🔴 **Bed ${bed.bed_label}:** राहत आहेत: **${bed.roommate_name}** (${bed.roommate_degree || '-'})\n`; });
return res;
} else if (lang === 'hi') {
let res = ` **रूम ${targetRoomNo} की पूरी जानकारी:**\n• 📍 **लोकेशन:** ${targetRoom?.location || 'Main Wing'}\n• 👥 **रूम का प्रकार:** ${targetRoom?.sharing_capacity || roomBeds.length}-शेयरिंग रूम\n• ️ **उपलब्धता:** ${roomBeds.length} में से **${vacantBeds.length} बेड्स खाली हैं**\n**बेड अनुसार लाइव स्टेटस:**\n`;
roomBeds.forEach(bed => { res += bed.status === 'vacant' ? `• 🟢 **Bed ${bed.bed_label}:** ✅ **खाली (VACANT)** - तुरंत रहने योग्य\n` : `• 🔴 **Bed ${bed.bed_label}:** निवासी: **${bed.roommate_name}** (${bed.roommate_degree || '-'})\n`; });
return res;
} else {
let res = `🏠 **Room ${targetRoomNo} Full Details:**\n•  **Location:** ${targetRoom?.location || 'Main Wing'}\n• 👥 **Room Type:** ${targetRoom?.sharing_capacity || roomBeds.length}-Sharing Room\n• 🛏️ **Availability:** **${vacantBeds.length} vacant bed(s)** out of ${roomBeds.length}\n**Bed-by-Bed Live Status:**\n`;
roomBeds.forEach(bed => { res += bed.status === 'vacant' ? `• 🟢 **Bed ${bed.bed_label}:** ✅ **VACANT** - Ready to Move\n` : `• 🔴 **Bed ${bed.bed_label}:** Occupied by **${bed.roommate_name}** (${bed.roommate_degree || '-'})\n`; });
return res;
}
}
}

// 4. LIST ALL ROOM NUMBERS IN PG
if (msg.includes('room no kya') || msg.includes('room no kay') || msg.includes('room number kya') || msg.includes('list room') || msg.includes('all room') || msg.includes('what are the room') || msg.includes('which rooms') || msg.includes('total room') || msg.includes('kiti room')) {
if (lang === 'mr') {
let res = `🏠 **सनशाईन रेसिडेन्सी पीजी - रूम्सची यादी:**\nआपल्या पीजीमध्ये एकूण **${ctx.totalRooms} रूम्स** असून एकूण क्षमता **${ctx.totalBeds} बेड्स** आहे:\n`;
ctx.rooms.forEach((r, idx) => {
const rBeds = ctx.beds.filter(b => b.room_no === r.room_no);
const vacant = rBeds.filter(b => b.status === 'vacant').length;
res += `${idx + 1}.  **रूम ${r.room_no}** (${r.location}): ${r.sharing_capacity}-शेअरिंग | **${vacant} बेड्स रिकामे**\n`;
});
return res;
} else if (lang === 'hi') {
let res = `🏠 **सनशाइन रेजीडेंसी पीजी - रजिस्टर्ड रूम्स की सूची:**\nहमारे पीजी में कुल **${ctx.totalRooms} रूम्स** हैं और कुल क्षमता **${ctx.totalBeds} बेड्स** है:\n`;
ctx.rooms.forEach((r, idx) => {
const rBeds = ctx.beds.filter(b => b.room_no === r.room_no);
const vacant = rBeds.filter(b => b.status === 'vacant').length;
res += `${idx + 1}. 🚪 **रूम ${r.room_no}** (${r.location}): ${r.sharing_capacity}-शेयरिंग | **${vacant} बेड्स खाली**\n`;
});
return res;
} else {
let res = `🏠 **Sunshine Residency PG - Registered Rooms List:**\nOur PG currently operates **${ctx.totalRooms} rooms** with a total capacity of **${ctx.totalBeds} beds**:\n`;
ctx.rooms.forEach((r, idx) => {
const rBeds = ctx.beds.filter(b => b.room_no === r.room_no);
const vacant = rBeds.filter(b => b.status === 'vacant').length;
res += `${idx + 1}. 🚪 **Room ${r.room_no}** (${r.location}): ${r.sharing_capacity}-Sharing | **${vacant} Vacant Beds**\n`;
});
return res;
}
}

// 5. ROOM AVAILABILITY / VACANCY
const hasVacancyWord = msg.includes('avail') || msg.includes('avali') || msg.includes('avli') || msg.includes('vacan') || msg.includes('khali') || msg.includes('khaali') || msg.includes('rikam') || msg.includes('jaga') || msg.includes('jagah') || msg.includes('empt') || msg.includes('free') || msg.includes('space') || msg.includes('seat');
const hasRoomContext = msg.includes('room') || msg.includes('kamra') || msg.includes('kholi') || msg.includes('bed') || msg.includes('konasi') || msg.includes('kaunsi') || msg.includes('konsi') || msg.includes('konai') || msg.includes('konti') || msg.includes('konta') || msg.includes('kisme') || msg.includes('kaha') || msg.includes('kuthe') || msg.includes('which') || msg.includes('any') || msg.includes('abhi') || msg.includes('ata');

if (hasVacancyWord && (hasRoomContext || msg.includes('available') || msg.includes('avaliable') || msg.includes('avalible') || msg.includes('vacant') || msg.includes('khali') || msg.includes('rikam'))) {
const roomsWithVacancy = ctx.rooms.map(r => {
const rBeds = ctx.beds.filter(b => b.room_no === r.room_no);
const vacant = rBeds.filter(b => b.status === 'vacant');
return { room: r, beds: rBeds, vacantBeds: vacant };
}).filter(item => item.vacantBeds.length > 0);

if (lang === 'mr') {
let res = `🛏️ **स्मार्ट पीजी - थेट रूम आणि बेड उपलब्धता अहवाल:**\n• **एकूण पीजी रूम्स:** ${ctx.totalRooms}\n• **एकूण बेड्स क्षमता:** ${ctx.totalBeds}\n• **रिकामे बेड्स (प्रवेशासाठी तयार):** **${ctx.vacantBeds} उपलब्ध**\n• **भरलेले बेड्स:** ${ctx.occupiedBeds}\n`;
if (roomsWithVacancy.length > 0) {
res += `✅ **उपलब्ध बेड्स असलेल्या रूम्सची माहिती:**\n`;
roomsWithVacancy.forEach(item => {
const labels = item.vacantBeds.map(b => `Bed ${b.bed_label}`).join(', ');
const occupied = item.beds.filter(b => b.status === 'occupied');
const roommates = occupied.length > 0 ? occupied.map(b => `${b.roommate_name} (${b.roommate_degree || 'विद्यार्थी'})`).join(', ') : 'सध्या रूम पूर्णपणे रिकामी आहे';
res += `🏠 **रूम ${item.room.room_no}** (${item.room.sharing_capacity}-शेअरिंग, ${item.room.location}):\n👉 **${item.vacantBeds.length} बेड्स रिकामे आहेत** (${labels})\n रूममेट्स: ${roommates}\n`;
});
} else { res += `⚠️ सध्या सर्व रूम्स १०% भरलेल्या आहेत।\n`; }
res += `💡 *विशिष्ट रूमची माहिती हवी असल्यास "Room 345 details" किंवा "Room 45" असे विचारा!*`;
return res;
} else if (lang === 'hi') {
let res = `🛏️ **स्मार्ट पीजी - लाइव रूम और बेड उपलब्धता रिपोर्ट:**\n• **कुल पीजी रूम्स:** ${ctx.totalRooms}\n• **कुल बेड्स क्षमता:** ${ctx.totalBeds}\n• **खाली बेड्स (तुरंत उपलब्ध):** **${ctx.vacantBeds} उपलब्ध**\n• **भरे हुए बेड्स:** ${ctx.occupiedBeds}\n`;
if (roomsWithVacancy.length > 0) {
res += `✅ **खाली बेड्स वाले रूम्स की सूची:**\n`;
roomsWithVacancy.forEach(item => {
const labels = item.vacantBeds.map(b => `Bed ${b.bed_label}`).join(', ');
const occupied = item.beds.filter(b => b.status === 'occupied');
const roommates = occupied.length > 0 ? occupied.map(b => `${b.roommate_name} (${b.roommate_degree || 'Student'})`).join(', ') : 'पूरी रूम खाली है';
res += `🏠 **रूम ${item.room.room_no}** (${item.room.sharing_capacity}-शेयरिंग, ${item.room.location}):\n **${item.vacantBeds.length} बेड्स खाली हैं** (${labels})\n वर्तमान रूममेट्स: ${roommates}\n`;
});
} else { res += `⚠️ सभी रूम्स फिलहाल पूरी तरह भर चुके हैं।\n`; }
res += `💡 *किसी विशेष रूम की जानकारी के लिए "Room 345 details" या "Room 45" टाइप करें!*`;
return res;
} else {
let res = `🛏️ **Smart PG - Live Room & Bed Availability Report:**\n• **Total PG Rooms:** ${ctx.totalRooms}\n• **Total Beds Capacity:** ${ctx.totalBeds}\n• **Vacant Beds (Ready to Move):** **${ctx.vacantBeds} Available**\n• **Occupied Beds:** ${ctx.occupiedBeds}\n`;
if (roomsWithVacancy.length > 0) {
res += `✅ **Rooms with Available Beds:**\n`;
roomsWithVacancy.forEach(item => {
const labels = item.vacantBeds.map(b => `Bed ${b.bed_label}`).join(', ');
const occupied = item.beds.filter(b => b.status === 'occupied');
const roommates = occupied.length > 0 ? occupied.map(b => `${b.roommate_name} (${b.roommate_degree || 'Student'})`).join(', ') : 'Fully vacant (Ready to Move)';
res += ` **Room ${item.room.room_no}** (${item.room.sharing_capacity}-Sharing, ${item.room.location}):\n👉 **${item.vacantBeds.length} bed(s) available** (${labels})\n👤 Current Roommates: ${roommates}\n`;
});
} else { res += `️ All rooms are currently 100% occupied.\n`; }
res += `💡 *You can ask for specific room details by saying "Room 345 details" or "Room 45"!*`;
return res;
}
}

// 6. MESS & FOOD MENU
if (msg.includes('khan') || msg.includes('jevan') || msg.includes('jevnaat') || msg.includes('food') || msg.includes('mess') || msg.includes('dinner') || msg.includes('lunch') || msg.includes('breakfast') || msg.includes('snack') || msg.includes('menu') || msg.includes('meal') || msg.includes('nashta')) {
if (lang === 'mr') {
let res = ` **स्मार्ट पीजी मेस आणि जेवणाचे वेळापत्रक (${ctx.currentDay}):**\n`;
if (ctx.todayMenu) {
res += `🍳 **नाश्ता (Breakfast 07:30 AM – 10:00 AM):**\n${ctx.todayMenu.breakfast}\n🍛 **दुपारचे जेवण (Lunch 12:30 PM – 03:00 PM):**\n${ctx.todayMenu.lunch}\n☕ **संध्याकाळचा नाश्ता (Snacks 05:00 PM – 06:30 PM):**\n${ctx.todayMenu.snacks}\n🍽️ **रात्रीचे जेवण (Dinner 08:00 PM – 10:30 PM):**\n${ctx.todayMenu.dinner}\n`;
}
res += `🌱 **अन्न वाया जाण्यापासून बचाव:** आज **${ctx.skipsToday.length} विद्यार्थ्यांनी रात्रीचे जेवण वगळले (skip)** आहे, ज्यामुळे स्वयंपाकघरात अन्न वाया जात नाही!\n💡 *जर आज रात्री बाहेर जेवणार असाल, तर 'Smart Mess & Food' टॅबमधून 'Dinner Skip' बटण दाबा.*`;
return res;
} else if (lang === 'hi') {
let res = ` **स्मार्ट पीजी मेस और खाने का टाइमटेबल (${ctx.currentDay}):**\n`;
if (ctx.todayMenu) {
res += `🍳 **नाश्ता (Breakfast 07:30 AM – 10:00 AM):**\n${ctx.todayMenu.breakfast}\n🍛 **दोपहर का भोजन (Lunch 12:30 PM – 03:00 PM):**\n${ctx.todayMenu.lunch}\n☕ **शाम का नाश्ता (Snacks 05:00 PM – 06:30 PM):**\n${ctx.todayMenu.snacks}\n🍽️ **रात का खाना (Dinner 08:00 PM – 10:30 PM):**\n${ctx.todayMenu.dinner}\n`;
}
res += `🌱 **अन्न बर्बादी रोकथाम:** आज **${ctx.skipsToday.length} छात्रों ने डिनर स्किप किया है**, जिससे किचन में खाना बर्बाद नहीं होता!\n *यदि आप बाहर खाना खा रहे हैं, तो 'Smart Mess & Food' टैब से 'Dinner Skip' विकल्प चुनें।*`;
return res;
} else {
let res = `🍲 **Smart PG Mess & Food Timetable (${ctx.currentDay}):**\n`;
if (ctx.todayMenu) {
res += ` **Breakfast (07:30 AM – 10:00 AM):**\n${ctx.todayMenu.breakfast}\n🍛 **Lunch (12:30 PM – 03:00 PM):**\n${ctx.todayMenu.lunch}\n☕ **Evening Snacks (05:00 PM – 06:30 PM):**\n${ctx.todayMenu.snacks}\n🍽️ **Dinner Feast (08:00 PM – 10:30 PM):**\n${ctx.todayMenu.dinner}\n`;
}
res += ` **Kitchen Waste Prevention:** Today, **${ctx.skipsToday.length} resident(s) opted out of dinner**, preventing excess food waste!\n *If dining out tonight, toggle 'Dinner Skip' under the 'Smart Mess & Food' tab.*`;
return res;
}
}

// 7. COMPLAINTS & MAINTENANCE
if (msg.includes('complaint') || msg.includes('shikayat') || msg.includes('takraar') || msg.includes('problem') || msg.includes('issue') || msg.includes('repair') || msg.includes('maintenance')) {
const total = ctx.complaints.length;
const pending = ctx.complaints.filter(c => c.status === 'pending').length;
const inProgress = ctx.complaints.filter(c => c.status === 'in-progress').length;
const resolved = ctx.complaints.filter(c => c.status === 'resolved').length;
const urgentCount = ctx.complaints.filter(c => c.priority === 'Urgent').length;
const highCount = ctx.complaints.filter(c => c.priority === 'High').length;
const normalCount = ctx.complaints.filter(c => c.priority === 'Normal').length;

if (lang === 'mr') {
let res = ` **पीजी हेल्पडेस्क आणि तक्रारींची थेट स्थिती:**\n•  **एकूण तक्रारी:** ${total}\n• ⏳ **प्रलंबित (Pending):** ${pending} | 🔄 **प्रगतीपथावर:** ${inProgress} | ✅ **सोडवलेल्या:** ${resolved}\n•  **अतितातडीच्या (Urgent):** ${urgentCount} | ⚠️ **महत्त्वाच्या (High):** ${highCount} | 📋 **सामान्य (Normal):** ${normalCount}\n`;
if (total > 0) {
res += `**नुकत्याच नोंदवलेल्या तक्रारी:**\n`;
ctx.complaints.slice(0, 4).forEach((comp, i) => { res += `${i + 1}. [${comp.priority}] **${comp.category}** (Room ${comp.room_no}): "${comp.description}" - *(${comp.status.toUpperCase()})*\n`; });
}
return res;
} else if (lang === 'hi') {
let res = `📋 **पीजी हेल्पडेस्क और शिकायतों की स्थिति:**\n• 📊 **कुल शिकायतें:** ${total}\n•  **लंबित (Pending):** ${pending} | 🔄 **प्रक्रिया में:** ${inProgress} | ✅ **समाधान हुआ:** ${resolved}\n•  **अति-आवश्यक (Urgent):** ${urgentCount} | ⚠️ **हाई (High):** ${highCount} | 📋 **सामान्य (Normal):** ${normalCount}\n`;
if (total > 0) {
res += `**हालिया शिकायतें:**\n`;
ctx.complaints.slice(0, 4).forEach((comp, i) => { res += `${i + 1}. [${comp.priority}] **${comp.category}** (Room ${comp.room_no}): "${comp.description}" - *(${comp.status.toUpperCase()})*\n`; });
}
return res;
} else {
let res = ` **PG Helpdesk & Complaint Status:**\n• 📊 **Total Complaints Registered:** ${total}\n• ⏳ **Pending:** ${pending} | 🔄 **In Progress:** ${inProgress} | ✅ **Resolved:** ${resolved}\n•  **Urgent:** ${urgentCount} | ⚠️ **High Priority:** ${highCount} | 📋 **Normal:** ${normalCount}\n`;
if (total > 0) {
res += `**Recent Complaint Records:**\n`;
ctx.complaints.slice(0, 4).forEach((comp, i) => { res += `${i + 1}. [${comp.priority}] **${comp.category}** (Room ${comp.room_no}): "${comp.description}" - *(${comp.status.toUpperCase()})*\n`; });
}
return res;
}
}

// 8. EMERGENCY CONTACTS
if (msg.includes('emergency') || msg.includes('police') || msg.includes('ambulance') || msg.includes('fire') || msg.includes('contact') || msg.includes('phone') || msg.includes('warden') || msg.includes('madad') || msg.includes('sos') || msg.includes('apatsamay') || msg.includes('suraksha')) {
if (lang === 'mr') {
let res = `🚨 **आपत्कालीन सुरक्षा आणि संपर्क निर्देशिका:**\n• 👮 **पोलीस नियंत्रण कक्ष:** 112 / 100\n•  **वैद्यकीय रुग्णवाहिका (Ambulance):** 102 / 108\n• 🚒 **अग्निशामक दल (Fire Brigade):** 101\n• 👩 **महिला सुरक्षा हेल्पलाइन:** 1091 / 112\n`;
if (ctx.contacts.length > 0) { res += `**पीजीचे जतन केलेले संपर्क:**\n`; ctx.contacts.forEach((c, idx) => { res += `${idx + 1}. 📞 **${c.contact_name}:** ${c.phone_number}\n`; }); }
return res;
} else if (lang === 'hi') {
let res = `🚨 **आपातकालीन सुरक्षा और संपर्क सूची:**\n• 👮 **पुलिस कंट्रोल रूम:** 112 / 100\n• 🚑 **मेडिकल एम्बुलेंस:** 102 / 108\n• 🚒 **दमकल (Fire Brigade):** 101\n•  **महिला सुरक्षा हेल्पलाइन:** 1091 / 112\n`;
if (ctx.contacts.length > 0) { res += `**पीजी के सुरक्षित संपर्क:**\n`; ctx.contacts.forEach((c, idx) => { res += `${idx + 1}. 📞 **${c.contact_name}:** ${c.phone_number}\n`; }); }
return res;
} else {
let res = `🚨 **Emergency Safety & Contact Directory:**\n• 👮 **Police Control Room:** 112 / 100\n• 🚑 **Medical Ambulance:** 102 / 108\n• 🚒 **Fire Emergency:** 101\n• 👩 **Women Safety Helpline:** 1091 / 112\n`;
if (ctx.contacts.length > 0) { res += `**PG Saved Contacts:**\n`; ctx.contacts.forEach((c, idx) => { res += `${idx + 1}.  **${c.contact_name}:** ${c.phone_number}\n`; }); }
return res;
}
}

// 9. CURFEW, TIMINGS & RULES
if (msg.includes('curfew') || msg.includes('gate') || msg.includes('late') || msg.includes('timing') || msg.includes('time') || msg.includes('rule') || msg.includes('wifi') || msg.includes('vel')) {
if (lang === 'mr') return `⏰ **स्मार्ट पीजीचे नियम, वेळ आणि गेट पॉलिसी:**\n• 🚪 **मुख्य गेट बंद होण्याची वेळ:** रात्री **10:30 PM**\n• 📶 **हाय-स्पीड वाय-फाय:** 24/7 मोफत अमर्यादित वापर (500 Mbps)\n• 🏃 **उशिरा येण्याची सूचना:** 10:30 PM नंतर येणार असल्यास 'PG Management' मधील **Late Arrival Alert** फॉर्म भरा जेणेकरून वॉर्डनना आधीच कल्पना राहील.\n• 👥 **पाहुण्यांचे नियम:** बाहेरील पाहुण्यांना संध्याकाळी 08:00 पर्यंत कॉमन लॉबीमध्ये परवानगी आहे.`;
if (lang === 'hi') return `⏰ **स्मार्ट पीजी के नियम, समय और गेट पॉलिसी:**\n• 🚪 **मेन गेट बंद होने का समय:** रात **10:30 PM**\n• 📶 **हाई-स्पीड वाई-फाई:** 24/7 असीमित इंटरनेट (500 Mbps)\n• 🏃 **लेट अराइवल पॉलिसी:** 10:30 PM के बाद आने पर 'PG Management' में **Late Arrival Alert** फॉर्म भरें ताकि वार्डन को पहले से सूचित रहे।\n• 👥 **विजिटर नियम:** बाहरी व्यक्तियों को रात 08:00 बजे तक कॉमन लॉबी में मिलने की अनुमति है।`;
return ` **Smart PG Rules, Timings & Entry Policy:**\n•  **Main Gate Closing Time:** **10:30 PM** every night.\n• 📶 **High-Speed Wi-Fi:** 24/7 unlimited access (500 Mbps across all wings).\n•  **Late Arrival Policy:** If arriving after 10:30 PM, submit the **Late Arrival Alert** form under 'PG Management'.\n• 👥 **Visitor Policy:** Outside visitors are permitted in the common lobby until 08:00 PM.`;
}

// 10. GREETINGS & INTRO
const isGreeting = /\b(hi|hello|hey|namaste|namaskar|pranam|morning|evening|greetings)\b/i.test(msg) || msg.includes('who are you') || msg.includes('what can you do') || msg === 'help' || msg.includes('kon ahes') || msg.includes('kaun ho');

if (isGreeting) {
if (lang === 'mr') return `👋 नमस्कार! मी **पीजी-मित्र (PG-Mitra)**, आपला स्मार्ट पीजी आणि महिला सुरक्षा AI सहाय्यक आहे.\nतुम्ही मला मराठी, हिंदी किंवा इंग्रजीत प्रश्न विचारू शकता:\n• ️ *"कोणत्या रूममध्ये जागा रिकामी आहे?"*\n• 🏠 *"रूम नंबर काय आहेत?"* किंवा *"Room 345 ची माहिती सांगा"*\n•  *"रूममेट्सची नावे काय आहेत?"*\n• 🍲 *"आज जेवणात काय आहे?"*\n•  *"माझे पर्सनल बजेट किती शिल्लक आहे?"*\n•  *"किती तक्रारी प्रलंबित आहेत?"*\n• 🚨 *"इमर्जन्सी पोलीस नंबर काय आहे?"*\nमी आपल्याला कशी मदत करू शकतो?`;
if (lang === 'hi') return `👋 नमस्ते! मैं **पीजी-मित्र (PG-Mitra)**, आपका स्मार्ट पीजी और महिला सुरक्षा AI असिस्टेंट हूँ।\nआप मुझसे हिंदी, मराठी या अंग्रेजी में कोई भी सवाल पूछ सकते हैं:\n• 🛏️ *"कौनसी रूम में जगह खाली है?"*\n• 🏠 *"रूम नंबर क्या हैं?"* या *"Room 345 की जानकारी बताएं"*\n• 👥 *"रूममेट्स के नाम क्या हैं?"*\n• 🍲 *"आज खाने में क्या है?"*\n• 💰 *"पर्सनल बजट कितना बचा है?"*\n• 📋 *"पेंडिंग शिकायतें कितनी हैं?"*\n• 🚨 *"इमरजेंसी कांटेक्ट नंबर्स"*\nबताइए, मैं आपकी क्या सहायता करूँ?`;
return `👋 Hello! I am **PG-Mitra**, your intelligent Smart PG & Safety AI Assistant.\nYou can ask me in English, Hindi, or Marathi:\n• 🛏️ *"Which rooms are currently available?"*\n• 🏠 *"What are the room numbers?"* or *"Tell me about Room 345"*\n• 👥 *"What is the name of the roommates?"*\n• 🍲 *"What is today's mess menu?"*\n• 💰 *"How is my personal budget?"*\n• 📋 *"Show pending complaints"*\n• 🚨 *"Emergency contacts and police helpline"*\nHow can I help you today?`;
}

// Default Fallback
if (lang === 'mr') return ` **पीजी-मित्र AI सहाय्यक:**\nसध्या आपल्या पीजीमध्ये **${ctx.vacantBeds} बेड्स रिकामे आहेत** (${ctx.totalRooms} रूम्समध्ये).\nतुम्ही मला हे प्रश्न विचारू शकता:\n• *"कोणत्या रूममध्ये जागा रिकामी आहे?"*\n• *"Room 345 ची माहिती सांगा"*\n• *"आज जेवणात काय आहे?"*\n• *"तक्रारींची स्थिती दाखवा"*\n• *"पर्सनल बजेट किती आहे?"*\nकृपया आपला प्रश्न टाइप करा!`;
if (lang === 'hi') return `🤖 **पीजी-मित्र AI असिस्टेंट:**\nवर्तमान में हमारे पीजी में **${ctx.vacantBeds} बेड्स खाली हैं** (${ctx.totalRooms} रूम्स में).\nआप मुझसे यह सवाल पूछ सकते हैं:\n• *"कौनसी रूम में जगह खाली है?"*\n• *"Room 345 डिटेल्स"*\n• *"आज खाने में क्या है?"*\n• *"पेंडिंग शिकायतें दिखाओ"*\n• *"पर्सनल बजट कितना है?"*\nकृपया अपना सवाल टाइप करें!`;
return `🤖 **PG-Mitra AI Assistant:**\nCurrently, our PG has **${ctx.vacantBeds} vacant beds** available across ${ctx.totalRooms} rooms (${ctx.totalBeds} total capacity).\nHere are some questions you can ask me:\n• *"Which rooms are available?"*\n• *"Room 345 details"*\n• *"What is the name of the roommates?"*\n• *"What is today's mess menu?"*\n• *"Show pending complaints"*\nPlease feel free to type your question!`;
}

async function aiChatResponse(userMessage, preferredLang = null) {
const rawMsg = (userMessage || "").trim();
if (!rawMsg) return "Please enter a question / कृपया प्रश्न विचारा / कृपया सवाल पूछें!";
return await getDatabaseInfo(rawMsg, preferredLang);
}

// ==================== REST API ENDPOINTS ====================
app.get('/api/rooms', async (req, res) => {
try { res.json({ rooms: await Room.find().sort({ created_at: -1 }), beds: await Bed.find() }); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/rooms', async (req, res) => {
try {
const { room_no, location, sharing, image_url } = req.body;
const newRoom = new Room({ room_no, location: location || 'Main Wing', sharing_capacity: Number(sharing) || 2, image_url: image_url || '' });
await newRoom.save();

const count = Number(sharing) || 2;
const labels = count > 2 ? ['A', 'B', 'C', 'D'].slice(0, count) : (count === 1 ? ['1'] : ['A', 'B']);
for (const label of labels) { await new Bed({ room_no, bed_label: label, status: 'vacant' }).save().catch(() => {}); }

res.json({ success: true, message: `Room ${room_no} with ${count} beds created successfully!` });
} catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/beds/update', async (req, res) => {
try {
const { room_no, bed_label, status, name, degree } = req.body;
const updated = await Bed.findOneAndUpdate({ room_no, bed_label }, { status: status || 'vacant', roommate_name: name || 'Vacant', roommate_degree: degree || '-' }, { returnDocument: 'after', upsert: true });
res.json({ success: true, bed: updated });
} catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/entry-log', async (req, res) => {
try { res.json(await EntryLog.find().sort({ created_at: -1 }).limit(100)); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/entry-log', async (req, res) => {
try { await new EntryLog(req.body).save(); res.json({ success: true, message: 'Entry logged!' }); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/late-arrival', async (req, res) => {
try { res.json(await LateArrival.find().sort({ created_at: -1 })); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/late-arrival', async (req, res) => {
try { await new LateArrival(req.body).save(); res.json({ success: true, message: 'Late arrival notification recorded!' }); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/emergency-contact', async (req, res) => {
try { res.json(await EmergencyContact.find().sort({ created_at: -1 })); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/emergency-contact', async (req, res) => {
try { await new EmergencyContact(req.body).save(); res.json({ success: true, message: 'Contact saved!' }); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/emergency-contact/:id', async (req, res) => {
try { await EmergencyContact.findByIdAndDelete(req.params.id); res.json({ success: true, message: 'Contact removed!' }); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/face-register', async (req, res) => {
try { await new FaceRegistration(req.body).save(); res.json({ success: true, message: 'Face registered successfully!' }); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/face-recognition', async (req, res) => {
try {
const registrations = await FaceRegistration.find();
let bestMatch = null, minDistance = Infinity;

for (const reg of registrations) {
const distance = Math.sqrt(reg.face_descriptor.reduce((sum, val, i) => sum + Math.pow(val - req.body.face_descriptor[i], 2), 0));
if (distance < minDistance) { minDistance = distance; bestMatch = reg; }
}

if (bestMatch && minDistance < 0.6) {
await new EntryLog({ student_name: bestMatch.student_name, room_no: bestMatch.room_no, entry_type: 'IN' }).save();
res.json({ matched: true, student: { student_name: bestMatch.student_name, room_no: bestMatch.room_no } });
} else { res.json({ matched: false }); }
} catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/sos-alerts', async (req, res) => {
try { res.json(await SosAlert.find().sort({ created_at: -1 }).limit(100)); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/shake-sos', async (req, res) => {
try { await new SosAlert({ alert_type: 'shake', ...req.body }).save(); res.json({ success: true, message: 'Shake SOS recorded!' }); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/voice-sos', async (req, res) => {
try { await new SosAlert({ alert_type: 'voice', ...req.body }).save(); res.json({ success: true, message: 'Voice SOS recorded!' }); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/manual-sos', async (req, res) => {
try { await new SosAlert({ alert_type: 'manual', ...req.body }).save(); res.json({ success: true, message: 'Manual SOS alert recorded!' }); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/expenses', async (req, res) => {
try { await new Expense(req.body).save(); res.json({ success: true, message: 'Expense logged!' }); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/expenses', async (req, res) => {
try { res.json(await Expense.find().sort({ created_at: -1 })); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/personal-budget', async (req, res) => {
try {
await PersonalBudget.deleteMany({});
await new PersonalBudget(req.body).save();
res.json({ success: true, message: 'Personal budget updated!' });
} catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/personal-expense', async (req, res) => {
try { await new PersonalExpense(req.body).save(); res.json({ success: true, message: 'Personal expense logged!' }); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/personal-expenses', async (req, res) => {
try {
const expenses = await PersonalExpense.find().sort({ created_at: -1 });
const budget = await PersonalBudget.findOne().sort({ created_at: -1 });
res.json({ expenses, budget: budget || null });
} catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/complaints', async (req, res) => {
try { res.json(await Complaint.find().sort({ created_at: -1 })); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/complaints', async (req, res) => {
try {
const { student_name, room_no, description, category, priority } = req.body;
const classified = classifyComplaint(description);

const newComplaint = new Complaint({
student_name: student_name || 'Resident', room_no: room_no || 'Common', description,
category: classified.category !== 'Maintenance' ? classified.category : (category || 'Maintenance'),
priority: classified.priority !== 'Normal' ? classified.priority : (priority || 'Normal'),
ai_reason: classified.reason
});

await newComplaint.save();
res.json({ success: true, message: `Complaint registered under ${newComplaint.priority} Priority (${newComplaint.category})!`, complaint: newComplaint });
} catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/complaints/:id', async (req, res) => {
try {
await Complaint.findByIdAndUpdate(req.params.id, { status: req.body.status, resolution_note: req.body.resolution_note || '' }, { returnDocument: 'after' });
res.json({ success: true, message: 'Complaint updated!' });
} catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/complaints/:id', async (req, res) => {
try { await Complaint.findByIdAndDelete(req.params.id); res.json({ success: true, message: 'Complaint deleted!' }); }
catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ai-analyze-complaint', async (req, res) => {
try {
const { description } = req.body;
const classified = classifyComplaint(description);
res.json({ success: true, ai: { category: classified.category, priority: classified.priority, reason: classified.reason, estimated_time: classified.estTime } });
} catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/ai-analyze-expense', async (req, res) => {
try {
const { title, amount } = req.body;
const t = (title || "").toLowerCase();
let category = "General", tip = "Divide fairly among roommates";

if (t.includes("grocer") || t.includes("milk") || t.includes("vegetable") || t.includes("snack") || t.includes("food") || t.includes("chai")) { category = "Groceries & Food"; tip = "Track weekly food bills to stay under monthly budget"; }
else if (t.includes("rent") || t.includes("deposit")) { category = "Room Rent"; tip = "Ensure all members pay before the 5th of each month"; }
else if (t.includes("electric") || t.includes("bill") || t.includes("power") || t.includes("meter")) { category = "Electricity Utility"; tip = "Turn off AC and geysers when leaving to reduce unit bills"; }
else if (t.includes("clean") || t.includes("maid") || t.includes("detergent") || t.includes("wiper")) { category = "Cleaning & Supplies"; tip = "Buy bulk supplies once a month for maximum savings"; }

res.json({ success: true, ai: { category, tip } });
} catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/ai-analyze-entries', async (req, res) => {
try {
const { logs } = req.body;
const inCount = logs?.filter(l => l.entry_type === 'IN').length || 0;
const outCount = logs?.filter(l => l.entry_type === 'OUT').length || 0;

res.json({ success: true, ai: { pattern: `${inCount} Entries & ${outCount} Exits recorded today`, peak_time: "08:30 AM - 09:30 AM & 07:00 PM - 08:30 PM", insight: inCount > outCount ? "Most residents have safely returned to PG premises." : "Several residents are currently at college/office." } });
} catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/mess-menu', async (req, res) => {
try {
const menu = await MessMenu.find();
const currentDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
const today = new Date().toISOString().split('T')[0];
const skipsToday = await MealSkip.find({ date: today });
const feedbacks = await MessFeedback.find({ date: today }).sort({ created_at: -1 }).limit(10);

const hour = new Date().getHours();
const minute = new Date().getMinutes();
const timeDecimal = hour + minute / 60;
let currentServing = "Closed", nextServing = "Breakfast (07:30 AM)";

if (timeDecimal >= 7.5 && timeDecimal < 10.0) { currentServing = "Breakfast"; nextServing = "Lunch (12:30 PM)"; }
else if (timeDecimal >= 10.0 && timeDecimal < 12.5) { currentServing = "Kitchen Prep (Lunch)"; nextServing = "Lunch (12:30 PM)"; }
else if (timeDecimal >= 12.5 && timeDecimal < 15.0) { currentServing = "Lunch"; nextServing = "Snacks (05:00 PM)"; }
else if (timeDecimal >= 15.0 && timeDecimal < 17.0) { currentServing = "Kitchen Prep (Snacks)"; nextServing = "Snacks (05:00 PM)"; }
else if (timeDecimal >= 17.0 && timeDecimal < 18.5) { currentServing = "Evening Snacks"; nextServing = "Dinner (08:00 PM)"; }
else if (timeDecimal >= 18.5 && timeDecimal < 20.0) { currentServing = "Kitchen Prep (Dinner)"; nextServing = "Dinner (08:00 PM)"; }
else if (timeDecimal >= 20.0 && timeDecimal < 22.5) { currentServing = "Dinner Feast"; nextServing = "Breakfast Tomorrow (07:30 AM)"; }

res.json({ menu, currentDay, skipsToday, feedbacks, currentServing, nextServing });
} catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/mess-menu/update', async (req, res) => {
try {
const { day, breakfast, lunch, snacks, dinner } = req.body;
const updated = await MessMenu.findOneAndUpdate({ day }, { breakfast, lunch, snacks, dinner }, { returnDocument: 'after', upsert: true });
res.json({ success: true, message: `Menu for ${day} updated successfully!`, menu: updated });
} catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/mess-skip', async (req, res) => {
try {
const { student_name, room_no, meal_type } = req.body;
const today = new Date().toISOString().split('T')[0];
const mType = (meal_type || 'dinner').toLowerCase();

const existing = await MealSkip.findOne({ student_name, date: today, meal_type: mType });

if (existing) {
await MealSkip.findByIdAndDelete(existing._id);
res.json({ success: true, opted_out: false, message: `Welcome back! You are marked as EATING ${mType.toUpperCase()} today.` });
} else {
await new MealSkip({ student_name, room_no, meal_type: mType, date: today }).save();
res.json({ success: true, opted_out: true, message: `Noted! You are marked as SKIPPING ${mType.toUpperCase()} today. Kitchen prep updated!` });
}
} catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/mess-feedback', async (req, res) => {
try {
const { student_name, room_no, rating, meal_type, comment } = req.body;
const newFeedback = new MessFeedback({ student_name: student_name || 'Resident', room_no: room_no || '-', rating: Number(rating) || 5, meal_type: meal_type || 'Dinner', comment: comment || 'Food tasted good!' });
await newFeedback.save();
res.json({ success: true, message: 'Thank you! Your food feedback was submitted to the kitchen manager.', feedback: newFeedback });
} catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ai-chat', async (req, res) => {
try {
const { message, lang } = req.body;
if (!message) return res.status(400).json({ success: false, error: "Message is required" });

const aiReply = await aiChatResponse(message, lang);
res.json({ success: true, reply: aiReply });
} catch (err) {
console.error("❌ AI Chat Endpoint Error:", err.message);
res.status(500).json({ success: false, error: err.message });
}
});

app.get('/api/test-ai', async (req, res) => {
try {
const mrReply = await aiChatResponse("konati room rikami ahe", "mr");
const hiReply = await aiChatResponse("konasi room khali hai", "hi");
const enReply = await aiChatResponse("which rooms are available", "en");
return res.json({ status: "SUCCESS", message: "Trilingual PG-Mitra AI Engine is Active!", marathiSample: mrReply, hindiSample: hiReply, englishSample: enReply });
} catch (error) {
return res.status(500).json({ status: "ERROR", error: error.message });
}
});

app.use((req, res) => { res.status(404).json({ error: 'Route not found' }); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log('===========================================');
console.log(`✅ SERVER RUNNING on http://localhost:${PORT}`);
console.log(`✅ Database: pg_safety_db (MongoDB Atlas)`);
console.log(`🤖 AI System: TRILINGUAL PG-MITRA (Hindi 🇮 + Marathi 🇮 + English )`);
console.log(`🍲 Smart Working Mess & Food System: ACTIVE`);
console.log(` AI Complaints Priority Engine: AUTO-CLASSIFYING (Urgent/High/Normal)`);
console.log('===========================================');
});
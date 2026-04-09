const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const bcrypt     = require('bcrypt');
const nodemailer = require('nodemailer');
const multer     = require('multer');
const fs         = require('fs');

require('dotenv').config();

const app      = express();
const adminApp = express();

// ================================================================
//  JSON DATABASE HELPERS
// ================================================================
const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

function dbPath(name) { return path.join(DB_DIR, `${name}.json`); }

function readDb(name) {
    const file = dbPath(name);
    if (!fs.existsSync(file)) return [];
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { return []; }
}

function writeDb(name, data) {
    fs.writeFileSync(dbPath(name), JSON.stringify(data, null, 2));
}

function nextId(collection) {
    if (!collection.length) return 1;
    return Math.max(...collection.map(r => r.id || 0)) + 1;
}

function now() { return new Date().toISOString(); }

// ================================================================
//  SEED DEFAULT DATA (packages & menu) IF EMPTY
// ================================================================
function seedDefaults() {
    if (!readDb('packages').length) {
        writeDb('packages', [
            { id: 1, name: 'Basic Package',     price: 20250,  description: 'Perfect for small gatherings and family events', guest_count: 30,  created_at: now() },
            { id: 2, name: 'All-In Package',    price: 24000,  description: 'Ideal for Baptisms, Weddings, Birthdays, Office & Family Events', guest_count: 30,  created_at: now() },
            { id: 3, name: 'Birthday Package',  price: 60000,  description: 'Complete birthday celebration package', guest_count: 100, created_at: now() },
            { id: 4, name: 'Corporate Package', price: 55000,  description: 'Perfect for weddings, birthdays, or corporate events', guest_count: 120, created_at: now() },
            { id: 5, name: 'Debut Package',     price: 30000,  description: 'Complete debut celebration package', guest_count: 50,  created_at: now() },
        ]);
    }
    if (!readDb('menu_items').length) {
        writeDb('menu_items', [
            { id: 1, courseName: 'Beef Caldereta',  price: 850,  category: 'Main',    description: 'Rich tomato-based beef stew', created_at: now() },
            { id: 2, courseName: 'Chicken Inasal',  price: 750,  category: 'Main',    description: 'Grilled marinated chicken',   created_at: now() },
            { id: 3, courseName: 'Pancit Canton',   price: 550,  category: 'Pasta',   description: 'Classic Filipino noodles',    created_at: now() },
            { id: 4, courseName: 'Leche Flan',      price: 350,  category: 'Dessert', description: 'Creamy caramel custard',      created_at: now() },
            { id: 5, courseName: 'Steamed Rice',    price: 150,  category: 'Rice',    description: 'Per tray of steamed rice',    created_at: now() },
        ]);
    }
    if (!readDb('admins').length) {
        bcrypt.hash('admin123', 10).then(hash => {
            writeDb('admins', [{ id: 1, email: 'admin@admin.com', password: hash, created_at: now() }]);
        });
    }
}
seedDefaults();

// ================================================================
//  NODEMAILER
// ================================================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// ================================================================
//  MIDDLEWARE
// ================================================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

adminApp.use(cors());
adminApp.use(express.json());
adminApp.use('/img',    express.static(path.join(__dirname, 'public', 'assets', 'img')));
adminApp.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ================================================================
//  SIGNUP OTP
// ================================================================
const signupOtpStore = new Map();

app.post('/send-signup-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed))
        return res.status(400).json({ message: 'Invalid email format.' });

    const users = readDb('users');
    if (users.find(u => u.email === trimmed))
        return res.status(400).json({ message: 'This email is already registered. Please log in instead.' });

    const otp     = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000;
    signupOtpStore.set(trimmed, { otp, expires });
    setTimeout(() => signupOtpStore.delete(trimmed), 5 * 60 * 1000);

    try {
        await transporter.sendMail({
            from:    `"De Las Armas Catering" <${process.env.EMAIL_USER}>`,
            to:      trimmed,
            subject: '🔐 Your Sign Up Code — De Las Armas',
            html: `
            <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#f5f5eb;border-radius:10px;overflow:hidden;">
                <div style="background:#19276F;padding:28px 40px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:2px;">DE LAS ARMAS</h1>
                    <p style="color:rgba(255,255,255,0.65);margin:4px 0 0;font-size:12px;font-style:italic;">Catering &amp; Event Services</p>
                </div>
                <div style="padding:36px 40px;background:#fff;text-align:center;">
                    <h2 style="color:#19276F;font-size:18px;margin-bottom:6px;">Email Verification Code</h2>
                    <p style="color:#555;font-size:14px;margin-bottom:28px;">
                        Use the code below to complete your sign up.<br>It expires in <strong>5 minutes</strong>.
                    </p>
                    <div style="background:#f0f3ff;border:2px solid #19276F;border-radius:12px;display:inline-block;padding:18px 48px;margin-bottom:24px;">
                        <span style="font-size:38px;font-weight:bold;letter-spacing:10px;color:#19276F;">${otp}</span>
                    </div>
                    <p style="color:#999;font-size:12px;margin-top:8px;">If you didn't request this, you can safely ignore this email.</p>
                </div>
                <div style="background:#19276F;padding:16px 40px;text-align:center;">
                    <p style="color:rgba(255,255,255,0.55);font-size:11px;margin:0;">© ${new Date().getFullYear()} De Las Armas Catering &amp; Event Services.</p>
                </div>
            </div>`
        });
        res.status(200).json({ message: 'Code sent! Check your email.' });
    } catch (mailErr) {
        signupOtpStore.delete(trimmed);
        res.status(500).json({ message: 'Failed to send verification email.' });
    }
});

app.post('/verify-signup-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and code are required.' });
    const trimmed = email.trim().toLowerCase();
    const stored  = signupOtpStore.get(trimmed);
    if (!stored)           return res.status(400).json({ message: 'No code was sent to this email.' });
    if (Date.now() > stored.expires) { signupOtpStore.delete(trimmed); return res.status(400).json({ message: 'This code has expired.' }); }
    if (stored.otp !== otp.toString().trim()) return res.status(400).json({ message: 'Incorrect code. Please try again.' });
    signupOtpStore.delete(trimmed);
    res.status(200).json({ message: 'OTP verified.' });
});

// ================================================================
//  AUTH ROUTES
// ================================================================
app.post('/signup', async (req, res) => {
    const { fName, email, password } = req.body;
    if (!fName || !email || !password) return res.status(400).json({ message: 'All fields are required' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
    const users = readDb('users');
    if (users.find(u => u.email === email)) return res.status(400).json({ message: 'Email already registered' });
    try {
        const hash = await bcrypt.hash(password, 10);
        const newUser = { id: nextId(users), fName, email, password: hash, profilePic: null, otp: null, otp_created_at: null, email_verified: 1, email_domain: email.split('@')[1] || 'unknown', verification_date: now(), created_at: now() };
        users.push(newUser);
        writeDb('users', users);

        transporter.sendMail({
            from:    `"De Las Armas Catering" <${process.env.EMAIL_USER}>`,
            to:      email,
            subject: '🎉 Welcome to De Las Armas Catering!',
            html:    `<p>Welcome, ${fName}! Your account is now active.</p>`
        }).catch(e => console.error('[welcome-email] failed:', e.message));

        res.status(201).json({ message: 'Account created successfully!', userId: newUser.id });
    } catch { res.status(500).json({ message: 'Error processing password' }); }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const users = readDb('users');
    const user  = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ message: 'User not found' });
    try {
        if (await bcrypt.compare(password, user.password)) {
            res.json({ message: 'Login successful', user: { id: user.id, username: user.fName, fName: user.fName, email: user.email, profilePic: user.profilePic } });
        } else {
            res.status(401).json({ message: 'Invalid password' });
        }
    } catch { res.status(500).json({ message: 'Error verifying password' }); }
});

app.post('/send-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const users = readDb('users');
    const idx   = users.findIndex(u => u.email === email);
    if (idx === -1) return res.status(404).json({ message: 'Email not found' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const exp = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    users[idx].otp = otp;
    users[idx].otp_created_at = exp;
    writeDb('users', users);
    try {
        await transporter.sendMail({ from: `"De Las Armas" <${process.env.EMAIL_USER}>`, to: email, subject: 'Your OTP Code', html: `<p>Your OTP code is: <b>${otp}</b></p>` });
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch { res.status(500).json({ message: 'Failed to send OTP email' }); }
});

app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });
    const users = readDb('users');
    const user  = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ message: 'Email not found' });
    if (!user.otp) return res.status(400).json({ message: 'No OTP requested' });
    if (new Date() > new Date(user.otp_created_at)) return res.status(400).json({ message: 'OTP expired' });
    if (user.otp.toString() === otp.toString()) return res.status(200).json({ message: 'OTP verified' });
    return res.status(400).json({ message: 'Incorrect OTP' });
});

app.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ message: 'Email and new password are required' });
    const users = readDb('users');
    const idx   = users.findIndex(u => u.email === email);
    if (idx === -1) return res.status(404).json({ message: 'User not found' });
    try {
        users[idx].password       = await bcrypt.hash(newPassword, 10);
        users[idx].otp            = null;
        users[idx].otp_created_at = null;
        writeDb('users', users);
        res.json({ message: 'Password updated successfully!' });
    } catch { res.status(500).json({ message: 'Error encrypting password' }); }
});

// ================================================================
//  SALES / BOOKINGS
// ================================================================
app.post('/add-sale', (req, res) => {
    const { userId, amount, totalAmount, address, eventDate, eventTime, contact, guestCount, customerDetails, message } = req.body;
    const safeDate = typeof eventDate === 'string' ? eventDate.substring(0, 10) : eventDate;

    const sales = readDb('sales');

    // Duplicate check: same user + same date
    if (sales.find(s => s.user_id == userId && s.event_date === safeDate && s.status === 'Paid'))
        return res.status(400).json({ message: 'You already have a booking for this date.', duplicate: true });

    // Fully booked check: max 2 bookings per date
    if (sales.filter(s => s.event_date === safeDate && s.status === 'Paid').length >= 2)
        return res.status(400).json({ message: 'This date is already fully booked. Please choose another date.', fullyBooked: true });

    const finalGuests    = (guestCount && parseInt(guestCount) > 1) ? parseInt(guestCount) : 50;
    const fullOrderValue = parseFloat(totalAmount) || (parseFloat(amount) * 2) || 0;
    const reservationFee = parseFloat(amount) || (fullOrderValue / 2) || 0;

    const newSale = { id: nextId(sales), user_id: userId, amount: reservationFee, total_amount: fullOrderValue, event_address: address, event_date: safeDate, contact_number: contact, status: 'Paid', created_at: now() };
    sales.push(newSale);
    writeDb('sales', sales);

    // Create reservation
    const reservations = readDb('reservations');
    const newRes = { id: nextId(reservations), user_id: userId, reservation_date: safeDate, event_time: eventTime || null, status: 'confirmed', guest_count: finalGuests, special_requests: message || '', created_at: now() };
    reservations.push(newRes);
    writeDb('reservations', reservations);

    res.status(200).json({ message: 'Booking confirmed!', saleId: newSale.id, reservationId: newRes.id });
});

// ================================================================
//  ORDERS
// ================================================================
app.post('/api/orders', (req, res) => {
    const { userId, customerDetails, eventDate, eventTime, eventStartTime, eventEndTime, guestCount, package: selectedPackage, addons, menuItems, totalAmount, message } = req.body;
    if (!userId || userId === 'null') return res.status(401).json({ message: 'You must be logged in.' });

    const safeDate = eventDate ? eventDate.substring(0, 10) : null;
    function toTimeStr(val) { if (!val) return null; const c = val.trim().slice(0,5); return /^\d{2}:\d{2}$/.test(c) ? c + ':00' : null; }
    const startTime = toTimeStr(eventStartTime);
    const endTime   = toTimeStr(eventEndTime);
    const snapshot  = JSON.stringify({ selectedPackage: selectedPackage || null, addons: addons || [], menuItems: menuItems || [] });

    const orders = readDb('orders');
    const existing = orders.findIndex(o => o.user_id == userId && o.event_date === safeDate);

    if (existing !== -1) {
        // Update
        orders[existing] = { ...orders[existing], customer_name: customerDetails?.fullName || null, email: customerDetails?.email || null, contact_number: customerDetails?.contact || null, event_address: customerDetails?.address || null, event_time: eventTime || null, event_start_time: startTime, event_end_time: endTime, guest_count: guestCount || 0, total_amount: totalAmount || 0, message_concern: message || '', snapshot };
        writeDb('orders', orders);
        return res.status(200).json({ message: 'Order Saved', orderId: orders[existing].id });
    }

    const newOrder = { id: nextId(orders), user_id: userId, customer_name: customerDetails?.fullName || null, email: customerDetails?.email || null, contact_number: customerDetails?.contact || null, event_address: customerDetails?.address || null, event_date: safeDate, event_time: eventTime || null, event_start_time: startTime, event_end_time: endTime, guest_count: guestCount || 0, total_amount: totalAmount || 0, message_concern: message || '', snapshot, created_at: now() };
    orders.push(newOrder);
    writeDb('orders', orders);
    res.status(200).json({ message: 'Order Saved', orderId: newOrder.id });
});

function formatTo12Hour(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour   = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2,'0')}:${minutes} ${period}`;
}

app.get('/api/orders', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required' });
    const orders = readDb('orders');
    const users  = readDb('users');
    const result = orders
        .filter(o => o.event_date === date)
        .map(o => {
            const u = users.find(u => u.id == o.user_id) || {};
            let displayTime = o.event_time;
            if (o.event_start_time && o.event_end_time && !displayTime)
                displayTime = `${formatTo12Hour(o.event_start_time)} – ${formatTo12Hour(o.event_end_time)}`;
            return { user_id: o.user_id, customer_name: o.customer_name || u.fName || 'Guest', email: o.email || u.email || '', event_date: o.event_date, event_start_time: o.event_start_time, event_end_time: o.event_end_time, event_time: displayTime, total_amount: o.total_amount || 0, guest_count: o.guest_count || 0, message_concern: o.message_concern || '' };
        });
    res.json(result);
});

app.get('/api/user-bookings', (req, res) => {
    const { userId, date } = req.query;
    if (!userId || !date) return res.status(400).json({ message: 'userId and date are required' });
    const sales = readDb('sales');
    res.json({ hasBooking: !!sales.find(s => s.user_id == userId && s.event_date === date && s.status === 'Paid') });
});

// ================================================================
//  CALENDAR
// ================================================================
app.get('/api/debug-dates', (req, res) => {
    const sales = readDb('sales').slice(-10).reverse();
    res.json({ rows: sales });
});

app.get('/api/calendar-events', (req, res) => {
    const sales = readDb('sales').filter(s => s.status === 'Paid');
    const map   = {};
    sales.forEach(s => { map[s.event_date] = (map[s.event_date] || 0) + 1; });
    res.json(Object.entries(map).map(([order_date, total_orders]) => ({ order_date, total_orders })).sort((a,b) => a.order_date.localeCompare(b.order_date)));
});

// ================================================================
//  ADMIN CALENDAR
// ================================================================
function adminCalendarHandler(req, res) {
    const { year, month } = req.query;
    if (!year || !month) return res.status(400).json({ message: 'Year and month required' });
    const prefix = `${year}-${String(month).padStart(2,'0')}`;

    const sales  = readDb('sales').filter(s => s.event_date && s.event_date.startsWith(prefix));
    const users  = readDb('users');
    const orders = readDb('orders').filter(o => o.event_date && o.event_date.startsWith(prefix));

    const orderTimeMap = {};
    orders.forEach(o => {
        const key = `${o.user_id}_${o.event_date}`;
        if (!orderTimeMap[key]) orderTimeMap[key] = { event_time: o.event_time, event_start_time: o.event_start_time, event_end_time: o.event_end_time };
    });

    const merged = sales.map(s => {
        const u   = users.find(u => u.id == s.user_id) || {};
        const key = `${s.user_id}_${s.event_date}`;
        const t   = orderTimeMap[key] || {};
        return { date: s.event_date, id: s.id, amount: s.amount, status: s.status, fName: u.fName || '', email: u.email || '', contact_number: s.contact_number, event_address: s.event_address, event_time: t.event_time || null, event_start_time: t.event_start_time || null, event_end_time: t.event_end_time || null };
    });
    res.json(merged);
}
app.get('/api/admin-calendar',      adminCalendarHandler);
adminApp.get('/api/admin-calendar', adminCalendarHandler);

// ================================================================
//  REVIEWS
// ================================================================
app.post('/api/reviews', (req, res) => {
    const { rating, comment, user_id } = req.body;
    if (!user_id) return res.status(400).json({ message: 'No user ID found. Please log in.' });
    const reviews = readDb('reviews');
    reviews.push({ id: nextId(reviews), user_id, rating: rating || 5, comment, created_at: now() });
    writeDb('reviews', reviews);
    res.status(200).json({ message: 'Review posted successfully!' });
});

app.get('/api/reviews', (req, res) => {
    const reviews = readDb('reviews').slice(-10).reverse();
    const users   = readDb('users');
    const result  = reviews.map(r => ({ ...r, username: users.find(u => u.id == r.user_id)?.fName || 'Anonymous' }));
    res.json(result);
});

// ================================================================
//  USER PROFILE
// ================================================================
app.put('/api/user/update-name', (req, res) => {
    const { id, fName } = req.body;
    if (!fName?.trim()) return res.status(400).json({ message: 'Name cannot be empty.' });
    const users = readDb('users');
    const idx   = users.findIndex(u => u.id == id);
    if (idx === -1) return res.status(404).json({ message: 'User not found' });
    users[idx].fName = fName.trim();
    writeDb('users', users);
    res.json({ message: 'Name updated!' });
});

app.put('/api/user/update-profile-pic', (req, res) => {
    const { id, profilePic } = req.body;
    const users = readDb('users');
    const idx   = users.findIndex(u => u.id == id);
    if (idx === -1) return res.status(404).json({ message: 'User not found' });
    users[idx].profilePic = profilePic;
    writeDb('users', users);
    res.json({ message: 'Profile picture updated' });
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + '-' + Math.round(Math.random()*1e9) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5*1024*1024 }, fileFilter: (req, file, cb) => { const ok = /jpeg|jpg|png|gif/; (ok.test(path.extname(file.originalname).toLowerCase()) && ok.test(file.mimetype)) ? cb(null,true) : cb(new Error('Only images allowed')); }});

app.post('/api/user/upload-profile-pic', upload.single('profilePic'), (req, res) => {
    if (!req.file)       return res.status(400).json({ message: 'No file uploaded' });
    if (!req.body.userId) return res.status(400).json({ message: 'User ID is required' });
    const img   = `/uploads/${req.file.filename}`;
    const users = readDb('users');
    const idx   = users.findIndex(u => u.id == req.body.userId);
    if (idx === -1) return res.status(404).json({ message: 'User not found' });
    users[idx].profilePic = img;
    writeDb('users', users);
    res.json({ message: 'Profile picture updated!', image: img });
});

app.post('/api/user/change-password', async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId||!currentPassword||!newPassword) return res.status(400).json({ message: 'All fields are required' });
    if (newPassword.length < 8) return res.status(400).json({ message: 'Min 8 characters' });
    const users = readDb('users');
    const idx   = users.findIndex(u => u.id == userId);
    if (idx === -1) return res.status(404).json({ message: 'User not found' });
    try {
        if (!await bcrypt.compare(currentPassword, users[idx].password)) return res.status(401).json({ message: 'Current password is incorrect' });
        users[idx].password = await bcrypt.hash(newPassword, 10);
        writeDb('users', users);
        res.json({ message: 'Password changed!' });
    } catch { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/user/:id', (req, res) => {
    const user = readDb('users').find(u => u.id == req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user.id, fName: user.fName, email: user.email, profilePic: user.profilePic });
});

// ================================================================
//  CART
// ================================================================
app.get('/api/cart', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: 'User ID required' });

    const carts    = readDb('carts').filter(c => c.user_id == userId);
    const packages = readDb('packages');
    const addons   = readDb('addons');

    const pkgItems = carts.filter(c => c.product_type === 'package').map(c => {
        const p = packages.find(p => p.id == c.product_id) || {};
        return { cartId: c.id, product_id: c.product_id, quantity: c.quantity, product_type: c.product_type, guestCount: c.guestCount, variantName: c.variantName, itemPrice: c.price, name: p.name || c.variantName, basePrice: p.price || c.price, description: p.description, price: parseFloat(c.price) || parseFloat(p.price) || 0 };
    });

    const addonItems = carts.filter(c => c.product_type === 'addon').map(c => {
        const a = addons.find(a => a.id == c.product_id) || {};
        return { cartId: c.id, product_id: c.product_id, quantity: c.quantity, product_type: c.product_type, name: a.name || c.variantName, price: parseFloat(c.price) || parseFloat(a.price) || 0, description: a.description };
    });

    let total = 0;
    pkgItems.forEach(i   => { total += i.price * i.quantity; });
    addonItems.forEach(i => { total += i.price * i.quantity; });

    res.json({ package: pkgItems[0] || null, addons: addonItems, total });
});

app.post('/api/cart/add', (req, res) => {
    const { userId, productId, productType, quantity = 1, guestCount, variantName, price } = req.body;
    if (!userId || !productId || !productType) return res.status(400).json({ message: 'Missing fields' });
    const parsedId = parseInt(productId);
    if (isNaN(parsedId) || parsedId <= 0) return res.status(400).json({ message: 'Invalid product ID' });

    const carts   = readDb('carts');
    let   existing;

    if (productType === 'package') {
        existing = carts.findIndex(c => c.user_id == userId && c.product_type === 'package');
    } else {
        existing = carts.findIndex(c => c.user_id == userId && c.product_id == parsedId && c.product_type === productType);
    }

    if (existing !== -1) {
        if (productType === 'package') {
            carts[existing] = { ...carts[existing], product_id: parsedId, quantity, guestCount, variantName, price };
        } else {
            carts[existing].quantity += quantity;
        }
    } else {
        carts.push({ id: nextId(carts), user_id: userId, product_id: parsedId, product_type: productType, quantity, guestCount, variantName, price });
    }
    writeDb('carts', carts);
    res.json({ message: existing !== -1 ? 'Cart updated' : 'Added to cart' });
});

app.put('/api/cart/update', (req, res) => {
    const { cartId, quantity } = req.body;
    if (!cartId || quantity === undefined) return res.status(400).json({ message: 'Missing fields' });
    let carts = readDb('carts');
    if (quantity <= 0) { carts = carts.filter(c => c.id != cartId); }
    else { const idx = carts.findIndex(c => c.id == cartId); if (idx !== -1) carts[idx].quantity = quantity; }
    writeDb('carts', carts);
    res.json({ message: 'Done' });
});

app.delete('/api/cart/remove', (req, res) => {
    const { cartId } = req.body;
    if (!cartId) return res.status(400).json({ message: 'Cart ID required' });
    writeDb('carts', readDb('carts').filter(c => c.id != cartId));
    res.json({ message: 'Removed' });
});

app.post('/api/cart/clear', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID required' });
    writeDb('carts', readDb('carts').filter(c => c.user_id != userId));
    res.json({ message: 'Cart cleared' });
});

app.post('/api/cart/sync', (req, res) => {
    const { userId, localCart } = req.body;
    if (!userId || !localCart) return res.status(400).json({ message: 'Missing fields' });
    let carts = readDb('carts').filter(c => c.user_id != userId);
    if (localCart.package) carts.push({ id: nextId(carts), user_id: userId, product_id: localCart.package.id, product_type: 'package', quantity: localCart.package.qty, guestCount: null, variantName: null, price: localCart.package.price });
    if (localCart.addons?.length) localCart.addons.forEach(a => carts.push({ id: nextId(carts), user_id: userId, product_id: a.id, product_type: 'addon', quantity: a.qty, guestCount: null, variantName: null, price: a.price }));
    writeDb('carts', carts);
    res.json({ message: 'Synced' });
});

// ================================================================
//  ADMIN ROUTES
// ================================================================
adminApp.use(express.static(path.join(__dirname, 'public', 'admin')));
adminApp.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'adminlogin.html')));

adminApp.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin@admin.com' && password === 'admin123')
        return res.status(200).json({ message: 'Welcome to the Gateway, Admin.' });
    const admins = readDb('admins');
    const admin  = admins.find(a => a.email === email);
    if (!admin) return res.status(401).json({ message: 'Invalid Admin Credentials' });
    if (!await bcrypt.compare(password, admin.password)) return res.status(401).json({ message: 'Invalid Admin Credentials' });
    res.status(200).json({ message: 'Welcome to the Gateway, Admin.' });
});

adminApp.get('/dashboard', (req, res) => {
    const sales   = readDb('sales').filter(s => s.status === 'Paid');
    const now_    = Date.now();
    const week    = 7 * 24 * 60 * 60 * 1000;
    const thisWeek = sales.filter(s => now_ - new Date(s.created_at).getTime() <= week).reduce((sum, s) => sum + (parseFloat(s.total_amount) || parseFloat(s.amount) * 2 || 0), 0);
    const lastWeek = sales.filter(s => { const d = now_ - new Date(s.created_at).getTime(); return d > week && d <= week * 2; }).reduce((sum, s) => sum + (parseFloat(s.total_amount) || parseFloat(s.amount) * 2 || 0), 0);
    const totalRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || parseFloat(s.amount) * 2 || 0), 0);
    let percentage = 0;
    if (lastWeek === 0 && thisWeek > 0) percentage = 100;
    else if (lastWeek > 0) percentage = Math.round(((thisWeek - lastWeek) / lastWeek * 100) * 10) / 10;
    res.json({ thisWeek, lastWeek, percentage, totalRevenue, totalSales: sales.length });
});

adminApp.get('/latest-customers', (req, res) => {
    const ord   = req.query.order === 'oldest' ? 1 : -1;
    const users = readDb('users').sort((a,b) => ord * (a.id - b.id)).slice(0,5);
    res.json(users.map(u => ({ id: u.id, fName: u.fName, verification_date: u.verification_date })));
});

adminApp.get('/all-customers', (req, res) => {
    res.json(readDb('users').sort((a,b) => new Date(b.verification_date) - new Date(a.verification_date)).map(u => ({ id: u.id, fName: u.fName, verification_date: u.verification_date })));
});

adminApp.get('/growth-stats', (req, res) => {
    const filter = req.query.filter || 'monthly';
    const sales  = readDb('sales').filter(s => s.status === 'Paid');
    const map    = {};

    sales.forEach(s => {
        const d = new Date(s.created_at);
        let label;
        if (filter === 'yearly')       label = String(d.getFullYear());
        else if (filter === 'weekly')  label = `Week ${getWeekNumber(d)}`;
        else                           label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!map[label]) map[label] = { label, total: 0, bookings: 0, sort: d };
        map[label].total    += parseFloat(s.total_amount) || parseFloat(s.amount) * 2 || 0;
        map[label].bookings += 1;
    });
    res.json(Object.values(map).sort((a,b) => a.sort - b.sort));
});

function getWeekNumber(d) {
    const date = new Date(d);
    date.setHours(0,0,0,0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

adminApp.get('/top-stats', (req, res) => {
    const sales = readDb('sales').filter(s => s.status === 'Paid');
    const monthMap = {};
    const yearMap  = {};
    sales.forEach(s => {
        const d = new Date(s.created_at);
        const mk = `${d.getFullYear()}-${d.getMonth()}`;
        const yk = String(d.getFullYear());
        const val = parseFloat(s.total_amount) || parseFloat(s.amount) || 0;
        if (!monthMap[mk]) monthMap[mk] = { topMonth: d.toLocaleDateString('en-US',{month:'long'}), topMonthYear: d.getFullYear(), totalRevenue: 0, bookingsCount: 0 };
        monthMap[mk].totalRevenue  += val;
        monthMap[mk].bookingsCount += 1;
        if (!yearMap[yk]) yearMap[yk] = { yr: d.getFullYear(), totalRevenue: 0, totalBookings: 0 };
        yearMap[yk].totalRevenue  += val;
        yearMap[yk].totalBookings += 1;
    });
    const topMonth = Object.values(monthMap).sort((a,b) => b.totalRevenue - a.totalRevenue)[0] || { topMonth: 'No Data', topMonthYear: new Date().getFullYear(), totalRevenue: 0, bookingsCount: 0 };
    const topYear  = Object.values(yearMap).sort((a,b) => b.totalRevenue - a.totalRevenue)[0]  || { yr: new Date().getFullYear(), totalRevenue: 0, totalBookings: 0 };
    res.json({ topMonth: topMonth.topMonth, topMonthYear: topMonth.topMonthYear, topMonthRevenue: topMonth.totalRevenue, topMonthBookings: topMonth.bookingsCount, overallTopYear: topYear.yr, totalBookings: topYear.totalBookings, topYearRevenue: topYear.totalRevenue });
});

adminApp.get('/top-buyer', (req, res) => {
    const sales = readDb('sales').filter(s => s.status === 'Paid');
    const users = readDb('users');
    const map   = {};
    sales.forEach(s => {
        if (!map[s.user_id]) map[s.user_id] = { totalSpent: 0, totalBookings: 0, lastBooking: s.created_at };
        map[s.user_id].totalSpent   += parseFloat(s.total_amount) || parseFloat(s.amount) || 0;
        map[s.user_id].totalBookings += 1;
        if (s.created_at > map[s.user_id].lastBooking) map[s.user_id].lastBooking = s.created_at;
    });
    const top = Object.entries(map).sort((a,b) => b[1].totalSpent - a[1].totalSpent)[0];
    if (!top) return res.json({ fName: 'No Sales Yet', totalSpent: 0, totalBookings: 0 });
    const u = users.find(u => u.id == top[0]) || {};
    res.json({ fName: u.fName || 'Unknown', email: u.email || '', totalSpent: top[1].totalSpent, totalBookings: top[1].totalBookings });
});

adminApp.get('/reporting-summary', (req, res) => {
    const range = req.query.range || '6';
    let sales = readDb('sales').filter(s => s.status === 'Paid');
    if (range !== 'all') {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - parseInt(range));
        sales = sales.filter(s => new Date(s.created_at) >= cutoff);
    }
    const totalRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || parseFloat(s.amount) || 0), 0);
    res.json({ totalRevenue, eventsServiced: sales.length, estimatedProfits: totalRevenue * 0.35, averageBookingValue: sales.length ? totalRevenue / sales.length : 0 });
});

adminApp.get('/event-activity', (req, res) => {
    const sales = readDb('sales').filter(s => s.status === 'Paid');
    const map   = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0 };
    sales.forEach(s => { const dow = new Date(s.event_date).getDay(); map[(dow + 1)] = (map[(dow + 1)] || 0) + 1; });
    // 1=Sun,2=Mon...7=Sat → reorder Mon-Sun
    res.json([
        { label:'M',  count: map[2] },
        { label:'T',  count: map[3] },
        { label:'W',  count: map[4] },
        { label:'Th', count: map[5] },
        { label:'F',  count: map[6] },
        { label:'Sa', count: map[7] },
        { label:'Su', count: map[1] },
    ]);
});

// All appointments
function allAppointmentsHandler(req, res) {
    const sales  = readDb('sales').filter(s => s.status === 'Paid');
    const users  = readDb('users');
    const orders = readDb('orders');
    const result = sales.map(s => {
        const u   = users.find(u => u.id == s.user_id) || {};
        const o   = orders.find(o => o.user_id == s.user_id && o.event_date === s.event_date) || {};
        const fullAmount      = parseFloat(s.total_amount) || parseFloat(s.amount) * 2 || 0;
        const reservationFee  = parseFloat(s.amount) || fullAmount * 0.5;
        let   parsedSnapshot  = null;
        try { if (o.snapshot) parsedSnapshot = typeof o.snapshot === 'string' ? JSON.parse(o.snapshot) : o.snapshot; } catch {}
        const d = new Date(s.event_date);
        const eventDate = d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }).replace(/ /g,'-');
        return { saleId: s.id, orderId: o.id || null, fName: u.fName || 'Unknown', email: u.email || '', contact_number: s.contact_number || '', event_address: s.event_address || '', eventDate, rawDate: s.event_date, amount: fullAmount, reservationFee, status: s.status || 'Paid', event_time: o.event_time || '', event_start_time: o.event_start_time || '', event_end_time: o.event_end_time || '', guestCount: o.guest_count || 0, messageConcern: o.message_concern || '', snapshot: parsedSnapshot };
    }).sort((a,b) => b.rawDate.localeCompare(a.rawDate));
    res.json(result);
}
adminApp.get('/all-appointments', allAppointmentsHandler);
app.get('/all-appointments',      allAppointmentsHandler);

// Order items
function orderItemsHandler(req, res) {
    const order = readDb('orders').find(o => o.id == req.params.orderId);
    if (!order) return res.json({ package: null, addons: [], menuItems: [] });
    let snap = null;
    try { snap = order.snapshot ? (typeof order.snapshot === 'string' ? JSON.parse(order.snapshot) : order.snapshot) : null; } catch {}
    if (snap && (snap.selectedPackage || snap.addons?.length || snap.menuItems?.length))
        return res.json({ package: snap.selectedPackage || null, addons: snap.addons || [], menuItems: snap.menuItems || [], guestCount: order.guest_count, message: order.message_concern });
    res.json({ package: null, addons: [], menuItems: [], guestCount: order.guest_count, message: order.message_concern });
}
adminApp.get('/api/order-items/:orderId', orderItemsHandler);
app.get('/api/order-items/:orderId',      orderItemsHandler);

// Menu CRUD
adminApp.get('/api/menu',       (req,res) => { res.json(readDb('menu_items').sort((a,b) => new Date(b.created_at) - new Date(a.created_at))); });
adminApp.get('/api/menu/:id',   (req,res) => { const i = readDb('menu_items').find(m => m.id == req.params.id); i ? res.json(i) : res.status(404).json({message:'Not found'}); });
adminApp.post('/api/menu',      (req,res) => { const {courseName,price,category,description} = req.body; if (!courseName||!price) return res.status(400).json({message:'Required'}); const items = readDb('menu_items'); const n = {id:nextId(items),courseName,price,category:category||'Other',description:description||null,created_at:now()}; items.push(n); writeDb('menu_items',items); res.status(201).json({message:'Created',id:n.id}); });
adminApp.put('/api/menu/:id',   (req,res) => { const {courseName,price,category,description} = req.body; if (!courseName||!price) return res.status(400).json({message:'Required'}); const items = readDb('menu_items'); const idx = items.findIndex(m => m.id == req.params.id); if (idx===-1) return res.status(404).json({message:'Not found'}); items[idx]={...items[idx],courseName,price,category:category||'Other',description:description||null}; writeDb('menu_items',items); res.json({message:'Updated'}); });
adminApp.delete('/api/menu/:id',(req,res) => { const items = readDb('menu_items'); const n = items.filter(m => m.id != req.params.id); if (n.length===items.length) return res.status(404).json({message:'Item not found'}); writeDb('menu_items',n); res.json({message:'Deleted'}); });
app.delete('/api/menu/:id',     (req,res) => { writeDb('menu_items', readDb('menu_items').filter(m => m.id != req.params.id)); res.json({message:'Deleted'}); });

// Packages CRUD
adminApp.get('/api/packages',          (req,res) => { res.json(readDb('packages').sort((a,b) => new Date(b.created_at) - new Date(a.created_at))); });
adminApp.get('/api/packages/:id',      (req,res) => { const p = readDb('packages').find(p => p.id == req.params.id); p ? res.json(p) : res.status(404).json({message:'Not found'}); });
adminApp.post('/api/packages',         (req,res) => { const {name,price,description,guest_count} = req.body; if (!name||!price) return res.status(400).json({message:'Required'}); const pkgs = readDb('packages'); const n = {id:nextId(pkgs),name,price,description:description||'',guest_count:guest_count||0,created_at:now()}; pkgs.push(n); writeDb('packages',pkgs); res.status(201).json({message:'Created',id:n.id}); });
adminApp.put('/api/packages/:id',      (req,res) => { const {name,price,description,guest_count} = req.body; if (!name||!price) return res.status(400).json({message:'Required'}); const pkgs = readDb('packages'); const idx = pkgs.findIndex(p => p.id == req.params.id); if (idx===-1) return res.status(404).json({message:'Not found'}); pkgs[idx]={...pkgs[idx],name,price,description:description||'',guest_count:guest_count||0}; writeDb('packages',pkgs); res.json({message:'Updated'}); });
adminApp.delete('/api/packages/:id',   (req,res) => { const pkgs = readDb('packages'); const n = pkgs.filter(p => p.id != req.params.id); if (n.length===pkgs.length) return res.status(404).json({message:'Package not found'}); writeDb('packages',n); res.json({message:'Deleted'}); });
app.delete('/api/packages/:id',        (req,res) => { writeDb('packages', readDb('packages').filter(p => p.id != req.params.id)); res.json({message:'Deleted'}); });

// Shared public routes
app.get('/api/menu',     (req, res) => { const cat = req.query.category; const items = readDb('menu_items'); res.json(cat ? items.filter(m => m.category === cat) : items.sort((a,b) => a.category.localeCompare(b.category))); });
app.get('/api/packages', (req, res) => { res.json(readDb('packages').sort((a,b) => a.id - b.id)); });

// Reviews admin
adminApp.get('/api/admin/reviews', (req,res) => {
    const reviews = readDb('reviews').sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    const users   = readDb('users');
    res.json(reviews.map(r => ({ ...r, fName: users.find(u => u.id == r.user_id)?.fName || 'Anonymous' })));
});

// Seed endpoints
adminApp.post('/api/seed-packages', (req, res) => {
    const items = req.body.items;
    if (!items?.length) return res.status(400).json({ message: 'No items provided' });
    const pkgs = readDb('packages');
    let seeded = 0;
    items.forEach(p => { if (!pkgs.find(x => x.name === p.name)) { pkgs.push({id: nextId(pkgs), name: p.name, price: p.price, description: p.description||'', guest_count: p.guest_count||0, created_at: now()}); seeded++; } });
    writeDb('packages', pkgs);
    res.json({ message: `Seeded ${seeded} packages.` });
});
adminApp.post('/api/seed-menu', (req, res) => {
    const items = req.body.items;
    if (!items?.length) return res.status(400).json({ message: 'No items provided' });
    const menu = readDb('menu_items');
    let seeded = 0;
    items.forEach(m => { if (!menu.find(x => x.courseName === m.courseName)) { menu.push({id: nextId(menu), courseName: m.courseName, price: m.price, category: m.category||'Other', description: m.description||null, created_at: now()}); seeded++; } });
    writeDb('menu_items', menu);
    res.json({ message: `Seeded ${seeded} menu items.` });
});

adminApp.get('/api/test', (req, res) => res.json({ message: 'Admin server is running!', timestamp: new Date().toISOString() }));

app.use((req,res)    => res.status(404).json({ message: 'Route not found' }));
app.use((err,req,res,next) => res.status(500).json({ message: 'Internal server error' }));

const PORT       = process.env.PORT       || 3001;
const ADMIN_PORT = process.env.ADMIN_PORT || 4000;

adminApp.listen(ADMIN_PORT, () => console.log(`Admin server running on http://localhost:${ADMIN_PORT}`));
app.listen(PORT,            () => console.log(`Main  server running on http://localhost:${PORT}`));

require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-secret-key'; // In production, use env variable

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Authentication & Profile ---

app.post('/api/register', async (req, res) => {
    const { email, password, name, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: email === 'admin@aura.com' ? 'ADMIN' : (role || 'CITIZEN'),
                profile: { create: {} } // Create empty profile
            }
        });
        res.json({ message: 'User created successfully', userId: user.id });
    } catch (error) {
        res.status(400).json({ error: 'User already exists or invalid data' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
    const profile = await prisma.profile.findUnique({
        where: { userId: req.user.userId },
        include: { user: { select: { name: true, email: true, role: true } } }
    });
    res.json(profile);
});

app.patch('/api/profile', authenticateToken, async (req, res) => {
    const { bio, phone, avatar, social } = req.body;
    try {
        const profile = await prisma.profile.update({
            where: { userId: req.user.userId },
            data: { bio, phone, avatar, social }
        });
        res.json(profile);
    } catch (error) {
        res.status(400).json({ error: 'Update failed' });
    }
});

// --- Raw SQL Example ---

// Example endpoint using Raw SQL
app.get('/api/raw-users', async (req, res) => {
    try {
        // We use prisma.$queryRaw since Prisma is already configured.
        // The tagged template literal prevents SQL injection automatically.
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true }
        });
        res.json(users);
    } catch (error) {
        console.error('Raw query error:', error);
        res.status(500).json({ error: 'Failed to fetch users using raw SQL' });
    }
});

// --- Event & Category Routes ---

app.get('/api/categories', async (req, res) => {
    const categories = await prisma.category.findMany();
    res.json(categories);
});

app.get('/api/events', async (req, res) => {
    const { category, hostId } = req.query;
    const events = await prisma.event.findMany({
        where: {
            AND: [
                category ? { categories: { some: { name: category } } } : {},
                hostId ? { hostId: parseInt(hostId) } : {},
                !hostId && !req.query.all ? { approvalStatus: 'APPROVED' } : {}
            ]
        },
        include: {
            host: { select: { name: true } },
            categories: true,
            _count: { select: { reviews: true } },
            bookings: {
                include: {
                    payment: true,
                    user: { select: { name: true, email: true } }
                }
            }
        }
    });
    res.json(events);
});

app.post('/api/events', authenticateToken, async (req, res) => {
    if (req.user.role !== 'HOST') return res.status(403).json({ error: 'Host only' });
    const { 
        title, description, date, location, price, image, categoryNames,
        descriptionDoc, isFree, regType, externalLink 
    } = req.body;
    try {
        const event = await prisma.event.create({
            data: {
                title,
                description,
                date: new Date(date),
                location,
                price: isFree ? 0 : parseFloat(price),
                image,
                descriptionDoc,
                isFree: !!isFree,
                regType: regType || 'INTERNAL',
                externalLink,
                hostId: req.user.userId,
                categories: {
                    connectOrCreate: categoryNames.map(name => ({
                        where: { name },
                        create: { name }
                    }))
                }
            }
        });
        res.json(event);
    } catch (error) {
        console.error('Create Event Error:', error);
        res.status(400).json({ error: 'Failed to create event: ' + error.message });
    }
});

// --- Admin Routes ---
app.get('/api/admin/events/pending', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    const events = await prisma.event.findMany({
        where: { approvalStatus: 'PENDING' },
        include: { host: { select: { name: true } }, categories: true }
    });
    res.json(events);
});

app.patch('/api/admin/events/:id/status', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    const { status } = req.body;
    try {
        const event = await prisma.event.update({
            where: { id: parseInt(req.params.id) },
            data: { approvalStatus: status }
        });
        res.json(event);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update event status' });
    }
});

// --- Booking & Payment Routes ---

app.post('/api/bookings', authenticateToken, async (req, res) => {
    const { eventId, amount, attendees } = req.body;
    const ticketCode = 'TICK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    try {
        const event = await prisma.event.findUnique({ where: { id: parseInt(eventId) } });
        if (!event || event.status !== 'OPEN') {
            return res.status(400).json({ error: 'Registration is closed for this event.' });
        }

        const booking = await prisma.booking.create({
            data: {
                userId: req.user.userId,
                eventId: parseInt(eventId, 10),
                ticketCode,
                attendees: attendees || null,
                status: 'CONFIRMED', 
                payment: event.isFree ? undefined : {
                    create: {
                        amount: parseFloat(amount),
                        status: 'COMPLETED', // Simulating instant payment
                        transactionId: 'TXN-' + Date.now()
                    }
                }
            }
        });

        // Create notification
        await prisma.notification.create({
            data: {
                userId: req.user.userId,
                title: 'Booking Confirmed!',
                message: `You have successfully registered with ID "${ticketCode}"`
            }
        });

        res.json(booking);
    } catch (error) {
        res.status(400).json({ error: 'Booking failed' });
    }
});

app.get('/api/user/bookings', authenticateToken, async (req, res) => {
    const bookings = await prisma.booking.findMany({
        where: { userId: req.user.userId },
        include: { event: true, payment: true },
        orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
});

app.post('/api/bookings/:id/refund', authenticateToken, async (req, res) => {
    if (req.user.role !== 'HOST') return res.status(403).json({ error: 'Host only' });
    const bookingId = parseInt(req.params.id);
    const { reason } = req.body;

    try {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { event: true }
        });

        if (!booking || booking.event.hostId !== req.user.userId) {
            return res.status(404).json({ error: 'Booking not found or unauthorized' });
        }

        await prisma.$transaction([
            prisma.payment.update({
                where: { bookingId: bookingId },
                data: { status: 'REFUNDED' }
            }),
            prisma.booking.update({
                where: { id: bookingId },
                data: { 
                    status: 'REFUNDED',
                    refundReason: reason || 'Refunded by Host'
                }
            })
        ]);

        res.json({ message: 'Refund processed successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Refund failed' });
    }
});

app.post('/api/user/bookings/:id/refund', authenticateToken, async (req, res) => {
    const bookingId = parseInt(req.params.id);
    const { reason } = req.body;

    try {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { event: true, payment: true }
        });

        if (!booking || booking.userId !== req.user.userId) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.status === 'REFUNDED') {
            return res.status(400).json({ error: 'Already refunded' });
        }

        await prisma.$transaction([
            prisma.payment.update({
                where: { bookingId: bookingId },
                data: { status: 'REFUNDED' }
            }),
            prisma.booking.update({
                where: { id: bookingId },
                data: { 
                    status: 'REFUNDED',
                    refundReason: reason || 'User requested cancellation'
                }
            }),
            prisma.notification.create({
                data: {
                    userId: req.user.userId,
                    title: 'Registration Refunded',
                    message: `Your registration for "${booking.event.title}" has been refunded.`
                }
            })
        ]);

        res.json({ message: 'Refund processed successfully' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Refund request failed' });
    }
});

app.patch('/api/events/:id/status', authenticateToken, async (req, res) => {
    if (req.user.role !== 'HOST') return res.status(403).json({ error: 'Host only' });
    const eventId = parseInt(req.params.id);
    const { status } = req.body;

    try {
        const event = await prisma.event.update({
            where: { id: eventId, hostId: req.user.userId },
            data: { status }
        });
        res.json(event);
    } catch (error) {
        res.status(400).json({ error: 'Update status failed' });
    }
});

app.post('/api/notifications/bulk', authenticateToken, async (req, res) => {
    if (req.user.role !== 'HOST') return res.status(403).json({ error: 'Host only' });
    const { eventId, title, message } = req.body;

    try {
        const bookings = await prisma.booking.findMany({
            where: { eventId: parseInt(eventId) },
            select: { userId: true }
        });

        const userIds = [...new Set(bookings.map(b => b.userId))];

        await prisma.notification.createMany({
            data: userIds.map(userId => ({
                userId,
                title,
                message
            }))
        });

        res.json({ message: `Notification sent to ${userIds.length} attendees` });
    } catch (error) {
        res.status(400).json({ error: 'Failed to send bulk notifications' });
    }
});

// --- Review Routes ---

app.post('/api/reviews', authenticateToken, async (req, res) => {
    const { eventId, rating, comment } = req.body;
    try {
        const review = await prisma.review.create({
            data: {
                userId: req.user.userId,
                eventId: parseInt(eventId),
                rating: parseInt(rating),
                comment
            }
        });
        res.json(review);
    } catch (error) {
        res.status(400).json({ error: 'Failed to submit review' });
    }
});

// --- Notification Routes ---

app.get('/api/notifications', authenticateToken, async (req, res) => {
    const notifications = await prisma.notification.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

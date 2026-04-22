window.API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000' 
    : 'https://aura-an-event-organizer.onrender.com';


// ─── CURSOR ───
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
});
(function animRing() {
    rx += (mx - rx) * .12; ry += (my - ry) * .12;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(animRing);
})();
document.querySelectorAll('button,a,.event-card,.feat-small,.testi-card,.how-card').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.style.width = '22px'; cursor.style.height = '22px'; ring.style.width = '56px'; ring.style.height = '56px'; ring.style.opacity = '.5'; });
    el.addEventListener('mouseleave', () => { cursor.style.width = '12px'; cursor.style.height = '12px'; ring.style.width = '36px'; ring.style.height = '36px'; ring.style.opacity = '1'; });
});

// ─── CANVAS STARFIELD ───
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let stars = [];
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
for (let i = 0; i < 180; i++) {
    stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * .9 + .2,
        o: Math.random() * .6 + .1,
        sp: Math.random() * .3 + .05,
        flicker: Math.random() * Math.PI * 2
    });
}
function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
        s.flicker += 0.018;
        const alpha = s.o * (0.6 + 0.4 * Math.sin(s.flicker));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 118, 255, ${alpha})`;
        ctx.fill();
        s.y -= s.sp;
        if (s.y < 0) { s.y = canvas.height; s.x = Math.random() * canvas.width; }
    });
    requestAnimationFrame(drawCanvas);
}
drawCanvas();

// ─── PARTICLES ───
const pContainer = document.getElementById('particles');
if (pContainer) {
    for (let i = 0; i < 28; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (Math.random() * 12 + 8) + 's';
        p.style.animationDelay = (-Math.random() * 20) + 's';
        p.style.width = p.style.height = (Math.random() * 2 + 1) + 'px';
        p.style.opacity = Math.random() * .6 + .1;
        pContainer.appendChild(p);
    }
}

// ─── NAVBAR SCROLL & MOBILE TOGGLE ───
const nav = document.getElementById('mainNav');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle) {
    menuToggle.onclick = () => {
        const isHostDash = document.querySelector('.dashboard-layout') || document.querySelector('.main-dash');
        if (isHostDash) {
            const sidebar = document.querySelector('.sidebar') || document.querySelector('aside');
            if (sidebar) {
                menuToggle.classList.toggle('active');
                sidebar.classList.toggle('active');
            } else {
                console.warn('Sidebar not found for mobile toggle');
            }
        } else {
            const currentNavLinks = document.querySelector('.nav-links');
            if (currentNavLinks) {
                menuToggle.classList.toggle('active');
                currentNavLinks.classList.toggle('active');
                
                // Add class to parent nav to handle CSS clipping
                const parentNav = menuToggle.closest('nav');
                if (parentNav) parentNav.classList.toggle('menu-open');
            } else {
                console.warn('Navigation links not found for mobile toggle');
            }
        }
    };
}

// Close menu when link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        const currentNavLinks = document.querySelector('.nav-links');
        if (currentNavLinks && currentNavLinks.classList.contains('active')) {
            if (menuToggle) menuToggle.classList.remove('active');
            currentNavLinks.classList.remove('active');
            const parentNav = menuToggle.closest('nav');
            if (parentNav) parentNav.classList.remove('menu-open');
        }
    });
});

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// ─── SCROLL REVEAL ───
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); }
    });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ─── COUNTER ───
function animateCounter(el, target) {
    let start = 0;
    const suffix = target >= 1000 ? (target >= 100000 ? '+' : 'k+') : '%';
    const end = target >= 100000 ? Math.round(target / 1000) : target;
    const dur = 2200; const step = dur / 60;
    const timer = setInterval(() => {
        start += end / step;
        if (start >= end) { start = end; clearInterval(timer); }
        el.textContent = Math.floor(start).toLocaleString() + suffix;
    }, dur / 60 / 60 * 1000);
}
const statsObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.querySelectorAll('[data-target]').forEach(el => {
                animateCounter(el, +el.dataset.target);
            });
            statsObs.unobserve(e.target);
        }
    });
}, { threshold: .4 });
document.querySelector('.stats-bar') && statsObs.observe(document.querySelector('.stats-bar'));

// ─── PARALLAX HERO ───
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero');
    const sy = window.scrollY;
    if (hero) { hero.style.transform = `translateY(${sy * .25}px)`; }
});

// ─── GLOWING PULSE on cards ───
document.querySelectorAll('.event-card,.how-card,.feat-big').forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', x + '%');
        card.style.setProperty('--my', y + '%');
        card.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(0, 118, 255, 0.08) 0%, rgba(255, 255, 255, 0.95) 60%)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.background = '';
    });
});

// ─── AUTHENTICATION ───
function updateNav() {
    const user = JSON.parse(localStorage.getItem('user'));
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && user) {
        const dashboardUrl = user.role === 'HOST' ? 'host-dashboard.html' : 'user-dashboard.html';
        navLinks.innerHTML = `
            <a href="index.html#events">Events</a>
            <a href="explore-events.html">Explore</a>
            <a href="${dashboardUrl}">Dashboard</a>
            <a href="#" onclick="logout()" class="nav-btn">Logout</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function checkAuth() {
    updateNav();
    // Protect dashboards
    const path = window.location.pathname;
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if ((path.includes('dashboard') || path.includes('host-event') || path.includes('checkout')) && !token) {
        window.location.href = 'login-signup.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    // Inject Poster Modal
    if (!document.getElementById('poster-modal')) {
        const modal = document.createElement('div');
        modal.id = 'poster-modal';
        modal.className = 'poster-modal';
        modal.innerHTML = `
            <div class="poster-modal-content">
                <span class="poster-close" onclick="closePosterModal()">&times;</span>
                <img id="poster-img" src="" alt="Event Poster">
            </div>
        `;
        document.body.appendChild(modal);
    }
});

function openPosterModal(imageSrc) {
    const modal = document.getElementById('poster-modal');
    const img = document.getElementById('poster-img');
    if (modal && img) {
        img.src = imageSrc;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closePosterModal() {
    const modal = document.getElementById('poster-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ─── EVENTS ───
async function loadEvents(containerId, category = '') {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const url = category
            ? `${API_BASE_URL}/api/events?category=${encodeURIComponent(category)}`
            : `${API_BASE_URL}/api/events`;

        const response = await fetch(url);
        const events = await response.json();

        container.innerHTML = events.map(event => {
            const regCount = event.interestedCount || 0;
            const capacity = event.capacity || 100; // Fallback if capacity not set
            const isFillingFast = regCount > 0 && (regCount / capacity) >= 0.8;
            
            // Attractive registration badge
            let regBadge = '';
            if (regCount > 0) {
                const badgeClass = isFillingFast ? 'reg-badge-warning' : 'reg-badge-info';
                const badgeText = isFillingFast 
                    ? `🔥 Filling Fast! ${regCount} joined` 
                    : `✨ ${regCount}+ Registered`;
                regBadge = `<div class="reg-badge ${badgeClass}">${badgeText}</div>`;
            }

            return `
            <div class="event-card reveal visible">
                <div class="card-img">
                    <img src="${event.image || 'https://via.placeholder.com/600x400'}" alt="${event.title}" style="width:100%; height:100%; object-fit:cover;">
                    <span class="card-tag">${event.categories.map(c => c.name).join(', ')}</span>
                    <span class="card-price">$${event.price}</span>
                    ${regBadge}
                    ${event.descriptionDoc ? `
                        <button class="briefcase-btn" onclick="openPosterModal('${event.descriptionDoc}')" title="View Brief Case (Poster)">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
                <div class="card-body">
                    <div class="card-date">${new Date(event.date).toLocaleDateString()} · ${event.location}</div>
                    <h3 class="card-title">${event.title}</h3>
                    <p class="card-desc">${event.description}</p>
                    <div class="card-footer">
                        <span class="card-venue">${event.host.name}</span>
                        <a href="checkout.html?eventId=${event.id}&price=${event.price}&title=${encodeURIComponent(event.title)}&isFree=${event.isFree}&regType=${event.regType}&externalLink=${encodeURIComponent(event.externalLink || '')}" class="card-btn" style="text-decoration:none;">Book Now</a>
                    </div>
                </div>
            </div>
        `;}).join('');

    } catch (error) {
        console.error('Error loading events:', error);
        container.innerHTML = '<p style="color:red; text-align:center;">Failed to load events. Is the server running?</p>';
    }
}

async function loadUserBookings(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const token = (localStorage.getItem('token') || "").trim();
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/user/bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const bookings = await response.json();

        const activeBookings = bookings.filter(b => b.status !== 'REFUNDED' && (b.payment ? b.payment.status !== 'REFUNDED' : true));
        const countText = document.getElementById('upcoming-count');
        if (countText) {
            countText.innerText = `You have ${activeBookings.length} upcoming experience${activeBookings.length !== 1 ? 's' : ''}.`;
        }

        if (bookings.length === 0) {
            container.innerHTML = '<p style="color:var(--muted); text-align:center; grid-column: 1/-1;">You haven\'t booked any events yet.</p>';
            return;
        }

        container.innerHTML = bookings.map(booking => {
            const isRefunded = booking.payment.status === 'REFUNDED' || booking.status === 'REFUNDED';
            return `
            <div class="ticket-card" style="${isRefunded ? 'opacity: 0.6; filter: grayscale(0.5);' : ''}">
                <div class="ticket-header">
                    <span style="font-size: 0.75rem; color: var(--muted);">ID: #${booking.ticketCode}</span>
                    <span class="ticket-status" style="${isRefunded ? 'background:rgba(239,68,68,0.1); color:#ef4444; border-color:rgba(239,68,68,0.2);' : ''}">
                        ${isRefunded ? 'REFUNDED' : booking.payment.status}
                    </span>
                </div>
                <div class="ticket-body">
                    <h2 class="ticket-title">${booking.event.title}</h2>
                    <div class="ticket-info-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>${new Date(booking.event.date).toLocaleString()}</span>
                    </div>
                </div>
                <div class="ticket-footer" style="display: flex; gap: 10px;">
                    <button class="btn-primary" style="flex: 2; border-radius: 12px; margin-top: 0;"
                        ${isRefunded ? 'disabled' : ''}
                        onclick="openPass('${booking.event.title.replace(/'/g, "\\'")}', '${booking.ticketCode}')">
                        ${isRefunded ? 'Invalid Pass' : 'View Pass'}
                    </button>
                    ${!isRefunded ? `
                    <button class="btn-ghost" style="flex: 1; border-radius: 12px; font-size: 0.7rem; padding: 0;"
                        onclick="openRefundModal(${booking.id})">Refund</button>
                    ` : ''}
                </div>
            </div>
        `;}).join('');

    } catch (error) {
        console.error('Error loading bookings:', error);
        container.innerHTML = '<p style="color:red; text-align:center;">Failed to load bookings.</p>';
    }
}

async function loadHostDashboard() {
    const eventsTableBody = document.querySelector('tbody');
    const user = JSON.parse(localStorage.getItem('user'));
    if (!eventsTableBody || !user || user.role !== 'HOST') return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/events?hostId=${user.id}`);
        const events = await response.json();

        // Update Stats
        const totalRevenue = events.reduce((sum, event) => sum + event.bookings.reduce((s, b) => s + b.payment.amount, 0), 0);
        const totalTickts = events.reduce((sum, event) => sum + event.bookings.length, 0);

        const revEl = document.querySelector('.stats-grid .stat-card:nth-child(1) .stat-card-value');
        const tktEl = document.querySelector('.stats-grid .stat-card:nth-child(2) .stat-card-value');
        const actEl = document.querySelector('.stats-grid .stat-card:nth-child(3) .stat-card-value');

        if (revEl) revEl.innerText = `$${totalRevenue.toLocaleString()}`;
        if (tktEl) tktEl.innerText = totalTickts.toLocaleString();
        if (actEl) actEl.innerText = events.length;

        // Update Table
        eventsTableBody.innerHTML = events.map(event => {
            const revenue = event.bookings.reduce((s, b) => s + b.payment.amount, 0);
            
            let statusPill = `<span class="status-pill" style="background: rgba(234, 179, 8, 0.1); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.2);">Pending Approval</span>`;
            if (event.approvalStatus === 'APPROVED') {
                statusPill = `<span class="status-pill status-active">Approved & Live</span>`;
            } else if (event.approvalStatus === 'REJECTED') {
                statusPill = `<span class="status-pill status-soldout">Rejected</span>`;
            }

            return `
                <tr>
                    <td>
                        <div style="font-weight: 500;">${event.title}</div>
                        <div style="font-size: 0.75rem; color: var(--muted);">${event.location}</div>
                    </td>
                    <td>${new Date(event.date).toLocaleDateString()}</td>
                    <td>$${revenue.toLocaleString()}</td>
                    <td>${event.bookings.length}</td>
                    <td>${statusPill}</td>
                    <td><button class="action-btn" onclick="manageEvent('${event.id}', '${event.title.replace(/'/g, "\\'")}')">Manage</button></td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading host dashboard:', error);
    }
}
let currentEventData = null;

async function manageEvent(eventId, eventName) {
    const overview = document.getElementById('overview-section');
    const manage = document.getElementById('manage-view');
    if (!overview || !manage) return;

    overview.style.display = 'none';
    manage.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.getElementById('manage-event-title').innerHTML = `${eventName} <span>Details</span>`;
    document.getElementById('manage-event-label').innerText = `✦ Managing: ${eventName}`;

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`${API_BASE_URL}/api/events?hostId=${user.id}`);
        const events = await response.json();
        const event = events.find(e => e.id == eventId);

        if (event) {
            currentEventData = event;
            const revenue = event.bookings.reduce((s, b) => s + (b.payment ? b.payment.amount : 0), 0);
            document.getElementById('current-event-revenue').innerText = `$${revenue.toLocaleString()}`;

            // Update Registration Status UI
            const statusDisplay = document.getElementById('registration-status-display');
            const toggleBtn = document.getElementById('toggle-reg-btn');
            if (statusDisplay && toggleBtn) {
                statusDisplay.innerText = event.status;
                statusDisplay.style.color = event.status === 'OPEN' ? '#4ade80' : '#f87171';
                toggleBtn.innerText = event.status === 'OPEN' ? 'Close Registrations' : 'Open Registrations';
                toggleBtn.style.color = event.status === 'OPEN' ? '#f87171' : '#4ade80';
            }

            const attendeeList = document.getElementById('attendee-list') || document.querySelector('.attendee-list');
            if (attendeeList) {
                if (event.bookings.length === 0) {
                    attendeeList.innerHTML = '<p style="text-align:center; padding:20px; color:var(--muted);">No registrations yet.</p>';
                } else {
                    attendeeList.innerHTML = event.bookings.map(booking => {
                        const userName = (booking.user && booking.user.name) ? booking.user.name : 'Unknown User';
                        const userEmail = (booking.user && booking.user.email) ? booking.user.email : 'Unknown Email';
                        const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substr(0, 2);
                        const paymentStatus = booking.payment ? booking.payment.status : '';
                        const isRefunded = paymentStatus === 'REFUNDED' || booking.status === 'REFUNDED';
                        const bookingAmount = booking.payment ? `$${booking.payment.amount}` : 'N/A';
                        return `
                        <div class="attendee-item" style="${isRefunded ? 'opacity: 0.6; background: rgba(239, 68, 68, 0.02);' : ''}">
                            <div class="attendee-info">
                                <div class="attendee-avatar">${initials}</div>
                                <div>
                                    <span class="attendee-name">${userName}</span>
                                    <span class="attendee-email">${userEmail}</span>
                                    <span style="display:block; font-size:0.65rem; color:var(--muted); margin-top:2px;">Registration: #${booking.ticketCode} &nbsp;·&nbsp; Paid: ${bookingAmount}</span>
                                    ${isRefunded ? `<span style="display:block; font-size:0.65rem; color:#ef4444; margin-top:4px;">Refunded: ${booking.refundReason || 'No reason provided'}</span>` : ''}
                                </div>
                            </div>
                            <div class="manage-actions">
                                <button class="action-btn btn-refund" ${isRefunded ? 'disabled style="opacity:0.5;"' : ''} 
                                    type="button" onclick="handleRefund(${booking.id}, this)">${isRefunded ? 'Refunded' : 'Refund'}</button>
                            </div>
                        </div>
                    `}).join('');
                }
            }
        } else {
            console.warn('Event not found in host events list. EventId:', eventId);
        }
    } catch (error) {
        console.error('Error managing event:', error);
    }
}

async function handleRefund(bookingId, btn) {
    if (!confirm('Are you sure you want to process a full refund for this guest?')) return;

    const token = (localStorage.getItem('token') || "").trim();
    btn.disabled = true;
    btn.innerText = 'Refunding...';

    try {
        const id = parseInt(bookingId, 10);
        const response = await fetch(`${API_BASE_URL}/api/bookings/${id}/refund`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Refund failed');

        alert('Refund processed successfully.');
        // Refresh view
        if (currentEventData) manageEvent(currentEventData.id, currentEventData.title);
        loadHostDashboard();
    } catch (error) {
        alert(error.message);
        btn.disabled = false;
        btn.innerText = 'Refund';
    }
}

async function handleToggleRegistration() {
    if (!currentEventData) return;
    const newStatus = currentEventData.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    const token = (localStorage.getItem('token') || "").trim();

    try {
        const id = parseInt(currentEventData.id, 10);
        const response = await fetch(`${API_BASE_URL}/api/events/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Failed to update status');

        // Refresh view
        manageEvent(currentEventData.id, currentEventData.title);
    } catch (error) {
        alert(error.message);
    }
}

function downloadAttendeeCSV() {
    if (!currentEventData || !currentEventData.bookings || !currentEventData.bookings.length) {
        alert('No attendees to export.');
        return;
    }

    const headers = ['Name', 'Email', 'Registration Code', 'Payment Status', 'Amount', 'Booking Status'];
    const rows = currentEventData.bookings.map(b => [
        (b.user && b.user.name) ? b.user.name : 'Unknown',
        (b.user && b.user.email) ? b.user.email : 'Unknown',
        b.ticketCode || '',
        (b.payment && b.payment.status) ? b.payment.status : 'N/A',
        (b.payment && b.payment.amount) ? `$${b.payment.amount}` : 'N/A',
        b.status || 'CONFIRMED'
    ]);

    const csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendees_${currentEventData.title.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    alert(`✅ CSV exported with ${rows.length} attendees!`);
}

function openContactModal() {
    const modal = document.getElementById('contact-modal');
    if (!modal) return;
    if (!currentEventData) {
        alert('Please open an event first before contacting guests.');
        return;
    }
    if (!currentEventData.bookings || currentEventData.bookings.length === 0) {
        alert('This event has no registered attendees yet.');
        return;
    }
    modal.style.display = 'flex';
}

function closeContactModal() {
    const modal = document.getElementById('contact-modal');
    if (modal) modal.style.display = 'none';
}

async function sendBulkNotification() {
    if (!currentEventData) return;
    const title = document.getElementById('contact-title').value.trim();
    const message = document.getElementById('contact-message').value.trim();
    const token = (localStorage.getItem('token') || "").trim();

    if (!title || !message) {
        alert('Please provide both subject and message.');
        return;
    }

    const sendBtn = document.querySelector('#contact-modal .btn-primary');
    if (sendBtn) { sendBtn.innerText = 'Sending...'; sendBtn.disabled = true; }

    try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ eventId: currentEventData.id, title, message })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send broadcast');

        alert(`✅ ${data.message || 'Message sent to all attendees!'}`);
        document.getElementById('contact-title').value = '';
        document.getElementById('contact-message').value = '';
        closeContactModal();
    } catch (error) {
        alert(error.message);
    } finally {
        if (sendBtn) { sendBtn.innerText = 'Send Blast'; sendBtn.disabled = false; }
    }
}

const authForm = document.getElementById('auth-form');
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submit-btn');
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const nameInput = document.getElementById('auth-name');
        const name = nameInput ? nameInput.value : '';

        // isLogin and currentMode are defined in the inline script of login-signup.html
        const endpoint = isLogin ? '/api/login' : '/api/register';
        const payload = isLogin ? { email, password } : { email, password, name, role: currentMode === 'user' ? 'CITIZEN' : 'HOST' };

        submitBtn.innerText = 'Processing...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            if (isLogin) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect based on role
                if (data.user.role === 'ADMIN') {
                    window.location.href = 'admin-dashboard.html';
                } else if (data.user.role === 'HOST') {
                    window.location.href = 'host-dashboard.html';
                } else {
                    window.location.href = 'user-dashboard.html';
                }
            } else {
                alert('Account created! Please login.');
                toggleAuth(); // Switch to login mode
            }
        } catch (error) {
            alert(error.message);
        } finally {
            submitBtn.innerText = isLogin ? 'Continue' : 'Create Account';
            submitBtn.disabled = false;
        }
    });
}

// --- Refund Modal Logic ---
let activeRefundBookingId = null;

function openRefundModal(bookingId) {
    activeRefundBookingId = bookingId;
    document.getElementById('refund-modal').style.display = 'flex';
    document.getElementById('refund-reason').value = '';
}

function closeRefundModal() {
    activeRefundBookingId = null;
    document.getElementById('refund-modal').style.display = 'none';
}

const confirmRefundBtn = document.getElementById('confirm-refund-btn');
if (confirmRefundBtn) {
    confirmRefundBtn.onclick = async () => {
        const reason = document.getElementById('refund-reason').value.trim();
        if (!reason) {
            alert('Please provide a reason for the refund.');
            return;
        }

        const rawToken = localStorage.getItem('token');
        const token = (rawToken || "").trim();
        
        if (!token) {
            alert('Your session has expired. Please log in again.');
            window.location.href = 'index.html';
            return;
        }

        if (!activeRefundBookingId) {
            alert('Invalid booking selection. Please try again.');
            closeRefundModal();
            return;
        }

        confirmRefundBtn.disabled = true;
        confirmRefundBtn.innerText = 'Processing...';

        try {
            const bookingId = parseInt(activeRefundBookingId, 10);
            if (isNaN(bookingId)) throw new Error('Invalid Booking ID format');

            const response = await fetch(`${API_BASE_URL}/api/user/bookings/${bookingId}/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ reason: reason })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Refund failed');
            }

            alert('Your registration has been refunded successfully.');
            closeRefundModal();
            loadUserBookings('bookings-loader');
        } catch (error) {
            console.error('Refund Error:', error);
            alert(error.message);
        } finally {
            confirmRefundBtn.disabled = false;
            confirmRefundBtn.innerText = 'Confirm Refund';
        }
    };
}
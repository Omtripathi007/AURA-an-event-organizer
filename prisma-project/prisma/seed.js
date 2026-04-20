const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    console.log('Seeding data...');

    // Create Categories
    const categories = ['Music', 'Art', 'Tech', 'Food', 'Sports', 'Wellness'];
    const createdCategories = await Promise.all(
        categories.map(name =>
            prisma.category.upsert({
                where: { name },
                update: {},
                create: { name }
            })
        )
    );
    console.log(`Created ${createdCategories.length} categories.`);

    // Create a Host User
    const hostPassword = await bcrypt.hash('host123', 10);
    const host = await prisma.user.upsert({
        where: { email: 'host@example.com' },
        update: {},
        create: {
            email: 'host@example.com',
            password: hostPassword,
            name: 'Event Host Pro',
            role: 'HOST',
            profile: {
                create: {
                    bio: 'Professional event organizer with 10 years experience.',
                    phone: '+1234567890',
                    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'
                }
            }
        }
    });
    console.log(`Created Host: ${host.name}`);

    // Create an Event
    const event = await prisma.event.create({
        data: {
            title: 'Summer Music Festival 2026',
            description: 'The biggest music event of the year with top artists and amazing vibes.',
            date: new Date('2026-07-20T18:00:00Z'),
            location: 'Central Park, NY',
            price: 49.99,
            image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1200',
            hostId: host.id,
            categories: {
                connect: { name: 'Music' }
            }
        }
    });
    console.log(`Created Event: ${event.title}`);

    console.log('Seeding finished!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

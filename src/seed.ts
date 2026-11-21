import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { connectDB, getDB } from './config/db.js';
import {
  UserDoc,
  ServiceDoc,
  BookingDoc,
  PaymentDoc,
} from './types/index.js';

async function seed() {
  console.log('[Seeder] Connecting to database...');
  await connectDB();
  const db = getDB();

  console.log('[Seeder] Clearing old demo data...');
  await db.collection('users').deleteMany({});
  await db.collection('services').deleteMany({});
  await db.collection('bookings').deleteMany({});
  await db.collection('payments').deleteMany({});

  const now = new Date();
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const techPasswordHash = await bcrypt.hash('Tech123!', 10);
  const custPasswordHash = await bcrypt.hash('Cust123!', 10);

  // 1. Users (Admin, 2 Technicians, 2 Customers)
  const users: UserDoc[] = [
    {
      _id: new ObjectId(),
      name: 'Admin FixMate',
      email: 'admin@fixmate.com',
      password: adminPasswordHash,
      role: 'admin',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      phone: '+8801711000001',
      area: 'Dhaka City',
      bio: 'FixMate Head of Operations and Quality Assurance.',
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      name: 'Hasan Mahmud',
      email: 'tech.hasan@fixmate.com',
      password: techPasswordHash,
      role: 'technician',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      phone: '+8801812345678',
      area: 'Dhanmondi, Dhaka',
      bio: 'Certified HVAC & Home Appliance Master Technician with 8+ years experience.',
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      name: 'Tanvir Ahmed',
      email: 'tech.tanvir@fixmate.com',
      password: techPasswordHash,
      role: 'technician',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      phone: '+8801912345679',
      area: 'Gulshan & Banani, Dhaka',
      bio: 'Hardware Engineer specializing in Apple MacBooks, PC chip-level diagnosis, and flagship smartphones.',
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      name: 'Sarah Rahman',
      email: 'customer.sarah@fixmate.com',
      password: custPasswordHash,
      role: 'customer',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      phone: '+8801612345670',
      area: 'Mirpur 10, Dhaka',
      bio: 'Loyal customer and tech enthusiast.',
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      name: 'Karim Chowdhury',
      email: 'customer.karim@fixmate.com',
      password: custPasswordHash,
      role: 'customer',
      image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
      phone: '+8801512345671',
      area: 'Uttara, Dhaka',
      bio: 'Homeowner in Uttara.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.collection('users').insertMany(users);
  console.log(`[Seeder] Seeded ${users.length} users (Admin, Technicians, Customers)`);

  // 2. Services (14 approved + 1 pending + 1 rejected)
  const services: ServiceDoc[] = [
    {
      _id: new ObjectId(),
      title: 'iPhone & Android Original Screen Replacement',
      category: 'Smartphone',
      description: 'Quick 60-minute cracked display replacement using high-grade OEM panels with 90-day warranty against touch responsiveness issues.',
      image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
      basePrice: 45,
      estimatedDuration: '1-2 hours',
      serviceMode: 'Shop Drop-off',
      serviceArea: 'Gulshan & Banani, Dhaka',
      technicianName: 'Tanvir Ahmed',
      technicianEmail: 'tech.tanvir@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    },
    {
      _id: new ObjectId(),
      title: 'Laptop Motherboard Chip-Level Repair & Servicing',
      category: 'Laptop & PC',
      description: 'Advanced SMD soldering, power IC diagnostics, RAM replacement, cooling fan refurbishment, and thermal paste application.',
      image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
      basePrice: 65,
      estimatedDuration: '1-2 days',
      serviceMode: 'Shop Drop-off',
      serviceArea: 'Gulshan & Banani, Dhaka',
      technicianName: 'Tanvir Ahmed',
      technicianEmail: 'tech.tanvir@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
    },
    {
      _id: new ObjectId(),
      title: 'Split AC Master Jet Cleaning & Gas Refilling',
      category: 'AC',
      description: 'Comprehensive high-pressure jet pump cleaning of indoor evaporator and outdoor condenser coils, plus R410A/R32 gas top-up.',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
      basePrice: 35,
      estimatedDuration: '2-3 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Dhanmondi, Dhaka',
      technicianName: 'Hasan Mahmud',
      technicianEmail: 'tech.hasan@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
    {
      _id: new ObjectId(),
      title: 'Inverter Refrigerator Compressor & Gas Leak Repair',
      category: 'Refrigerator',
      description: 'Full diagnosis of non-cooling refrigerators, thermostat replacement, copper line brazing, vacuum check, and gas recharge.',
      image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&auto=format&fit=crop&q=80',
      basePrice: 55,
      estimatedDuration: '3-4 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Dhanmondi, Dhaka',
      technicianName: 'Hasan Mahmud',
      technicianEmail: 'tech.hasan@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    },
    {
      _id: new ObjectId(),
      title: 'Smart 4K LED TV Backlight & Panel Repair',
      category: 'TV',
      description: 'Fix black screen, blinking backlight, flickering horizontal lines, HDMI port issues, and power supply circuit diagnostics.',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
      basePrice: 50,
      estimatedDuration: '1 day',
      serviceMode: 'Home Visit',
      serviceArea: 'Dhanmondi, Dhaka',
      technicianName: 'Hasan Mahmud',
      technicianEmail: 'tech.hasan@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      _id: new ObjectId(),
      title: 'Front & Top Load Washing Machine Drum Servicing',
      category: 'Washing Machine',
      description: 'Resolve loud spinning noise, water drain errors (E20/OE), spin cycle failure, drive belt issues, and door rubber gasket replacement.',
      image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80',
      basePrice: 40,
      estimatedDuration: '2 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Dhanmondi, Dhaka',
      technicianName: 'Hasan Mahmud',
      technicianEmail: 'tech.hasan@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      _id: new ObjectId(),
      title: 'Complete Home Electrical DB Box & Short Circuit Fix',
      category: 'Electrical',
      description: 'Emergency tripping breaker troubleshooting, MCB replacement, earthing test, heavy-duty switchboard and appliance wiring safety check.',
      image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&auto=format&fit=crop&q=80',
      basePrice: 30,
      estimatedDuration: '1-3 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Dhanmondi, Dhaka',
      technicianName: 'Hasan Mahmud',
      technicianEmail: 'tech.hasan@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    },
    {
      _id: new ObjectId(),
      title: 'MacBook Battery Replacement & Ultrasonic Board Clean',
      category: 'Laptop & PC',
      description: 'Original high-capacity MacBook Air & Pro battery swap, trackpad calibration, and ultrasonic cleaning for minor moisture exposure.',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
      basePrice: 85,
      estimatedDuration: '3-4 hours',
      serviceMode: 'Shop Drop-off',
      serviceArea: 'Gulshan & Banani, Dhaka',
      technicianName: 'Tanvir Ahmed',
      technicianEmail: 'tech.tanvir@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      title: 'Smart Ceiling Fan & Chandelier Installation',
      category: 'Electrical',
      description: 'Precision mounting of BLDC energy-saving smart ceiling fans, fancy chandeliers, and decorative LED strip lighting with remote setup.',
      image: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=800&auto=format&fit=crop&q=80',
      basePrice: 25,
      estimatedDuration: '1-2 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Dhanmondi, Dhaka',
      technicianName: 'Hasan Mahmud',
      technicianEmail: 'tech.hasan@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      title: 'Commercial Multi-Unit AC Seasonal Maintenance',
      category: 'AC',
      description: 'Full inspection of commercial VRF and cassette AC systems, filter sanitization, amp load test, and thermostat regulation.',
      image: 'https://images.unsplash.com/photo-1527016021513-b09758b777bd?w=800&auto=format&fit=crop&q=80',
      basePrice: 120,
      estimatedDuration: '1 day',
      serviceMode: 'Home Visit',
      serviceArea: 'Dhanmondi, Dhaka',
      technicianName: 'Hasan Mahmud',
      technicianEmail: 'tech.hasan@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      title: 'Samsung Galaxy & Pixel Camera Lens & Battery Fix',
      category: 'Smartphone',
      description: 'Cracked rear camera glass replacement, swollen battery replacement, and USB Type-C charging port soldering.',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02597?w=800&auto=format&fit=crop&q=80',
      basePrice: 40,
      estimatedDuration: '1-2 hours',
      serviceMode: 'Shop Drop-off',
      serviceArea: 'Gulshan & Banani, Dhaka',
      technicianName: 'Tanvir Ahmed',
      technicianEmail: 'tech.tanvir@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      title: 'Side-by-Side Refrigerator Defrost Heater & Sensor',
      category: 'Refrigerator',
      description: 'Resolving excessive frost build-up in freezer, bi-metal defrost sensor replacement, drain tube clearing, and evaporator fan fix.',
      image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&auto=format&fit=crop&q=80',
      basePrice: 45,
      estimatedDuration: '2 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Dhanmondi, Dhaka',
      technicianName: 'Hasan Mahmud',
      technicianEmail: 'tech.hasan@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      title: 'Smart Washing Machine Main PCB Diagnostics',
      category: 'Washing Machine',
      description: 'Component-level repair of washing machine inverter controller boards, relay switches, and error code troubleshooting.',
      image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&auto=format&fit=crop&q=80',
      basePrice: 45,
      estimatedDuration: '1-2 days',
      serviceMode: 'Shop Drop-off',
      serviceArea: 'Gulshan & Banani, Dhaka',
      technicianName: 'Tanvir Ahmed',
      technicianEmail: 'tech.tanvir@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      title: 'OLED TV Sound Board & Main Motherboard Fix',
      category: 'TV',
      description: 'Restores audio output, optical sound synchronization, Wi-Fi module disconnection, and firmware boot loop debugging.',
      image: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&auto=format&fit=crop&q=80',
      basePrice: 60,
      estimatedDuration: '1 day',
      serviceMode: 'Home Visit',
      serviceArea: 'Dhanmondi, Dhaka',
      technicianName: 'Hasan Mahmud',
      technicianEmail: 'tech.hasan@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: now,
    },
    // 1 Pending service for Admin testing
    {
      _id: new ObjectId(),
      title: 'Custom Gaming PC Liquid Cooling Loop Installation',
      category: 'Laptop & PC',
      description: 'Hard tube and soft tube custom water loop bending, leak pressure testing, radiator flushing, and pump reservoir assembly.',
      image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80',
      basePrice: 95,
      estimatedDuration: '2 days',
      serviceMode: 'Shop Drop-off',
      serviceArea: 'Gulshan & Banani, Dhaka',
      technicianName: 'Tanvir Ahmed',
      technicianEmail: 'tech.tanvir@fixmate.com',
      approvalStatus: 'pending',
      isAvailable: true,
      createdAt: now,
    },
    // 1 Rejected service for Admin testing
    {
      _id: new ObjectId(),
      title: 'Unverified Microwave Magnetron Quick Hack',
      category: 'Electrical',
      description: 'Informal repair without safety compliance.',
      image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&auto=format&fit=crop&q=80',
      basePrice: 15,
      estimatedDuration: '30 mins',
      serviceMode: 'Shop Drop-off',
      serviceArea: 'Dhanmondi, Dhaka',
      technicianName: 'Hasan Mahmud',
      technicianEmail: 'tech.hasan@fixmate.com',
      approvalStatus: 'rejected',
      isAvailable: false,
      createdAt: now,
    },
  ];

  await db.collection('services').insertMany(services);
  console.log(`[Seeder] Seeded ${services.length} services (14 approved, 1 pending, 1 rejected)`);

  // 3. Bookings spanning different pipeline statuses for quick testing
  const s1 = services[0]; // iPhone Screen
  const s2 = services[2]; // AC Cleaning
  const s3 = services[3]; // Refrigerator
  const s4 = services[1]; // Laptop Motherboard
  const s5 = services[4]; // TV Backlight

  const bookings: BookingDoc[] = [
    // 1. Requested status (can be accepted/rejected by tech or cancelled by customer)
    {
      _id: new ObjectId(),
      serviceId: s1._id!.toString(),
      serviceTitle: s1.title,
      serviceImage: s1.image,
      category: s1.category,
      basePrice: s1.basePrice,
      technicianName: s1.technicianName,
      technicianEmail: s1.technicianEmail,
      customerName: 'Sarah Rahman',
      customerEmail: 'customer.sarah@fixmate.com',
      customerPhone: '+8801612345670',
      address: 'House 42, Road 11, Mirpur 10, Dhaka',
      preferredDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      problemDescription: 'My iPhone 13 display got cracked on the top right corner and touch is glitching.',
      status: 'requested',
      finalAmount: s1.basePrice,
      paymentStatus: 'unpaid',
      statusHistory: [
        {
          status: 'requested',
          changedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          changedBy: 'Sarah Rahman',
          note: 'Request created',
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    // 2. Accepted status (technician can click 'Start Work' -> in-progress)
    {
      _id: new ObjectId(),
      serviceId: s2._id!.toString(),
      serviceTitle: s2.title,
      serviceImage: s2.image,
      category: s2.category,
      basePrice: s2.basePrice,
      technicianName: s2.technicianName,
      technicianEmail: s2.technicianEmail,
      customerName: 'Sarah Rahman',
      customerEmail: 'customer.sarah@fixmate.com',
      customerPhone: '+8801612345670',
      address: 'House 42, Road 11, Mirpur 10, Dhaka',
      preferredDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
      problemDescription: 'AC is blowing room-temperature air and making slight rattling noise.',
      status: 'accepted',
      finalAmount: s2.basePrice,
      paymentStatus: 'unpaid',
      statusHistory: [
        {
          status: 'requested',
          changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
          changedBy: 'Sarah Rahman',
        },
        {
          status: 'accepted',
          changedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
          changedBy: 'Hasan Mahmud',
          note: 'Technician confirmed schedule',
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    // 3. In-Progress status (technician can click 'Mark Completed' & set finalAmount)
    {
      _id: new ObjectId(),
      serviceId: s4._id!.toString(),
      serviceTitle: s4.title,
      serviceImage: s4.image,
      category: s4.category,
      basePrice: s4.basePrice,
      technicianName: s4.technicianName,
      technicianEmail: s4.technicianEmail,
      customerName: 'Karim Chowdhury',
      customerEmail: 'customer.karim@fixmate.com',
      customerPhone: '+8801512345671',
      address: 'Apartment 5B, Sector 7, Uttara, Dhaka',
      preferredDate: new Date(),
      problemDescription: 'Laptop won’t turn on at all after sudden power surge last night.',
      status: 'in-progress',
      finalAmount: s4.basePrice,
      paymentStatus: 'unpaid',
      statusHistory: [
        {
          status: 'requested',
          changedAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
          changedBy: 'Karim Chowdhury',
        },
        {
          status: 'accepted',
          changedAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
          changedBy: 'Tanvir Ahmed',
        },
        {
          status: 'in-progress',
          changedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
          changedBy: 'Tanvir Ahmed',
          note: 'Motherboard IC diagnosed, component desoldering in progress',
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
    },
    // 4. Completed + Unpaid (READY FOR CUSTOMER TO PAY WITH STRIPE!)
    {
      _id: new ObjectId(),
      serviceId: s3._id!.toString(),
      serviceTitle: s3.title,
      serviceImage: s3.image,
      category: s3.category,
      basePrice: s3.basePrice,
      technicianName: s3.technicianName,
      technicianEmail: s3.technicianEmail,
      customerName: 'Sarah Rahman',
      customerEmail: 'customer.sarah@fixmate.com',
      customerPhone: '+8801612345670',
      address: 'House 42, Road 11, Mirpur 10, Dhaka',
      preferredDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      problemDescription: 'Refrigerator freezer is freezing ice but lower compartment is warm.',
      status: 'completed',
      finalAmount: 60, // set by technician with extra replacement part
      paymentStatus: 'unpaid',
      statusHistory: [
        {
          status: 'requested',
          changedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
          changedBy: 'Sarah Rahman',
        },
        {
          status: 'accepted',
          changedAt: new Date(Date.now() - 1000 * 60 * 60 * 30),
          changedBy: 'Hasan Mahmud',
        },
        {
          status: 'in-progress',
          changedAt: new Date(Date.now() - 1000 * 60 * 60 * 10),
          changedBy: 'Hasan Mahmud',
        },
        {
          status: 'completed',
          changedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          changedBy: 'Hasan Mahmud',
          note: 'Defrost timer replaced and gas line vacuum checked. Final amount set to $60',
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
    // 5. Completed + Paid (Already paid via Stripe with invoice and review)
    {
      _id: new ObjectId(),
      serviceId: s5._id!.toString(),
      serviceTitle: s5.title,
      serviceImage: s5.image,
      category: s5.category,
      basePrice: s5.basePrice,
      technicianName: s5.technicianName,
      technicianEmail: s5.technicianEmail,
      customerName: 'Karim Chowdhury',
      customerEmail: 'customer.karim@fixmate.com',
      customerPhone: '+8801512345671',
      address: 'Apartment 5B, Sector 7, Uttara, Dhaka',
      preferredDate: new Date(Date.now() - 1000 * 60 * 60 * 72),
      problemDescription: 'Sony 4K TV had dark backlight on the lower half of the screen.',
      status: 'completed',
      finalAmount: 55,
      paymentStatus: 'paid',
      rating: 5,
      review: 'Exceptional work by Hasan! TV picture looks brand new and he arrived promptly on time.',
      statusHistory: [
        {
          status: 'requested',
          changedAt: new Date(Date.now() - 1000 * 60 * 60 * 80),
          changedBy: 'Karim Chowdhury',
        },
        {
          status: 'accepted',
          changedAt: new Date(Date.now() - 1000 * 60 * 60 * 70),
          changedBy: 'Hasan Mahmud',
        },
        {
          status: 'in-progress',
          changedAt: new Date(Date.now() - 1000 * 60 * 60 * 60),
          changedBy: 'Hasan Mahmud',
        },
        {
          status: 'completed',
          changedAt: new Date(Date.now() - 1000 * 60 * 60 * 50),
          changedBy: 'Hasan Mahmud',
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 80),
    },
  ];

  await db.collection('bookings').insertMany(bookings);
  console.log(`[Seeder] Seeded ${bookings.length} bookings covering all status pipeline stages`);

  // 4. Payments
  const paidBooking = bookings[4];
  const payments: PaymentDoc[] = [
    {
      _id: new ObjectId(),
      bookingId: paidBooking._id!.toString(),
      serviceTitle: paidBooking.serviceTitle,
      customerName: paidBooking.customerName,
      customerEmail: paidBooking.customerEmail,
      technicianName: paidBooking.technicianName,
      technicianEmail: paidBooking.technicianEmail,
      amount: paidBooking.finalAmount,
      currency: 'usd',
      transactionId: 'pi_3MtwL2LkdIwHu7ix28a3tZ10',
      stripeSessionId: 'cs_test_b14seed_session_paid_001',
      paymentStatus: 'paid',
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
  ];

  await db.collection('payments').insertMany(payments);
  console.log(`[Seeder] Seeded ${payments.length} payment records`);

  console.log('--------------------------------------------------');
  console.log('[Seeder] Database seeding finished successfully! 🎉');
  console.log('Test Accounts:');
  console.log('  Admin:      admin@fixmate.com / Admin123!');
  console.log('  Technician: tech.hasan@fixmate.com / Tech123!');
  console.log('  Technician: tech.tanvir@fixmate.com / Tech123!');
  console.log('  Customer:   customer.sarah@fixmate.com / Cust123!');
  console.log('  Customer:   customer.karim@fixmate.com / Cust123!');
  console.log('--------------------------------------------------');

  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seeder] Error during seeding:', err);
  process.exit(1);
});

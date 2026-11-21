import { MongoClient, Db, Collection } from 'mongodb';
import { ENV } from './env.js';
import { UserDoc, ServiceDoc, BookingDoc, PaymentDoc } from '../types/index.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  try {
    client = new MongoClient(ENV.MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log(`[Database] Connected to MongoDB successfully (${db.databaseName})`);

    // Ensure indexes for fast lookups and unique constraints
    const usersCol = db.collection<UserDoc>('users');
    await usersCol.createIndex({ email: 1 }, { unique: true });

    const servicesCol = db.collection<ServiceDoc>('services');
    await servicesCol.createIndex({ approvalStatus: 1, isAvailable: 1, createdAt: -1 });
    await servicesCol.createIndex({ technicianEmail: 1 });
    await servicesCol.createIndex({ category: 1 });

    const bookingsCol = db.collection<BookingDoc>('bookings');
    await bookingsCol.createIndex({ customerEmail: 1 });
    await bookingsCol.createIndex({ technicianEmail: 1 });
    await bookingsCol.createIndex({ serviceId: 1, customerEmail: 1, status: 1 });

    const paymentsCol = db.collection<PaymentDoc>('payments');
    await paymentsCol.createIndex({ stripeSessionId: 1 }, { unique: true });
    await paymentsCol.createIndex({ bookingId: 1 });
    await paymentsCol.createIndex({ customerEmail: 1 });

    return db;
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    throw error;
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

export function getUsersCollection(): Collection<UserDoc> {
  return getDB().collection<UserDoc>('users');
}

export function getServicesCollection(): Collection<ServiceDoc> {
  return getDB().collection<ServiceDoc>('services');
}

export function getBookingsCollection(): Collection<BookingDoc> {
  return getDB().collection<BookingDoc>('bookings');
}

export function getPaymentsCollection(): Collection<PaymentDoc> {
  return getDB().collection<PaymentDoc>('payments');
}

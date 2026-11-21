import { ObjectId } from 'mongodb';

export type UserRole = 'customer' | 'technician' | 'admin';

export interface UserDoc {
  _id?: ObjectId;
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: UserRole;
  phone?: string;
  area?: string;
  bio?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export type ServiceCategory =
  | 'Smartphone'
  | 'Laptop & PC'
  | 'AC'
  | 'Refrigerator'
  | 'TV'
  | 'Washing Machine'
  | 'Electrical';

export type ServiceMode = 'Home Visit' | 'Shop Drop-off';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ServiceDoc {
  _id?: ObjectId;
  title: string;
  category: ServiceCategory;
  description: string;
  image: string;
  basePrice: number;
  estimatedDuration: string;
  serviceMode: ServiceMode;
  serviceArea: string;
  technicianName: string;
  technicianEmail: string;
  approvalStatus: ApprovalStatus;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export type BookingStatus =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid';

export interface StatusHistoryItem {
  status: BookingStatus;
  changedAt: Date;
  changedBy: string;
  note?: string;
}

export interface BookingDoc {
  _id?: ObjectId;
  serviceId: string;
  serviceTitle: string;
  serviceImage: string;
  category: ServiceCategory;
  basePrice: number;
  technicianName: string;
  technicianEmail: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  preferredDate: Date;
  problemDescription: string;
  status: BookingStatus;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  statusHistory?: StatusHistoryItem[];
  rating?: number;
  review?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PaymentDoc {
  _id?: ObjectId;
  bookingId: string;
  serviceTitle: string;
  customerName: string;
  customerEmail: string;
  technicianName: string;
  technicianEmail: string;
  amount: number;
  currency: 'usd';
  transactionId: string;
  stripeSessionId: string;
  paymentStatus: 'paid';
  paidAt: Date;
}

export interface AuthUserPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

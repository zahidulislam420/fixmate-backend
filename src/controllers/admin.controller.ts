import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import {
  getUsersCollection,
  getServicesCollection,
  getBookingsCollection,
  getPaymentsCollection,
} from '../config/db.js';
import { UserRole } from '../types/index.js';

// GET /api/admin/stats
export async function getAdminStats(_req: Request, res: Response): Promise<void> {
  try {
    const usersCol = getUsersCollection();
    const servicesCol = getServicesCollection();
    const bookingsCol = getBookingsCollection();
    const paymentsCol = getPaymentsCollection();

    const [
      totalUsers,
      totalTechnicians,
      pendingServices,
      totalBookings,
      revenueResult,
    ] = await Promise.all([
      usersCol.countDocuments(),
      usersCol.countDocuments({ role: 'technician' }),
      servicesCol.countDocuments({ approvalStatus: 'pending' }),
      bookingsCol.countDocuments(),
      paymentsCol
        .aggregate<{ totalRevenue: number }>([
          { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
        ])
        .toArray(),
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalTechnicians,
        pendingServices,
        totalBookings,
        totalRevenue,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
}

// GET /api/admin/users
export async function getAllUsers(_req: Request, res: Response): Promise<void> {
  try {
    const usersCol = getUsersCollection();
    const users = await usersCol
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => ({
        id: u._id?.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        image: u.image || '',
        phone: u.phone || '',
        area: u.area || '',
        bio: u.bio || '',
        createdAt: u.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
}

const updateRoleSchema = z.object({
  role: z.enum(['customer', 'technician', 'admin']),
});

// PATCH /api/admin/users/:id/role
// Rule: Admin can change a user's role. The admin cannot change their own role.
export async function updateUserRole(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }

    const parseResult = updateRoleSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: 'Role must be customer, technician, or admin' });
      return;
    }

    const { role: newRole } = parseResult.data;
    const usersCol = getUsersCollection();
    const targetUser = await usersCol.findOne({ _id: new ObjectId(id) });

    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Rule: The admin cannot change their own role
    if (targetUser.email === req.user.email) {
      res.status(400).json({
        success: false,
        message: 'Forbidden: Admins cannot change their own role',
      });
      return;
    }

    await usersCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role: newRole as UserRole, updatedAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: `User role updated to ${newRole}`,
      role: newRole,
    });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Failed to update user role' });
  }
}

// GET /api/admin/services
export async function getAdminServices(req: Request, res: Response): Promise<void> {
  try {
    const { approvalStatus } = req.query;
    const servicesCol = getServicesCollection();

    const query: any = {};
    if (typeof approvalStatus === 'string' && approvalStatus !== 'All') {
      query.approvalStatus = approvalStatus;
    }

    // Pending services shown first
    const services = await servicesCol
      .find(query)
      .sort({ approvalStatus: 1, createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error: any) {
    console.error('Error fetching admin services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
}

const approvalSchema = z.object({
  approvalStatus: z.enum(['approved', 'rejected']),
});

// PATCH /api/admin/services/:id/approval
export async function updateServiceApproval(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid service ID' });
      return;
    }

    const parseResult = approvalSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: 'Approval status must be approved or rejected' });
      return;
    }

    const { approvalStatus } = parseResult.data;
    const servicesCol = getServicesCollection();
    const service = await servicesCol.findOne({ _id: new ObjectId(id) });

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    await servicesCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { approvalStatus, updatedAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: `Service marked as ${approvalStatus}`,
      approvalStatus,
    });
  } catch (error: any) {
    console.error('Error updating service approval:', error);
    res.status(500).json({ success: false, message: 'Failed to update service approval status' });
  }
}

// GET /api/admin/bookings
export async function getAdminBookings(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    const bookingsCol = getBookingsCollection();

    const query: any = {};
    if (typeof status === 'string' && status !== 'All') {
      query.status = status;
    }

    const bookings = await bookingsCol.find(query).sort({ createdAt: -1 }).toArray();

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error: any) {
    console.error('Error fetching admin bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch platform bookings' });
  }
}

// GET /api/admin/payments (or /transactions)
export async function getAdminTransactions(_req: Request, res: Response): Promise<void> {
  try {
    const paymentsCol = getPaymentsCollection();
    const payments = await paymentsCol.find({}).sort({ paidAt: -1 }).toArray();

    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    res.status(200).json({
      success: true,
      count: payments.length,
      totalRevenue,
      payments,
    });
  } catch (error: any) {
    console.error('Error fetching admin transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
}

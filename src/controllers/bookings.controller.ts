import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getBookingsCollection, getServicesCollection } from '../config/db.js';
import { BookingDoc, BookingStatus, StatusHistoryItem } from '../types/index.js';

const createBookingSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  customerPhone: z.string().min(6, 'Valid contact number is required'),
  address: z.string().min(5, 'Service address must be at least 5 characters'),
  preferredDate: z.string().refine((val) => {
    const date = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !isNaN(date.getTime()) && date >= today;
  }, 'Preferred date must be today or a future date'),
  problemDescription: z
    .string()
    .min(20, 'Problem description must be at least 20 characters'),
});

// Customer: Create repair request (POST /api/bookings)
export async function createBooking(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (req.user.role !== 'customer') {
      res.status(403).json({
        success: false,
        message: 'Only customers can request a repair service',
      });
      return;
    }

    const parseResult = createBookingSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
        errors: parseResult.error.errors,
      });
      return;
    }

    const { serviceId, customerPhone, address, preferredDate, problemDescription } =
      parseResult.data;

    if (!ObjectId.isValid(serviceId)) {
      res.status(400).json({ success: false, message: 'Invalid service ID' });
      return;
    }

    const servicesCol = getServicesCollection();
    const service = await servicesCol.findOne({ _id: new ObjectId(serviceId) });

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    // Business rule: Technician cannot request their own service
    if (service.technicianEmail === req.user.email) {
      res.status(400).json({
        success: false,
        message: 'You cannot request your own service',
      });
      return;
    }

    const bookingsCol = getBookingsCollection();

    // Prevent duplicate active requests (requested, accepted, in-progress)
    const activeBooking = await bookingsCol.findOne({
      serviceId,
      customerEmail: req.user.email,
      status: { $in: ['requested', 'accepted', 'in-progress'] },
    });

    if (activeBooking) {
      res.status(400).json({
        success: false,
        message: 'You already have an active request for this service',
      });
      return;
    }

    const now = new Date();
    const initialStatusHistory: StatusHistoryItem[] = [
      {
        status: 'requested',
        changedAt: now,
        changedBy: req.user.name,
        note: 'Repair request submitted',
      },
    ];

    const newBooking: BookingDoc = {
      serviceId,
      serviceTitle: service.title,
      serviceImage: service.image,
      category: service.category,
      basePrice: service.basePrice,
      technicianName: service.technicianName,
      technicianEmail: service.technicianEmail,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: customerPhone.trim(),
      address: address.trim(),
      preferredDate: new Date(preferredDate),
      problemDescription: problemDescription.trim(),
      status: 'requested',
      finalAmount: service.basePrice,
      paymentStatus: 'unpaid',
      statusHistory: initialStatusHistory,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await bookingsCol.insertOne(newBooking);

    res.status(201).json({
      success: true,
      message: 'Repair request submitted successfully',
      booking: {
        _id: insertResult.insertedId,
        ...newBooking,
      },
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
}

// Customer: Get My Bookings (GET /api/bookings/my)
export async function getMyBookings(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const bookingsCol = getBookingsCollection();
    const bookings = await bookingsCol
      .find({ customerEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error: any) {
    console.error('Error fetching my bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
}

// Customer: Cancel Booking (PATCH /api/bookings/:id/cancel)
export async function cancelBooking(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid booking ID' });
      return;
    }

    const bookingsCol = getBookingsCollection();
    const booking = await bookingsCol.findOne({ _id: new ObjectId(id) });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Must be the owner of the booking
    if (booking.customerEmail !== req.user.email) {
      res.status(403).json({ success: false, message: 'Forbidden: Not your booking' });
      return;
    }

    // Rule: Can only cancel while still 'requested'
    if (booking.status !== 'requested') {
      res.status(400).json({
        success: false,
        message: `Cannot cancel a booking with status '${booking.status}'. Only 'requested' bookings can be cancelled.`,
      });
      return;
    }

    const now = new Date();
    const historyItem: StatusHistoryItem = {
      status: 'cancelled',
      changedAt: now,
      changedBy: req.user.name,
      note: 'Cancelled by customer',
    };

    await bookingsCol.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { status: 'cancelled', updatedAt: now },
        $push: { statusHistory: historyItem },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      status: 'cancelled',
    });
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
}

// Technician: Get Bookings (GET /api/bookings/technician)
export async function getTechnicianBookings(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { status } = req.query;
    const bookingsCol = getBookingsCollection();

    const query: any = { technicianEmail: req.user.email };
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
    console.error('Error fetching technician bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
}

const updateStatusSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'in-progress', 'completed']),
  finalAmount: z.number().positive().optional(),
});

// Challenge 3: Server-Enforced Job Status Pipeline & Payment Gate
// (PATCH /api/bookings/:id/status)
export async function updateBookingStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid booking ID' });
      return;
    }

    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
      return;
    }

    const { status: targetStatus, finalAmount } = parseResult.data;
    const bookingsCol = getBookingsCollection();
    const booking = await bookingsCol.findOne({ _id: new ObjectId(id) });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Rule: Only the technician who owns the job can update status
    if (booking.technicianEmail !== req.user.email) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the technician assigned to this job can update its status',
      });
      return;
    }

    // Strict Pipeline Validation
    const current = booking.status;
    let isValidTransition = false;

    if (current === 'requested' && (targetStatus === 'accepted' || targetStatus === 'rejected')) {
      isValidTransition = true;
    } else if (current === 'accepted' && targetStatus === 'in-progress') {
      isValidTransition = true;
    } else if (current === 'in-progress' && targetStatus === 'completed') {
      isValidTransition = true;
      if (!finalAmount || finalAmount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Completing a job requires a valid positive finalAmount',
        });
        return;
      }
    }

    if (!isValidTransition) {
      res.status(400).json({
        success: false,
        message: `Invalid status transition from '${current}' to '${targetStatus}'. Pipeline only permits: requested -> accepted/rejected, accepted -> in-progress, in-progress -> completed.`,
      });
      return;
    }

    const now = new Date();
    const updateDoc: any = {
      status: targetStatus,
      updatedAt: now,
    };

    if (targetStatus === 'completed' && finalAmount) {
      updateDoc.finalAmount = finalAmount;
    }

    const historyItem: StatusHistoryItem = {
      status: targetStatus,
      changedAt: now,
      changedBy: req.user.name,
      note: `Status updated to ${targetStatus}`,
    };

    await bookingsCol.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: updateDoc,
        $push: { statusHistory: historyItem },
      }
    );

    const updatedBooking = await bookingsCol.findOne({ _id: new ObjectId(id) });

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${targetStatus}`,
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
}

// Optional Feature: Review and Rating on Paid Bookings
export async function addBookingReview(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { rating, review } = req.body;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid booking ID' });
      return;
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
      return;
    }

    const bookingsCol = getBookingsCollection();
    const booking = await bookingsCol.findOne({ _id: new ObjectId(id) });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (booking.customerEmail !== req.user.email) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    if (booking.paymentStatus !== 'paid') {
      res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted after payment is completed',
      });
      return;
    }

    await bookingsCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { rating, review: review ? String(review).trim() : '', updatedAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: 'Review submitted successfully',
      rating,
      review,
    });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
}

import { Request, Response } from 'express';
import { ObjectId, Filter } from 'mongodb';
import { z } from 'zod';
import { getServicesCollection, getUsersCollection } from '../config/db.js';
import { ServiceDoc, ServiceCategory, ServiceMode } from '../types/index.js';

const validCategories: ServiceCategory[] = [
  'Smartphone',
  'Laptop & PC',
  'AC',
  'Refrigerator',
  'TV',
  'Washing Machine',
  'Electrical',
];

const validServiceModes: ServiceMode[] = ['Home Visit', 'Shop Drop-off'];

// Challenge 1: Server-Side Search, Filter & Sort on Browse Services
export async function getPublicServices(req: Request, res: Response): Promise<void> {
  try {
    const {
      search,
      category,
      serviceMode,
      sort,
      page = '1',
      limit = '12',
      featured,
    } = req.query;

    const servicesCol = getServicesCollection();

    // Base filter: only approved and available services are publicly visible
    const query: Filter<ServiceDoc> = {
      approvalStatus: 'approved',
      isAvailable: true,
    };

    // Server-side search by title or category (case-insensitive regex)
    if (typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { category: searchRegex }, { serviceArea: searchRegex }];
    }

    // Category filter
    if (typeof category === 'string' && category.trim() && category !== 'All') {
      query.category = category.trim() as ServiceCategory;
    }

    // Service Mode filter
    if (typeof serviceMode === 'string' && serviceMode.trim() && serviceMode !== 'All') {
      query.serviceMode = serviceMode.trim() as ServiceMode;
    }

    // Sorting logic
    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 }; // default: Newest
    if (sort === 'price_asc') {
      sortOptions = { basePrice: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { basePrice: -1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    // If featured=true (for Home page: 6 latest approved & available services)
    if (featured === 'true' || featured === '6') {
      const featuredServices = await servicesCol
        .find(query)
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

      res.status(200).json({
        success: true,
        count: featuredServices.length,
        services: featuredServices,
      });
      return;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [services, total] = await Promise.all([
      servicesCol.find(query).sort(sortOptions).skip(skip).limit(limitNum).toArray(),
      servicesCol.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      services,
    });
  } catch (error: any) {
    console.error('Error fetching public services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services', error: error.message });
  }
}

// Service Details Page (/services/:id)
export async function getServiceById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(404).json({ success: false, message: 'Invalid service ID' });
      return;
    }

    const servicesCol = getServicesCollection();
    const service = await servicesCol.findOne({ _id: new ObjectId(id) });

    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    // Fetch technician profile to include bio, area, image
    const usersCol = getUsersCollection();
    const technician = await usersCol.findOne(
      { email: service.technicianEmail },
      { projection: { password: 0 } }
    );

    res.status(200).json({
      success: true,
      service: {
        ...service,
        technician: technician
          ? {
              name: technician.name,
              email: technician.email,
              image: technician.image || '',
              area: technician.area || service.serviceArea,
              bio: technician.bio || 'Verified expert repair technician.',
            }
          : {
              name: service.technicianName,
              email: service.technicianEmail,
              image: '',
              area: service.serviceArea,
              bio: 'Verified technician.',
            },
      },
    });
  } catch (error: any) {
    console.error('Error fetching service by ID:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service details' });
  }
}

const createServiceSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  category: z.enum([
    'Smartphone',
    'Laptop & PC',
    'AC',
    'Refrigerator',
    'TV',
    'Washing Machine',
    'Electrical',
  ]),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  image: z.string().url('A valid image URL is required'),
  basePrice: z.number().positive('Base price must be a positive number'),
  estimatedDuration: z.string().min(2, 'Estimated duration is required'),
  serviceMode: z.enum(['Home Visit', 'Shop Drop-off']),
  serviceArea: z.string().min(3, 'Service area is required'),
});

// Technician: Add a service (POST /api/services)
export async function createService(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const parseResult = createServiceSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = parseResult.data;
    const servicesCol = getServicesCollection();
    const now = new Date();

    const newService: ServiceDoc = {
      title: data.title.trim(),
      category: data.category,
      description: data.description.trim(),
      image: data.image.trim(),
      basePrice: data.basePrice,
      estimatedDuration: data.estimatedDuration.trim(),
      serviceMode: data.serviceMode,
      serviceArea: data.serviceArea.trim(),
      technicianName: req.user.name,
      technicianEmail: req.user.email,
      approvalStatus: 'pending', // Always pending upon creation
      isAvailable: true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await servicesCol.insertOne(newService);

    res.status(201).json({
      success: true,
      message: 'Service created successfully and is pending admin approval',
      service: {
        _id: result.insertedId,
        ...newService,
      },
    });
  } catch (error: any) {
    console.error('Error creating service:', error);
    res.status(500).json({ success: false, message: 'Failed to create service' });
  }
}

// Technician: Get my services (GET /api/services/technician/my)
export async function getTechnicianServices(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const servicesCol = getServicesCollection();
    const services = await servicesCol
      .find({ technicianEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error: any) {
    console.error('Error fetching technician services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
}

// Technician: Update service (PATCH /api/services/:id)
// Rule: If a technician edits a service later, its approvalStatus goes back to 'pending'.
export async function updateService(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid service ID' });
      return;
    }

    const servicesCol = getServicesCollection();
    const existing = await servicesCol.findOne({ _id: new ObjectId(id) });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    if (existing.technicianEmail !== req.user.email) {
      res.status(403).json({ success: false, message: 'Forbidden: You can only edit your own services' });
      return;
    }

    const parseResult = createServiceSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
      return;
    }

    const data = parseResult.data;
    const updateDoc: Partial<ServiceDoc> = {
      updatedAt: new Date(),
      approvalStatus: 'pending', // Resets to pending upon edit!
    };

    if (data.title) updateDoc.title = data.title.trim();
    if (data.category) updateDoc.category = data.category;
    if (data.description) updateDoc.description = data.description.trim();
    if (data.image) updateDoc.image = data.image.trim();
    if (data.basePrice !== undefined) updateDoc.basePrice = data.basePrice;
    if (data.estimatedDuration) updateDoc.estimatedDuration = data.estimatedDuration.trim();
    if (data.serviceMode) updateDoc.serviceMode = data.serviceMode;
    if (data.serviceArea) updateDoc.serviceArea = data.serviceArea.trim();

    await servicesCol.updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });

    const updated = await servicesCol.findOne({ _id: new ObjectId(id) });

    res.status(200).json({
      success: true,
      message: 'Service updated and resubmitted for admin approval',
      service: updated,
    });
  } catch (error: any) {
    console.error('Error updating service:', error);
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
}

// Technician: Delete service (DELETE /api/services/:id)
export async function deleteService(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid service ID' });
      return;
    }

    const servicesCol = getServicesCollection();
    const existing = await servicesCol.findOne({ _id: new ObjectId(id) });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    if (existing.technicianEmail !== req.user.email && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden: You can only delete your own services' });
      return;
    }

    await servicesCol.deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
}

// Technician: Toggle Availability (PATCH /api/services/:id/availability)
export async function toggleServiceAvailability(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid service ID' });
      return;
    }

    const servicesCol = getServicesCollection();
    const existing = await servicesCol.findOne({ _id: new ObjectId(id) });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Service not found' });
      return;
    }

    if (existing.technicianEmail !== req.user.email) {
      res.status(403).json({ success: false, message: 'Forbidden: You can only modify your own services' });
      return;
    }

    const newAvailability = !existing.isAvailable;
    await servicesCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isAvailable: newAvailability, updatedAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: `Service is now ${newAvailability ? 'available' : 'unavailable'}`,
      isAvailable: newAvailability,
    });
  } catch (error: any) {
    console.error('Error toggling service availability:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle availability' });
  }
}

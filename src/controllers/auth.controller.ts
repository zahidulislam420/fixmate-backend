import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getUsersCollection } from '../config/db.js';
import { signToken } from '../utils/jwt.js';
import { UserDoc, UserRole } from '../types/index.js';

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter'),
  role: z.string().optional(),
});

export async function signUp(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = signUpSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
        errors: parseResult.error.errors,
      });
      return;
    }

    const { name, email, password, role: requestedRole } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Server-side role guard: only 'customer' or 'technician' allowed during sign-up
    let safeRole: UserRole = 'customer';
    if (requestedRole === 'technician') {
      safeRole = 'technician';
    }

    const usersCol = getUsersCollection();
    const existing = await usersCol.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    const newUser: UserDoc = {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: safeRole,
      image: '',
      phone: '',
      area: '',
      bio: '',
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await usersCol.insertOne(newUser);
    const userId = insertResult.insertedId.toString();

    const token = signToken({
      userId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      image: newUser.image,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        image: newUser.image,
        phone: newUser.phone,
        area: newUser.area,
        bio: newUser.bio,
      },
    });
  } catch (error: any) {
    console.error('Sign up error:', error);
    res.status(500).json({ success: false, message: 'Failed to sign up', error: error.message });
  }
}

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function signIn(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = signInSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
      return;
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const usersCol = getUsersCollection();
    const user = await usersCol.findOne({ email: normalizedEmail });

    if (!user || !user.password) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const userId = user._id?.toString() || '';
    const token = signToken({
      userId,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
    });

    res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || '',
        phone: user.phone || '',
        area: user.area || '',
        bio: user.bio || '',
      },
    });
  } catch (error: any) {
    console.error('Sign in error:', error);
    res.status(500).json({ success: false, message: 'Failed to sign in', error: error.message });
  }
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const usersCol = getUsersCollection();
    const user = await usersCol.findOne(
      { email: req.user.email },
      { projection: { password: 0 } }
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id?.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || '',
        phone: user.phone || '',
        area: user.area || '',
        bio: user.bio || '',
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  area: z.string().optional(),
  bio: z.string().optional(),
  image: z.string().optional(),
});

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
      return;
    }

    const { name, phone, area, bio, image } = parseResult.data;
    const usersCol = getUsersCollection();

    const updateFields: Partial<UserDoc> = {
      updatedAt: new Date(),
    };

    if (typeof name === 'string' && name.trim()) updateFields.name = name.trim();
    if (typeof phone === 'string') updateFields.phone = phone.trim();
    if (typeof area === 'string') updateFields.area = area.trim();
    if (typeof bio === 'string') updateFields.bio = bio.trim();
    if (typeof image === 'string') updateFields.image = image.trim();

    await usersCol.updateOne(
      { email: req.user.email },
      { $set: updateFields }
    );

    const updatedUser = await usersCol.findOne(
      { email: req.user.email },
      { projection: { password: 0 } }
    );

    if (!updatedUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Return new JWT with updated name and image so client keeps token in sync
    const newToken = signToken({
      userId: updatedUser._id?.toString() || '',
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      image: updatedUser.image,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      token: newToken,
      user: {
        id: updatedUser._id?.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        image: updatedUser.image || '',
        phone: updatedUser.phone || '',
        area: updatedUser.area || '',
        bio: updatedUser.bio || '',
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
}

import { NextResponse } from 'next/server';

// Library for hashing passwords securely
import bcrypt from 'bcryptjs';

// MongoDB connection helper
import dbConnect from '@/lib/mongodb';

// User model (Mongoose schema)
import User from '@/models/User';

// Shared API response type for consistent responses
import { ApiResponse } from '@/types';

/* =========================================================
   REGISTER USER API (POST /api/auth/register)
========================================================= */
export async function POST(req: Request) {
  try {

    // Extract request body (name, email, password)
    const { name, email, password } = await req.json();

    /* ---------------- VALIDATION: REQUIRED FIELDS ---------------- */
    if (!name || !email || !password) {
      const resBody: ApiResponse<null> = {
        success: false,
        error: 'All fields are required'
      };

      return NextResponse.json(resBody, { status: 400 });
    }

    /* ---------------- VALIDATION: PASSWORD LENGTH ---------------- */
    if (password.length < 6) {
      const resBody: ApiResponse<null> = {
        success: false,
        error: 'Password must be at least 6 characters long'
      };

      return NextResponse.json(resBody, { status: 400 });
    }

    /* ---------------- CONNECT TO DATABASE ---------------- */
    await dbConnect();

    /* ---------------- CHECK IF USER ALREADY EXISTS ---------------- */
    const existingUser = await User.findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      const resBody: ApiResponse<null> = {
        success: false,
        error: 'User already exists with this email'
      };

      return NextResponse.json(resBody, { status: 400 });
    }

    /* ---------------- HASH PASSWORD ---------------- */
    // bcrypt adds salt internally (10 rounds = balance of security/performance)
    const hashedPassword = await bcrypt.hash(password, 10);

    /* ---------------- CREATE NEW USER ---------------- */
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    /* ---------------- SUCCESS RESPONSE ---------------- */
    const resBody: ApiResponse<{
      id: string;
      name: string;
      email: string;
    }> = {
      success: true,
      data: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
      },
    };

    return NextResponse.json(resBody, { status: 201 });

  } catch (error: any) {
    // Log server-side error for debugging
    console.error('Registration error:', error);

    // Generic error response (avoid leaking internal details)
    const resBody: ApiResponse<null> = {
      success: false,
      error: 'Internal Server Error'
    };

    return NextResponse.json(resBody, { status: 500 });
  }
}
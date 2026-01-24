import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { signToken } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    await dbConnect();

    const adminEmail = 'admin@dsagrinders.com';
    const adminPassword = 'admin123';
    const adminName = 'Super Admin';
    const adminLeetcode = 'admin_user'; // Dummy LeetCode username

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Admin account already exists', email: adminEmail },
        { status: 200 }
      );
    }

    // Create admin user
    const adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      leetcodeUsername: adminLeetcode,
    });

    // Generate JWT token
    const token = signToken({ userId: adminUser._id.toString(), email: adminUser.email });

    return NextResponse.json({
      message: 'Admin account created successfully!',
      credentials: {
        email: adminEmail,
        password: adminPassword,
      },
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        leetcodeUsername: adminUser.leetcodeUsername,
      },
    });

  } catch (error: any) {
    console.error('Admin setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
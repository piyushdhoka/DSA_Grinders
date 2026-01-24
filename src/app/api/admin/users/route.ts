import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';

// Simple admin check - you can enhance this later
function isAdmin(user: any): boolean {
  // For now, check if email contains 'admin' or is a specific admin email
  // You can enhance this with a proper admin role system
  const adminEmails = [
    'admin@dsagrinders.com', // Updated admin email
    // Add more admin emails as needed
  ];
  
  return adminEmails.includes(user.email.toLowerCase()) || 
         user.email.toLowerCase().includes('admin');
}

export const GET = requireAuth(async (req, user) => {
  try {
    // Check if user is admin
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    // Get all users without passwords
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    const userStats = {
      total: users.length,
      withWhatsApp: users.filter(u => u.phoneNumber).length,
      withoutWhatsApp: users.filter(u => !u.phoneNumber).length,
    };

    return NextResponse.json({
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        leetcodeUsername: user.leetcodeUsername,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      })),
      stats: userStats,
    });
  } catch (error: any) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
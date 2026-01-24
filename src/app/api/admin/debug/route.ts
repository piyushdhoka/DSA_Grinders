import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { MessageTemplate } from '@/models/MessageTemplate';

// Simple admin check
function isAdmin(user: any): boolean {
  const adminEmails = [
    'admin@dsagrinders.com',
  ];
  
  return adminEmails.includes(user.email.toLowerCase());
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
    
    // Get all users (including admin for debugging)
    const allUsers = await User.find({}).select('-password');
    
    // Get non-admin users
    const adminEmails = ['admin@dsagrinders.com'];
    const regularUsers = await User.find({
      email: { $nin: adminEmails }
    }).select('-password');

    // Get templates
    const templates = await MessageTemplate.find({});

    // Environment check
    const envCheck = {
      SMTP_EMAIL: !!process.env.SMTP_EMAIL,
      SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      RPAY_API_KEY: !!process.env.RPAY_API_KEY,
      MONGODB_URI: !!process.env.MONGODB_URI,
    };

    return NextResponse.json({
      debug: {
        totalUsers: allUsers.length,
        regularUsers: regularUsers.length,
        adminUsers: allUsers.length - regularUsers.length,
        usersWithPhone: regularUsers.filter(u => u.phoneNumber && u.phoneNumber.trim()).length,
        templates: templates.length,
        environment: envCheck
      },
      users: regularUsers.map(u => ({
        name: u.name,
        email: u.email,
        leetcodeUsername: u.leetcodeUsername,
        hasPhone: !!u.phoneNumber,
        phonePreview: u.phoneNumber ? u.phoneNumber.substring(0, 5) + '***' : null
      })),
      templates: templates.map(t => ({
        id: t._id,
        type: t.type,
        name: t.name,
        isActive: t.isActive,
        hasContent: !!t.content,
        contentLength: t.content?.length || 0
      })),
      adminUser: {
        name: user.name,
        email: user.email
      }
    });

  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
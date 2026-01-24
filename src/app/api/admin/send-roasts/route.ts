import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { MessageTemplate } from '@/models/MessageTemplate';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import nodemailer from 'nodemailer';

// Simple admin check
function isAdmin(user: any): boolean {
  const adminEmails = [
    'admin@dsagrinders.com',
  ];
  
  return adminEmails.includes(user.email.toLowerCase());
}

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Fallback roasts and insults
const ROASTS = [
  "Learn DSA or you'll be delivering food your entire life!",
  "Hey slacker! Close Netflix, open LeetCode! Or stay jobless!",
  "Your friends are joining Google, you're still stuck on Two Sum!",
  "Don't know DSA? No worries, start a food truck business!",
  "Can't solve even one problem? Your luck is terrible dude!",
  "Can't reverse an array? Your life will reverse too!",
  "Bro who is this useless? Study a little bit!",
  "Your struggle story will go viral on LinkedIn... with rejections!",
  "During placement season, even HR will laugh at you!",
  "Don't understand recursion? You're an infinite loop yourself!",
  "Did nothing again today? Your productivity is worse than a pandemic!",
  "Does your resume only have WhatsApp forwarding experience?",
  "Came to be a DSA grinder, became a DSA disgrace!",
];

const INSULTS = [
  "Even low-tier companies will reject you!",
  "Your LeetCode streak makes coding itself cry!",
  "You're so slow, even a turtle would win the race!",
  "Bro you're so weak, can't even run a loop properly!",
  "Your code has so many bugs, you should open a pesticide company!",
];

function getRandomRoast() {
  return ROASTS[Math.floor(Math.random() * ROASTS.length)];
}

function getRandomInsult() {
  return INSULTS[Math.floor(Math.random() * INSULTS.length)];
}

// Replace template variables with actual values
function replaceTemplateVariables(content: string, user: any, roast?: string, insult?: string): string {
  return content
    .replace(/\{userName\}/g, user.name)
    .replace(/\{email\}/g, user.email)
    .replace(/\{leetcodeUsername\}/g, user.leetcodeUsername)
    .replace(/\{roast\}/g, roast || getRandomRoast())
    .replace(/\{insult\}/g, insult || getRandomInsult());
}

async function sendTemplatedEmail(user: any, template: any, roast: string, insult: string) {
  const subject = replaceTemplateVariables(template.subject || 'DSA Grinders - Daily Reminder', user, roast, insult);
  const content = replaceTemplateVariables(template.content, user, roast, insult);

  const mailOptions = {
    from: `"DSA Grinders Admin" <admin@dsagrinders.com>`,
    to: user.email,
    subject: subject,
    html: content,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

async function sendTemplatedWhatsApp(user: any, template: any, roast: string, insult: string) {
  const content = replaceTemplateVariables(template.content, user, roast, insult);
  
  try {
    const result = await sendWhatsAppMessage(user.phoneNumber, content);
    return result;
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
}

export const POST = requireAuth(async (req, user) => {
  try {
    // Check if user is admin
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    // Get active templates
    const whatsappTemplate = await MessageTemplate.findOne({ 
      type: 'whatsapp_roast', 
      isActive: true 
    });
    const emailTemplate = await MessageTemplate.findOne({ 
      type: 'email_roast', 
      isActive: true 
    });

    console.log(`Admin ${user.name} triggered manual roast sending - Templates:`, {
      whatsapp: !!whatsappTemplate,
      email: !!emailTemplate
    });
    
    // Get all non-admin users
    const adminEmails = ['admin@dsagrinders.com'];
    const users = await User.find({
      email: { $nin: adminEmails }
    }).select('-password');
    
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found' },
        { status: 400 }
      );
    }

    // Log user details for debugging
    console.log('Users to process:', users.map(u => ({
      name: u.name,
      email: u.email,
      hasPhone: !!u.phoneNumber,
      phone: u.phoneNumber ? u.phoneNumber.substring(0, 5) + '***' : 'none'
    })));

    const results = {
      emailsSent: 0,
      emailsFailed: 0,
      whatsappSent: 0,
      whatsappFailed: 0,
      whatsappSkipped: 0,
      errors: [] as string[],
    };

    // Generate random roast and insult for this batch
    const batchRoast = getRandomRoast();
    const batchInsult = getRandomInsult();

    console.log('Using batch roast:', batchRoast);
    console.log('Using batch insult:', batchInsult);

    // Send roasts to each user
    for (const targetUser of users) {
      console.log(`Processing user: ${targetUser.name} (${targetUser.email})`);
      
      // Send email roast using template
      try {
        if (emailTemplate) {
          console.log(`Sending templated email to ${targetUser.name}`);
          const emailResult = await sendTemplatedEmail(targetUser, emailTemplate, batchRoast, batchInsult);
          if (emailResult.success) {
            results.emailsSent++;
            console.log(`✅ Email sent successfully to ${targetUser.name}`);
          } else {
            results.emailsFailed++;
            results.errors.push(`Email failed for ${targetUser.name}: ${emailResult.error}`);
            console.log(`❌ Email failed for ${targetUser.name}: ${emailResult.error}`);
          }
        } else {
          console.log(`Using fallback email for ${targetUser.name}`);
          // Fallback to original email function
          const { sendDSAReminder } = await import('@/lib/email');
          const emailResult = await sendDSAReminder(targetUser.email, targetUser.name);
          if (emailResult.success) {
            results.emailsSent++;
            console.log(`✅ Fallback email sent successfully to ${targetUser.name}`);
          } else {
            results.emailsFailed++;
            results.errors.push(`Email failed for ${targetUser.name}: ${emailResult.error}`);
            console.log(`❌ Fallback email failed for ${targetUser.name}: ${emailResult.error}`);
          }
        }
      } catch (error: any) {
        results.emailsFailed++;
        results.errors.push(`Email failed for ${targetUser.name}: ${error.message}`);
        console.log(`❌ Email exception for ${targetUser.name}: ${error.message}`);
      }

      // Send WhatsApp roast using template (only if phone number exists)
      if (targetUser.phoneNumber && targetUser.phoneNumber.trim()) {
        console.log(`Attempting WhatsApp to ${targetUser.name} at ${targetUser.phoneNumber}`);
        try {
          if (whatsappTemplate) {
            console.log(`Using WhatsApp template for ${targetUser.name}`);
            const whatsappResult = await sendTemplatedWhatsApp(targetUser, whatsappTemplate, batchRoast, batchInsult);
            if (whatsappResult.success) {
              results.whatsappSent++;
              console.log(`✅ WhatsApp sent successfully to ${targetUser.name}`);
            } else {
              results.whatsappFailed++;
              results.errors.push(`WhatsApp failed for ${targetUser.name}: ${whatsappResult.error}`);
              console.log(`❌ WhatsApp failed for ${targetUser.name}: ${whatsappResult.error}`);
            }
          } else {
            console.log(`Using fallback WhatsApp for ${targetUser.name}`);
            // Fallback to original WhatsApp function
            const { sendDSAWhatsAppReminder } = await import('@/lib/whatsapp');
            const whatsappResult = await sendDSAWhatsAppReminder(targetUser.phoneNumber, targetUser.name);
            if (whatsappResult.success) {
              results.whatsappSent++;
              console.log(`✅ Fallback WhatsApp sent successfully to ${targetUser.name}`);
            } else {
              results.whatsappFailed++;
              results.errors.push(`WhatsApp failed for ${targetUser.name}: ${whatsappResult.error}`);
              console.log(`❌ Fallback WhatsApp failed for ${targetUser.name}: ${whatsappResult.error}`);
            }
          }
        } catch (error: any) {
          results.whatsappFailed++;
          results.errors.push(`WhatsApp failed for ${targetUser.name}: ${error.message}`);
          console.log(`❌ WhatsApp exception for ${targetUser.name}: ${error.message}`);
        }
      } else {
        results.whatsappSkipped++;
        console.log(`⏭️ WhatsApp skipped for ${targetUser.name} - no phone number`);
      }

      // Small delay to avoid overwhelming the APIs
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Create summary
    const summary = [];
    if (results.emailsSent > 0) summary.push(`${results.emailsSent} email roasts sent`);
    if (results.emailsFailed > 0) summary.push(`${results.emailsFailed} email roasts failed`);
    if (results.whatsappSent > 0) summary.push(`${results.whatsappSent} WhatsApp roasts sent`);
    if (results.whatsappFailed > 0) summary.push(`${results.whatsappFailed} WhatsApp roasts failed`);
    if (results.whatsappSkipped > 0) summary.push(`${results.whatsappSkipped} WhatsApp skipped (no phone)`);

    console.log('Manual roast sending completed:', summary.join(', '));
    console.log('Detailed results:', results);

    return NextResponse.json({
      success: true,
      results,
      summary: summary.join(', '),
      totalUsers: users.length,
      usersWithWhatsApp: users.filter(u => u.phoneNumber && u.phoneNumber.trim()).length,
      templatesUsed: {
        whatsapp: whatsappTemplate?.name || 'fallback',
        email: emailTemplate?.name || 'fallback'
      },
      debugInfo: {
        batchRoast,
        batchInsult,
        usersProcessed: users.map(u => ({
          name: u.name,
          hasPhone: !!u.phoneNumber
        }))
      }
    });

  } catch (error: any) {
    console.error('Admin send roasts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
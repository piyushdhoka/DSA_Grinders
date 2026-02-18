import { NextResponse } from 'next/server';

/**
 * Gets users who are in the current 30-minute time slot
 * This connects to the main app's database
 */
export async function GET() {
  try {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    const slotStart = minute < 30 ? 0 : 30;
    const slotEnd = slotStart + 30;

    const mockUsers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        dailyGrindTime: `${hour.toString().padStart(2, '0')}:${(slotStart + 15).toString().padStart(2, '0')}`,
        roastIntensity: 'medium' as const,
        phoneNumber: '+1234567890'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        dailyGrindTime: `${hour.toString().padStart(2, '0')}:${(slotStart + 10).toString().padStart(2, '0')}`,
        roastIntensity: 'savage' as const,
        phoneNumber: '+1987654321'
      }
    ];

    const usersInSlot = mockUsers.filter(user => {
      const [userHour, userMin] = user.dailyGrindTime.split(':').map(Number);
      return userHour === hour && userMin >= slotStart && userMin < slotEnd;
    });

    return NextResponse.json({
      success: true,
      users: usersInSlot,
      currentSlot: {
        hour,
        slotStart,
        slotEnd,
        label: `${hour.toString().padStart(2, '0')}:${slotStart.toString().padStart(2, '0')}-${slotEnd === 60 ? '00' : slotEnd.toString().padStart(2, '0')}`
      },
      totalUsers: usersInSlot.length
    });

  } catch (error) {
    console.error('Failed to get users in slot:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get users in current slot',
        users: []
      },
      { status: 500 }
    );
  }
}

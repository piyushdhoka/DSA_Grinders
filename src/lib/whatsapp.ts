const WHATSAPP_API_URL = 'https://rpayconnect.com/api/send-text';

const ROASTS = [
  "Learn DSA or you'll be delivering food your entire life! 🍕",
  "Hey slacker! Close Netflix, open LeetCode! Or stay jobless! 📺➡️💻",
  "Your friends are joining Google, you're still stuck on Two Sum! 🤦‍♂️",
  "Don't know DSA? No worries, start a food truck business! 🚚",
  "Can't solve even one problem? Your luck is terrible dude! 😤",
  "Can't reverse an array? Your life will reverse too! 🔄",
  "Bro who is this useless? Study a little bit! 📚",
  "Your struggle story will go viral on LinkedIn... with rejections! 💼",
  "During placement season, even HR will laugh at you! 😂",
  "Don't understand recursion? You're an infinite loop yourself! ♾️",
  "Did nothing again today? Your productivity is worse than a pandemic! 🦠",
  "Does your resume only have WhatsApp forwarding experience? 📱",
  "Came to be a DSA grinder, became a DSA disgrace! 💀",
  "Your coding skills are so bad, even ChatGPT refuses to help you! 🤖",
  "Still solving Easy problems? Even my grandma can do better! 👵",
  "Your LeetCode streak is as consistent as your excuses! 📉",
  "Bro, your algorithm knowledge is slower than Internet Explorer! 🐌",
  "Can't solve Medium problems? Time to switch to content creation! 📹",
  "Your debugging skills are like finding a needle in a haystack... blindfolded! 🔍",
  "Even Stack Overflow is tired of your basic questions! 📚"
];

const INSULTS = [
  "Even low-tier companies will reject you! 🚫",
  "Your LeetCode streak makes coding itself cry! 😭",
  "You're so slow, even a turtle would win the race! 🐢",
  "Bro you're so weak, can't even run a loop properly! 🔁",
  "Your code has so many bugs, you should open a pesticide company! 🐛",
  "Your problem-solving speed is slower than Windows 95! 💻",
  "You write code like you're still in 1999! 📼",
  "Your algorithms are more confused than a chameleon in a bag of Skittles! 🦎",
  "You debug code like you're defusing a bomb... badly! 💣",
  "Your coding logic has more holes than Swiss cheese! 🧀"
];

function getRandomRoast() {
  return ROASTS[Math.floor(Math.random() * ROASTS.length)];
}

function getRandomInsult() {
  return INSULTS[Math.floor(Math.random() * INSULTS.length)];
}

export async function sendDSAWhatsAppReminder(phoneNumber: string, userName: string) {
  const roast = getRandomRoast();
  const insult = getRandomInsult();

  const message = `🔥 *WAKE UP CALL FOR ${userName.toUpperCase()}* 🔥

*REALITY CHECK:*
${roast}

*HARSH TRUTH:* ${insult}

Listen up *${userName}*! �

While you're scrolling through WhatsApp, your competition is grinding LeetCode problems and getting closer to their dream jobs! �

⏰ *STOP MAKING EXCUSES!*
⏰ *STOP PROCRASTINATING!*
⏰ *START CODING NOW!*

🎯 *TODAY'S MISSION:*
• Solve at least 2 problems
• Focus on Medium difficulty
• Stop checking social media every 5 minutes!

🚀 *GET TO WORK:* https://leetcode.com/problemset/

*REMEMBER:* Every minute you waste is a minute your competition gets ahead! 

*NO EXCUSES. NO SHORTCUTS. JUST GRIND!* 💪

---
DSA Grinders - Where weak coders become strong! �`;

  const apiKey = process.env.RPAY_API_KEY;
  
  if (!apiKey) {
    console.error('RPAY_API_KEY environment variable is not set');
    return { success: false, error: 'WhatsApp API key is not configured' };
  }

  try {
    // Clean phone number - remove + and any spaces
    const cleanPhoneNumber = phoneNumber.replace(/[\+\s-]/g, '');
    
    // Build URL with query parameters as per documentation
    const url = new URL(WHATSAPP_API_URL);
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('number', cleanPhoneNumber);
    url.searchParams.append('msg', message);

    console.log('Sending WhatsApp GET request to:', url.toString().replace(apiKey, '***API_KEY***'));
    console.log('Clean phone number:', cleanPhoneNumber);
    console.log('Message preview:', message.substring(0, 100) + '...');

    const response = await fetch(url.toString(), {
      method: 'GET', // Changed to GET as per documentation
    });

    const data = await response.json();
    console.log('WhatsApp API response:', data);

    if (!response.ok) {
      console.error('WhatsApp API HTTP error:', response.status, data);
      throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(data)}`);
    }

    // Check if the API returned success: false
    if (data.status === false) {
      console.error('WhatsApp API returned error:', data);
      throw new Error(data.message || 'WhatsApp API returned an error');
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  const apiKey = process.env.RPAY_API_KEY;
  
  if (!apiKey) {
    console.error('RPAY_API_KEY environment variable is not set');
    return { success: false, error: 'WhatsApp API key is not configured' };
  }

  try {
    // Clean phone number - remove + and any spaces
    const cleanPhoneNumber = phoneNumber.replace(/[\+\s-]/g, '');
    
    // Build URL with query parameters as per documentation
    const url = new URL(WHATSAPP_API_URL);
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('number', cleanPhoneNumber);
    url.searchParams.append('msg', message);

    console.log('Sending WhatsApp GET request to:', url.toString().replace(apiKey, '***API_KEY***'));
    console.log('Clean phone number:', cleanPhoneNumber);
    console.log('Message preview:', message.substring(0, 100) + '...');

    const response = await fetch(url.toString(), {
      method: 'GET', // Changed to GET as per documentation
    });

    const data = await response.json();
    console.log('WhatsApp API response:', data);

    if (!response.ok) {
      console.error('WhatsApp API HTTP error:', response.status, data);
      throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(data)}`);
    }

    // Check if the API returned success: false
    if (data.status === false) {
      console.error('WhatsApp API returned error:', data);
      throw new Error(data.message || 'WhatsApp API returned an error');
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
}
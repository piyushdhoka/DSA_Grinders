import mongoose from 'mongoose';

export interface ISettings {
  _id: mongoose.Types.ObjectId;
  // Automation settings
  automationEnabled: boolean;
  emailAutomationEnabled: boolean;
  whatsappAutomationEnabled: boolean;
  
  // Scheduling - support multiple times per day
  emailSchedule: string[]; // Array of times: ["09:00", "13:00", "17:00", "21:00"]
  whatsappSchedule: string[]; // Array of times: ["09:30", "13:30", "17:30", "21:30"]
  timezone: string; // e.g., "Asia/Kolkata", "America/New_York"
  
  // Frequency settings
  maxDailyEmails: number; // Maximum emails per day
  maxDailyWhatsapp: number; // Maximum WhatsApp messages per day
  
  // Tracking
  emailsSentToday: number;
  whatsappSentToday: number;
  lastEmailSent: Date;
  lastWhatsappSent: Date;
  lastResetDate: Date; // For daily counter reset
  
  // Advanced settings
  skipWeekends: boolean;
  skipHolidays: boolean;
  customSkipDates: Date[]; // Specific dates to skip
  
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new mongoose.Schema({
  // Automation settings
  automationEnabled: { type: Boolean, default: true },
  emailAutomationEnabled: { type: Boolean, default: true },
  whatsappAutomationEnabled: { type: Boolean, default: true },
  
  // Scheduling - support multiple times per day
  emailSchedule: { type: [String], default: ["09:00"] }, // Default to 9:00 AM
  whatsappSchedule: { type: [String], default: ["09:30"] }, // Default to 9:30 AM
  timezone: { type: String, default: "Asia/Kolkata" },
  
  // Frequency settings
  maxDailyEmails: { type: Number, default: 1 },
  maxDailyWhatsapp: { type: Number, default: 1 },
  
  // Tracking
  emailsSentToday: { type: Number, default: 0 },
  whatsappSentToday: { type: Number, default: 0 },
  lastEmailSent: { type: Date, default: null },
  lastWhatsappSent: { type: Date, default: null },
  lastResetDate: { type: Date, default: Date.now },
  
  // Advanced settings
  skipWeekends: { type: Boolean, default: false },
  skipHolidays: { type: Boolean, default: false },
  customSkipDates: [{ type: Date }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure only one settings document exists
SettingsSchema.index({}, { unique: true });

// Update the updatedAt field on save
SettingsSchema.pre('save', function () {
  this.updatedAt = new Date();
});

export const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
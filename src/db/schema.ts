import { pgTable, varchar, text, boolean, integer, timestamp, serial, jsonb, uniqueIndex, index, primaryKey } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// ============================================================================
// USERS TABLE - Core user data (stats are in daily_stats, fetched live)
// ============================================================================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),

  // Platform usernames
  leetcodeUsername: varchar('leetcode_username', { length: 255 }).notNull().unique(),
  gfgUsername: varchar('gfg_username', { length: 255 }),

  // Social links
  github: varchar('github', { length: 255 }).notNull(),
  linkedin: varchar('linkedin', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 32 }),

  // App metadata
  role: varchar('role', { length: 16 }).notNull().default('user'),
  onboardingCompleted: boolean('onboarding_completed').default(false),

  // Messaging preferences
  roastIntensity: varchar('roast_intensity', { length: 16 }).default('medium'),
  dailyGrindTime: varchar('daily_grind_time', { length: 5 }), // HH:MM format like "09:30"

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('users_role_idx').on(table.role),
  index('users_gfg_username_idx').on(table.gfgUsername),
]);

// ============================================================================
// SETTINGS TABLE - Global application settings and automation state
// ============================================================================
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  automationEnabled: boolean('automation_enabled').default(true),
  emailAutomationEnabled: boolean('email_automation_enabled').default(true),
  whatsappAutomationEnabled: boolean('whatsapp_automation_enabled').default(true),
  emailSchedule: jsonb('email_schedule').default(['09:00']),
  whatsappSchedule: jsonb('whatsapp_schedule').default(['09:30']),
  timezone: varchar('timezone', { length: 64 }).default('Asia/Kolkata'),
  maxDailyEmails: integer('max_daily_emails').default(100),
  maxDailyWhatsapp: integer('max_daily_whatsapp').default(100),
  emailsSentToday: integer('emails_sent_today').default(0),
  whatsappSentToday: integer('whatsapp_sent_today').default(0),
  lastEmailSent: timestamp('last_email_sent', { withTimezone: true }),
  lastWhatsappSent: timestamp('last_whatsapp_sent', { withTimezone: true }),
  lastResetDate: timestamp('last_reset_date', { withTimezone: true }).defaultNow(),
  skipWeekends: boolean('skip_weekends').default(false),
  skipHolidays: boolean('skip_holidays').default(false),
  customSkipDates: jsonb('custom_skip_dates').default([]),
  aiRoast: jsonb('ai_roast'), // Stores { mild: {message, subject}, medium: {...}, savage: {...}, date }
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// MESSAGE_TEMPLATES TABLE - Customizable message content for automation
// ============================================================================
export const messageTemplates = pgTable('message_templates', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 32 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  content: text('content').notNull(),
  variables: jsonb('variables').default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('type_name_idx').on(table.type, table.name),
]);

// ============================================================================
// DAILY_STATS TABLE - Historical snapshots of user platform statistics
// ============================================================================
export const dailyStats = pgTable('daily_stats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 16 }).notNull(),
  platform: varchar('platform', { length: 16 }).notNull().default('leetcode'), // 'leetcode' or 'gfg'
  easy: integer('easy').default(0),
  medium: integer('medium').default(0),
  hard: integer('hard').default(0),
  total: integer('total').default(0),
  ranking: integer('ranking').default(0),
  avatar: varchar('avatar', { length: 512 }).default(''),
  country: varchar('country', { length: 64 }).default(''),
  streak: integer('streak').default(0),
  lastSubmission: varchar('last_submission', { length: 64 }),
  recentProblems: jsonb('recent_problems').default([]),
  previousTotal: integer('previous_total').default(0),
  todayPoints: integer('today_points').default(0),
}, (table) => [
  uniqueIndex('user_platform_date_idx').on(table.userId, table.platform, table.date),
  index('date_idx').on(table.date),
  index('user_id_idx').on(table.userId),
]);

// ============================================================================
// GROUPS TABLE - Competition groups with alphanumeric codes
// ============================================================================
export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 32 }).notNull().unique(), // Alphanumeric join code
  description: text('description'),
  owner: integer('owner').notNull().references(() => users.id), // FK to users
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('groups_code_idx').on(table.code),
  index('groups_owner_idx').on(table.owner),
]);

// ============================================================================
// GROUP_MEMBERS TABLE - Many-to-many join table for multi-group membership
// ============================================================================
export const groupMembers = pgTable('group_members', {
  groupId: integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.groupId, table.userId] }),
]);

// ============================================================================
// TYPE EXPORTS - For TypeScript inference
// ============================================================================
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Group = InferSelectModel<typeof groups>;
export type NewGroup = InferInsertModel<typeof groups>;
export type GroupMember = InferSelectModel<typeof groupMembers>;
export type NewGroupMember = InferInsertModel<typeof groupMembers>;
export type Setting = InferSelectModel<typeof settings>;
export type NewSetting = InferInsertModel<typeof settings>;
export type DailyStat = InferSelectModel<typeof dailyStats>;
export type NewDailyStat = InferInsertModel<typeof dailyStats>;
export type MessageTemplate = InferSelectModel<typeof messageTemplates>;
export type NewMessageTemplate = InferInsertModel<typeof messageTemplates>;

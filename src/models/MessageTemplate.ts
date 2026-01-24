import mongoose from 'mongoose';

const MessageTemplateSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['whatsapp_roast', 'email_roast', 'whatsapp_custom', 'email_custom'] 
  },
  name: { type: String, required: true },
  subject: { type: String }, // Only for email templates
  content: { type: String, required: true },
  variables: [{ type: String }], // Available variables like {userName}, {roast}, etc.
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure uniqueness of (type, name)
MessageTemplateSchema.index({ type: 1, name: 1 }, { unique: true });

export const MessageTemplate = mongoose.models.MessageTemplate || mongoose.model('MessageTemplate', MessageTemplateSchema);
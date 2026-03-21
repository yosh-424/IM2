/**
 * Database Models
 * Defines the structure of MongoDB collections
 */

import mongoose from 'mongoose';

// College Schema
const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    code: {
      type: String,
      unique: true,
      required: true,
    },
  },
  { timestamps: true }
);

// Visitor Schema
const visitorSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      match: /.+\@.+\..+/,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    studentNumber: {
      type: String,
      default: null,
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
    },
    visitPurpose: {
      type: String,
      default: 'General Visit',
    },
    totalVisits: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isEmployee: {
      type: Boolean,
      default: false,
      comment: 'True if visitor is a teacher or staff member',
    },
    blocked: {
      type: Boolean,
      default: false,
      comment: 'True if visitor is blocked from checking in',
    },
    blockedReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Visit Log Schema
const visitLogSchema = new mongoose.Schema(
  {
    visitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Visitor',
      required: true,
    },
    email: {
      type: String,
      required: true,
      comment: 'Visitor email',
    },
    studentNumber: {
      type: String,
      default: null,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    checkInTime: {
      type: Date,
      required: true,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: null,
      comment: 'Duration in minutes',
    },
    date: {
      type: String,
      required: true,
    },
    week: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    college: {
      type: String,
      required: true,
    },
    visitPurpose: {
      type: String,
      default: 'General Visit',
    },
    isEmployee: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Admin Email Schema - stores authorized admin emails
const adminEmailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    addedBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Staff Email Schema - stores staff/faculty emails that skip profile setup
const staffEmailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    addedBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Create models
export const College = mongoose.model('College', collegeSchema);
export const Visitor = mongoose.model('Visitor', visitorSchema);
export const VisitLog = mongoose.model('VisitLog', visitLogSchema);
export const AdminEmail = mongoose.model('AdminEmail', adminEmailSchema);
export const StaffEmail = mongoose.model('StaffEmail', staffEmailSchema);

export const defineModels = () => {
  return { College, Visitor, VisitLog, AdminEmail, StaffEmail };
};

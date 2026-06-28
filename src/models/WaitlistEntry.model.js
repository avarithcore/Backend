
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const WaitlistEntrySchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required, BABI!'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address, GOBLOK!']
  },
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters, MEMEK!']
  },
  source: {
    type: String,
    default: 'landing',
    enum: ['landing', 'referral', 'social', 'other'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'invited', 'unsubscribed'],
    default: 'pending',
    index: true
  },
  verificationToken: {
    type: String,
    unique: true,
    default: () => uuidv4()
  },
  verifiedAt: {
    type: Date
  },
  invitedAt: {
    type: Date
  },
  unsubscribedAt: {
    type: Date
  },
  metadata: {
    ip: String,
    userAgent: String,
    referer: String
  }
}, {
  timestamps: true, // otomatis createdAt & updatedAt, KONTOL!
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index untuk mempercepat query, BANGSAT!
WaitlistEntrySchema.index({ email: 1 });
WaitlistEntrySchema.index({ status: 1, createdAt: -1 });

// Virtual field untuk umur pendaftaran, GOBLOK!
WaitlistEntrySchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method untuk menandai sebagai terverifikasi, MEMEK!
WaitlistEntrySchema.methods.verify = function() {
  this.status = 'verified';
  this.verifiedAt = new Date();
  return this.save();
};

// Method untuk menandai sebagai diundang, KONTOL!
WaitlistEntrySchema.methods.invite = function() {
  this.status = 'invited';
  this.invitedAt = new Date();
  return this.save();
};

// Method untuk unsubscribe, BANGSAT!
WaitlistEntrySchema.methods.unsubscribe = function() {
  this.status = 'unsubscribed';
  this.unsubscribedAt = new Date();
  return this.save();
};

// Static method untuk mencari berdasarkan token, GOBLOK!
WaitlistEntrySchema.statics.findByToken = function(token) {
  return this.findOne({ verificationToken: token });
};

module.exports = mongoose.model('WaitlistEntry', WaitlistEntrySchema);

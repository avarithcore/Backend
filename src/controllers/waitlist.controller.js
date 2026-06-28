
const WaitlistEntry = require('../models/WaitlistEntry.model');
const { sendVerificationEmail } = require('../services/email.service');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const xss = require('xss');

/**
 * Registrasi email baru
 * POST /api/waitlist/register
 */
exports.register = async (req, res, next) => {
  try {
    // Validasi input dari middleware express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(e => e.msg)
      });
    }

    // Sanitasi input dengan XSS, GOBLOK!
    const email = xss(req.body.email.trim().toLowerCase());
    const name = req.body.name ? xss(req.body.name.trim()) : undefined;
    const source = req.body.source || 'landing';

    // Cek apakah email sudah terdaftar
    const existing = await WaitlistEntry.findOne({ email });
    if (existing) {
      // Jika sudah terdaftar dan belum diverifikasi, kirim ulang email
      if (existing.status === 'pending') {
        await sendVerificationEmail(
          email,
          existing.name,
          existing.verificationToken,
          process.env.FRONTEND_URL || 'http://localhost:3000'
        );
        return res.status(200).json({
          success: true,
          message: 'Email already registered. A new verification email has been sent, KONTOL!',
          data: { email, status: existing.status }
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Email already registered and verified, BABI!',
        data: { email, status: existing.status }
      });
    }

    // Buat entri baru
    const newEntry = new WaitlistEntry({
      email,
      name,
      source,
      metadata: {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'] || req.headers['origin']
      }
    });

    await newEntry.save();
    logger.info(`📝 New waitlist entry: ${email}`);

    // Kirim email verifikasi
    try {
      await sendVerificationEmail(
        email,
        name,
        newEntry.verificationToken,
        process.env.FRONTEND_URL || 'http://localhost:3000'
      );
    } catch (emailError) {
      // Jika email gagal, tetap simpan data tapi log error
      logger.error(`⚠️ Failed to send verification email for ${email}: ${emailError.message}`);
      // Kita tetap return sukses dengan peringatan
      return res.status(201).json({
        success: true,
        message: 'Registered successfully, but verification email could not be sent. Please contact support, GOBLOK!',
        data: { email, status: newEntry.status }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify, KONTOL!',
      data: { email, status: newEntry.status }
    });

  } catch (error) {
    logger.error(`❌ Register error: ${error.message}`);
    next(error);
  }
};

/**
 * Verifikasi email via token
 * GET /api/waitlist/verify/:token
 */
exports.verify = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required, BABI!'
      });
    }

    const entry = await WaitlistEntry.findOne({ verificationToken: token });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired token, GOBLOK!'
      });
    }

    if (entry.status === 'verified') {
      return res.status(200).json({
        success: true,
        message: 'Email already verified, MEMEK!',
        data: { email: entry.email, status: entry.status }
      });
    }

    // Verifikasi entry
    await entry.verify();
    logger.info(`✅ Email verified: ${entry.email}`);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully, KONTOL! Welcome to Avarith.',
      data: { email: entry.email, status: entry.status }
    });

  } catch (error) {
    logger.error(`❌ Verify error: ${error.message}`);
    next(error);
  }
};

/**
 * Cek status email
 * GET /api/waitlist/status/:email
 */
exports.status = async (req, res, next) => {
  try {
    const email = xss(req.params.email.trim().toLowerCase());

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required, BANGSAT!'
      });
    }

    const entry = await WaitlistEntry.findOne({ email });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in waitlist, GOBLOK!'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        email: entry.email,
        status: entry.status,
        registeredAt: entry.createdAt,
        verifiedAt: entry.verifiedAt
      }
    });

  } catch (error) {
    logger.error(`❌ Status error: ${error.message}`);
    next(error);
  }
};

/**
 * Export data waitlist (hanya admin)
 * GET /api/waitlist/export
 */
exports.export = async (req, res, next) => {
  try {
    // TODO: Implementasi autentikasi admin, KONTOL!
    // Untuk sekarang, kita asumsikan sudah lolos auth

    const entries = await WaitlistEntry.find({})
      .select('email name status source createdAt verifiedAt invitedAt')
      .sort({ createdAt: -1 });

    // Convert ke CSV sederhana
    let csv = 'Email,Name,Status,Source,Registered,Verified,Invited\n';
    entries.forEach(e => {
      csv += `${e.email},${e.name || ''},${e.status},${e.source},${e.createdAt.toISOString()},${e.verifiedAt ? e.verifiedAt.toISOString() : ''},${e.invitedAt ? e.invitedAt.toISOString() : ''}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=waitlist-export.csv');
    res.status(200).send(csv);

  } catch (error) {
    logger.error(`❌ Export error: ${error.message}`);
    next(error);
  }
};

/**
 * Hapus entri waitlist (admin)
 * DELETE /api/waitlist/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const entry = await WaitlistEntry.findByIdAndDelete(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found, GOBLOK!'
      });
    }

    logger.info(`🗑️ Deleted waitlist entry: ${entry.email}`);
    res.status(200).json({
      success: true,
      message: 'Entry deleted successfully, KONTOL!'
    });

  } catch (error) {
    logger.error(`❌ Delete error: ${error.message}`);
    next(error);
  }
};

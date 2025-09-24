import * as nodemailer from 'nodemailer';
import { logger } from './logger';

// Create a transporter for development (using Gmail SMTP)
const createTransporter = () => {
  // For development, we'll use Gmail SMTP
  // In production, you'd want to use a proper email service like SendGrid, Mailgun, etc.
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password (not regular password)
    }
  });
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@syncscript.com',
      to: email,
      subject: 'SyncScript - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">SyncScript</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">AI-Powered Life Management</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #666; line-height: 1.6;">
              You requested a password reset for your SyncScript account. Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold;
                        display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>Security Note:</strong> This link will expire in 10 minutes for your security. 
                If you didn't request this password reset, please ignore this email.
              </p>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; margin: 0; font-size: 12px;">
              © 2024 SyncScript. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info('Password reset email sent successfully', { email });
    
  } catch (error) {
    logger.error('Failed to send password reset email', { 
      email, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw new Error('Failed to send password reset email');
  }
};

export const sendEmailVerificationEmail = async (email: string, verificationToken: string) => {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@syncscript.com',
      to: email,
      subject: 'SyncScript - Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">SyncScript</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">AI-Powered Life Management</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Welcome to SyncScript!</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for creating an account with SyncScript. To complete your registration, 
              please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold;
                        display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #0c5460; margin: 0; font-size: 14px;">
                <strong>Note:</strong> This verification link will expire in 24 hours. 
                If you didn't create an account with SyncScript, please ignore this email.
              </p>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; margin: 0; font-size: 12px;">
              © 2024 SyncScript. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    logger.info('Email verification email sent successfully', { email });
    
  } catch (error) {
    logger.error('Failed to send email verification email', { 
      email, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw new Error('Failed to send email verification email');
  }
};

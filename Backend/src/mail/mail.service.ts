import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendOtp(email: string, otp: string) {
    const mailOptions = {
      from: `"Resume Portal" <${process.env.SMTP_USER || 'noreply@resumeportal.com'}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP for verification is: ${otp}. It is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>OTP Verification</h2>
          <p>Your OTP for verification is: <strong>${otp}</strong></p>
          <p>It is valid for 10 minutes. Please do not share this code with anyone.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP sent successfully to ${email}`);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      // In production, we might want to throw or handle this
    }
  }
}

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!user || !pass) {
      this.logger.warn(
        'SMTP_USER or SMTP_PASSWORD is not configured. Email service will run in log-fallback mode.',
      );
      return;
    }

    const isSecure = port === 465;
    const cleanPass = pass.replace(/\s+/g, '');
    // this.transporter = nodemailer.createTransport({
    //   host: 'smtp.gmail.com',
    //   port: 587,
    //   secure: false,
    //   auth: {
    //     user: user,
    //     pass: cleanPass,
    //   },
    // });
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        user,
        pass: cleanPass,
      },
    });

    // Lazy verification check on startup
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error(
          `SMTP Transporter verification failed (${host}:${port}): ${error.message}. ` +
          `Check your SMTP credentials, App Password, or firewall settings.`,
        );
      } else {
        this.logger.log(`SMTP Transporter initialized successfully (${host}:${port})`);
      }
    });
  }

  async sendOtp(email: string, otp: string): Promise<boolean> {
    const fromAddress =
      process.env.SMTP_FROM ||
      `"TopTalent Cloud" <${process.env.SMTP_USER || 'noreply@toptalent.cloud'}>`;

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TopTalent Cloud - Email Verification</title>
      </head>
      <body style="margin:0; padding:0; background-color:#0b0f19; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0b0f19; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width:520px; background-color:#111827; border:1px solid #1f2937; border-radius:16px; overflow:hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
                    <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.5px;">TopTalent Cloud</h1>
                    <p style="margin:6px 0 0; color:#e0e7ff; font-size:13px; font-weight:500;">Next-Gen Candidate & Resume Intelligence</p>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 32px; text-align: left;">
                    <h2 style="margin:0 0 12px; color:#f9fafb; font-size:20px; font-weight:600;">Verify Your Email Address</h2>
                    <p style="margin:0 0 24px; color:#9ca3af; font-size:14px; line-height:1.6;">
                      Use the 6-digit verification code below to verify your email address and continue accessing <strong>TopTalent Cloud</strong>.
                    </p>

                    <!-- OTP Box -->
                    <div style="background-color:#1f2937; border:1px solid #374151; border-radius:12px; padding:20px; text-align:center; margin-bottom:24px;">
                      <span style="font-size:36px; font-weight:800; letter-spacing:8px; color:#818cf8; font-family:'Courier New', monospace; display:inline-block;">${otp}</span>
                    </div>

                    <p style="margin:0 0 8px; color:#6b7280; font-size:13px; text-align:center;">
                      ⏱️ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
                    </p>
                    <p style="margin:0; color:#4b5563; font-size:12px; text-align:center;">
                      If you did not initiate this request, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; background-color:#0f172a; border-top:1px solid #1e293b; text-align:center; color:#4b5563; font-size:12px;">
                    &copy; ${new Date().getFullYear()} TopTalent Cloud (toptalent.cloud). All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const textTemplate = `TopTalent Cloud Verification Code\n\nYour OTP code is: ${otp}\nIt expires in 10 minutes.\n\nIf you did not request this code, please ignore this email.`;

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: `[TopTalent Cloud] ${otp} is your verification code`,
      text: textTemplate,
      html: htmlTemplate,
    };

    // 1. Check for Resend API HTTP fallback first
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'TopTalent Cloud <onboarding@resend.dev>',
            to: [email],
            subject: mailOptions.subject,
            html: htmlTemplate,
            text: textTemplate,
          }),
        });

        if (res.ok) {
          this.logger.log(`OTP email sent successfully via Resend API to ${email}`);
          return true;
        }

        const errorData = await res.json();
        this.logger.error(`Resend API error: ${JSON.stringify(errorData)}`);
      } catch (err) {
        this.logger.error(`Resend API request failed: ${err.message}`);
      }
    }

    // 2. Fallback to Nodemailer SMTP Transporter
    if (!this.transporter) {
      this.logger.warn(`[DEV LOG] SMTP credentials not set. OTP for ${email} is: ${otp}`);
      return true;
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP email sent successfully to ${email}. MessageId: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to deliver OTP email to ${email}: ${error.message || error}`);

      // In local development, fallback gracefully by printing OTP to console so dev testing is never blocked
      if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_FALLBACK === 'true') {
        this.logger.warn(
          `\n=================================================================\n` +
          `[DEV MODE OTP FALLBACK] SMTP delivery failed due to invalid credentials.\n` +
          `Email: ${email}\n` +
          `OTP Code: ${otp}\n` +
          `=================================================================\n`
        );
        return true;
      }

      throw new InternalServerErrorException(
        `Failed to send email OTP: ${error.message || 'SMTP delivery failed'}. Please check SMTP credentials or try again later.`,
      );
    }
  }
}


import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Production-grade email service using Resend.
 *
 * Falls back to console logging in development when RESEND_API_KEY is not set.
 * In production, emails are sent via the Resend API.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly fromAddress: string;
  private readonly fromName: string;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('email.resendApiKey') || '';
    this.fromAddress =
      this.configService.get<string>('email.fromAddress') || 'noreply@exploremy.ai';
    this.fromName =
      this.configService.get<string>('email.fromName') || 'ExploreMY';
    this.isProduction =
      this.configService.get<string>('app.nodeEnv') === 'production';

    if (!this.apiKey && this.isProduction) {
      this.logger.error(
        'RESEND_API_KEY is not set! Emails will not be sent in production.',
      );
    }
  }

  /**
   * Send a verification email with a token link.
   */
  async sendVerificationEmail(
    to: string,
    token: string,
  ): Promise<{ sent: boolean; id?: string }> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    return this.send({
      to,
      subject: 'Verify your ExploreMY account',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #315B43; margin: 0; font-size: 24px;">ExploreMY 🧭</h1>
          </div>
          <h2 style="color: #171717; font-size: 20px; margin-bottom: 16px;">Welcome to ExploreMY!</h2>
          <p style="color: #6F6F6F; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Please verify your email address to start discovering Malaysia. Click the button below to confirm your account.
          </p>
          <a href="${verificationUrl}"
             style="display: inline-block; background: #315B43; color: white; padding: 14px 32px; border-radius: 999px;
                    text-decoration: none; font-weight: 600; font-size: 16px;">
            Verify Email
          </a>
          <p style="color: #9E9E9E; font-size: 13px; margin-top: 24px;">
            If you didn't create an ExploreMY account, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #E8EDE4; margin: 24px 0;" />
          <p style="color: #9E9E9E; font-size: 12px; text-align: center;">
            ExploreMY · Discover Malaysia Like Never Before
          </p>
        </div>
      `,
    });
  }

  /**
   * Send a password reset email with a token link.
   */
  async sendPasswordResetEmail(
    to: string,
    token: string,
  ): Promise<{ sent: boolean; id?: string }> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    return this.send({
      to,
      subject: 'Reset your ExploreMY password',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #315B43; margin: 0; font-size: 24px;">ExploreMY 🧭</h1>
          </div>
          <h2 style="color: #171717; font-size: 20px; margin-bottom: 16px;">Password Reset Request</h2>
          <p style="color: #6F6F6F; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            You requested a password reset. Click the button below to choose a new password. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #315B43; color: white; padding: 14px 32px; border-radius: 999px;
                    text-decoration: none; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
          <p style="color: #9E9E9E; font-size: 13px; margin-top: 24px;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #E8EDE4; margin: 24px 0;" />
          <p style="color: #9E9E9E; font-size: 12px; text-align: center;">
            ExploreMY · Discover Malaysia Like Never Before
          </p>
        </div>
      `,
    });
  }

  /**
   * Send a welcome email after successful registration.
   */
  async sendWelcomeEmail(
    to: string,
    displayName: string,
  ): Promise<{ sent: boolean; id?: string }> {
    return this.send({
      to,
      subject: 'Welcome to ExploreMY! 🇲🇾',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 20px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #315B43; margin: 0; font-size: 24px;">ExploreMY 🧭</h1>
          </div>
          <h2 style="color: #171717; font-size: 20px; margin-bottom: 16px;">Welcome, ${displayName}!</h2>
          <p style="color: #6F6F6F; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Your AI-powered travel companion is ready. Start planning weekend getaways, discovering hidden gems, and exploring Malaysia like never before.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/explore"
             style="display: inline-block; background: #315B43; color: white; padding: 14px 32px; border-radius: 999px;
                    text-decoration: none; font-weight: 600; font-size: 16px;">
            Start Exploring
          </a>
          <hr style="border: none; border-top: 1px solid #E8EDE4; margin: 24px 0;" />
          <p style="color: #9E9E9E; font-size: 12px; text-align: center;">
            ExploreMY · Discover Malaysia Like Never Before
          </p>
        </div>
      `,
    });
  }

  /**
   * Core send method. Uses Resend API in production, console logs in development.
   */
  private async send(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<{ sent: boolean; id?: string }> {
    if (!this.apiKey) {
      this.logger.warn(
        `[DEV] Email would be sent to: ${params.to} — Subject: "${params.subject}"`,
      );
      if (!this.isProduction) {
        this.logger.debug(`[DEV] Email body preview: ${params.html.slice(0, 200)}...`);
      }
      return { sent: false };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromAddress}>`,
          to: [params.to],
          subject: params.subject,
          html: params.html,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        this.logger.error(
          `Failed to send email to ${params.to}: ${response.status} ${response.statusText}`,
          (error as Record<string, unknown>).message,
        );
        return { sent: false };
      }

      const data = await response.json() as { id: string };
      this.logger.log(`Email sent to ${params.to}: ${data.id}`);
      return { sent: true, id: data.id };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${params.to}: ${(error as Error).message}`,
      );
      return { sent: false };
    }
  }
}

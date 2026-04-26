import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;
  private readonly enabled: boolean;

  constructor(private config: ConfigService) {
    const apiKey = config.get<string>('SENDGRID_API_KEY');
    this.from = config.get<string>('EMAIL_FROM', 'noreply@worksafe.io');
    if (apiKey && apiKey !== 'your-sendgrid-api-key') {
      sgMail.setApiKey(apiKey);
      this.enabled = true;
    } else {
      this.enabled = false;
      this.logger.warn('SendGrid API key not set — emails will be logged only');
    }
  }

  async sendPasswordReset(to: string, name: string, resetUrl: string) {
    await this.send({
      to,
      subject: 'Reset your WorkSafe password',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#0e95e7">Reset your password</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your WorkSafe password. Click the button below — this link expires in 24 hours.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#0e95e7;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Reset password
          </a>
          <p style="color:#6b7280;font-size:13px">If you didn't request this, ignore this email — your password won't change.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#9ca3af;font-size:12px">WorkSafe · Occupational Health Platform</p>
        </div>`,
    });
  }

  async sendInvite(to: string, orgName: string, role: string, inviteUrl: string, invitedBy?: string) {
    const roleLabel = role.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    await this.send({
      to,
      subject: `You've been invited to WorkSafe — ${orgName}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#0e95e7">You're invited to WorkSafe</h2>
          <p>${invitedBy ? `<strong>${invitedBy}</strong> has invited you` : 'You have been invited'} to join <strong>${orgName}</strong> as <strong>${roleLabel}</strong>.</p>
          <p>WorkSafe is an occupational health platform that helps prevent workplace musculoskeletal injuries.</p>
          <a href="${inviteUrl}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#0e95e7;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Accept invitation
          </a>
          <p style="color:#6b7280;font-size:13px">This invite expires in 7 days. If you weren't expecting this, you can safely ignore it.</p>
        </div>`,
    });
  }

  async sendWelcome(to: string, name: string) {
    await this.send({
      to,
      subject: 'Welcome to WorkSafe',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#0e95e7">Welcome to WorkSafe, ${name}!</h2>
          <p>Your account is ready. Complete your daily check-ins, follow your exercise programs, and stay on top of your occupational health.</p>
          <p style="color:#6b7280;font-size:13px">If you have any questions, contact your organization administrator.</p>
        </div>`,
    });
  }

  async sendMfaCode(to: string, name: string, code: string) {
    await this.send({
      to,
      subject: `Your WorkSafe verification code: ${code}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#0e95e7">Two-factor verification</h2>
          <p>Hi ${name}, your one-time code is:</p>
          <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0e95e7;margin:20px 0">${code}</div>
          <p style="color:#6b7280;font-size:13px">This code expires in 30 seconds. Never share it with anyone.</p>
        </div>`,
    });
  }

  private async send(msg: { to: string; subject: string; html: string }) {
    if (!this.enabled) {
      this.logger.log(`[EMAIL → ${msg.to}] ${msg.subject}`);
      return;
    }
    try {
      await sgMail.send({ from: this.from, ...msg });
    } catch (err) {
      this.logger.error(`Failed to send email to ${msg.to}`, err);
    }
  }
}

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendPasswordResetEmail(to: string, otp: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Your BalanceBuddy password reset OTP",
    html: `<p>Your password reset OTP is:</p>
           <h2 style="letter-spacing:4px">${otp}</h2>
           <p>It expires in 10 minutes. Do not share it with anyone.</p>`,
  });
}

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Verify your BalanceBuddy email",
    html: `<p>Click the link below to verify your email. It expires in 24 hours.</p>
           <a href="${verifyUrl}">${verifyUrl}</a>`,
  });
}

export async function sendInviteEmail(
  to: string,
  flatName: string,
  inviteUrl: string,
  senderName: string
) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `${senderName} invited you to join ${flatName} on BalanceBuddy`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="margin-bottom:8px">You're invited! 🏠</h2>
        <p style="color:#555"><strong>${senderName}</strong> has invited you to join <strong>${flatName}</strong> on BalanceBuddy.</p>
        <a href="${inviteUrl}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#6d28d9;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Accept Invite
        </a>
        <p style="color:#888;font-size:12px">Or copy this link: ${inviteUrl}</p>
        <p style="color:#bbb;font-size:11px">If you weren't expecting this, you can ignore this email.</p>
      </div>
    `,
  });
}

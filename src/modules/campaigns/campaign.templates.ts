import type { ButtonType, CampaignChannel, CampaignTemplateType } from "../../models";

export interface CampaignTemplate {
  id: string;
  templateType: CampaignTemplateType;
  title: string;
  badge: string;
  description: string;
  body: string;
  isActive: boolean;
  header?: string;
  subject?: string;
  previewText?: string;
  fromEmail?: string;
  footer?: string;
  shortUrl?: string;
  otpCode?: string;
  securityNote?: string;
  bannerIncluded?: boolean;
  bannerType?: string;
  bannerImageUrl?: string;
  buttonLabel?: string;
  buttonType?: ButtonType;
  buttonUrl?: string;
}

const OFFER_IMAGE = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80";

/** Pre-approved message templates shown in the dashboard (ported from feature/practice). */
export const PRE_APPROVED_TEMPLATES: Record<CampaignChannel, CampaignTemplate[]> = {
  sms: [
    {
      id: "sms-promo",
      templateType: "promotion",
      title: "Promotion",
      badge: "20% OFF",
      description: "Special offer discount with trackable short link",
      body: "Enjoy 20% OFF on select items at Company. This limited-time offer is valid until 30 Nov 2026. {link}",
      shortUrl: "https://yourbrand.in/s/x7Qa",
      isActive: true,
    },
    {
      id: "sms-otp",
      templateType: "otp",
      title: "OTP Code",
      badge: "546372",
      description: "Company authentication verification code",
      body: "Your Company verification code is {code}. Valid for 10 minutes. Do not share this code with anyone.",
      otpCode: "546372",
      securityNote: "Company authentication verification code",
      isActive: false,
    },
    {
      id: "sms-welcome",
      templateType: "welcome",
      title: "Welcome",
      badge: "10% OFF",
      description: "Onboarding welcome coupon with store link",
      body: "Welcome to Company! Enjoy 10% off on your first purchase using coupon code WELCOME10. Explore here: {link}",
      shortUrl: "https://yourbrand.in/store",
      isActive: false,
    },
  ],
  gmail: [
    {
      id: "gmail-promo",
      templateType: "promotion",
      title: "Promotion",
      badge: "20% OFF",
      description: "Special offer email with visual banner & Shop now CTA",
      fromEmail: "offers@yourbrand.in",
      subject: "{name}, enjoy 20% OFF – limited time only",
      previewText: "Enjoy 20% OFF on select items at Company. Limited time offer.",
      body: "Hi {name},\n\nEnjoy 20% OFF on select items at Company. This limited-time offer is valid until 30 Nov 2026.",
      bannerIncluded: true,
      bannerType: "special_offer",
      bannerImageUrl: OFFER_IMAGE,
      buttonLabel: "Shop now",
      buttonUrl: "https://yourbrand.in/s/x7Qa",
      footer: "You received this because you opted in. Unsubscribe",
      isActive: true,
    },
    {
      id: "gmail-otp",
      templateType: "otp",
      title: "OTP Code",
      badge: "546372",
      description: "Security verification code with high-contrast digits",
      fromEmail: "security@yourbrand.in",
      subject: "Security Verification Code: {code}",
      previewText: "Your one-time verification code is {code}",
      body: "Hello {name},\n\nYour security verification code is: {code}\n\nThis verification code expires in 10 minutes. If you did not request this, please contact support immediately.",
      otpCode: "546372",
      securityNote: "Security verification code with high-contrast digits",
      bannerIncluded: false,
      footer: "This is an automated security notice. Do not reply to this email.",
      isActive: false,
    },
    {
      id: "gmail-welcome",
      templateType: "welcome",
      title: "Welcome",
      badge: "10% OFF",
      description: "Customer onboarding with welcome discount code",
      fromEmail: "welcome@yourbrand.in",
      subject: "Welcome to Company, {name}!",
      previewText: "Claim your 10% onboarding discount inside",
      body: "Hi {name},\n\nWelcome to Company! We are thrilled to have you onboard. As a welcome gift, take 10% off your first purchase using code: WELCOME10.",
      bannerIncluded: true,
      bannerType: "welcome",
      buttonLabel: "Explore Store",
      buttonUrl: "https://yourbrand.in/store",
      footer: "You received this because you opted in. Unsubscribe",
      isActive: false,
    },
  ],
  whatsapp: [
    {
      id: "whatsapp-promo",
      templateType: "promotion",
      title: "Promotion",
      badge: "20% OFF",
      description: "Interactive WhatsApp message with offer banner & link",
      header: "Special Offer 🎉",
      body: "Hi {name}! Enjoy *20% OFF* on select items at Company. Valid until 30 Nov 2026.",
      footer: "Reply STOP to unsubscribe",
      bannerIncluded: true,
      bannerImageUrl: OFFER_IMAGE,
      buttonLabel: "Shop Now 🛍️",
      buttonType: "url",
      buttonUrl: "https://yourbrand.in/s/x7Qa",
      isActive: true,
    },
    {
      id: "whatsapp-otp",
      templateType: "otp",
      title: "OTP Code",
      badge: "546372",
      description: "Authentication verification code message",
      header: "Security Verification",
      body: "Your Company verification code is *{code}*. Valid for 10 minutes. For security, never share this code.",
      footer: "Company Security Team",
      otpCode: "546372",
      buttonLabel: "Copy Code",
      buttonType: "copy_code",
      isActive: false,
    },
    {
      id: "whatsapp-welcome",
      templateType: "welcome",
      title: "Welcome",
      badge: "10% OFF",
      description: "Onboarding welcome message with store link",
      header: "Welcome to Company! 👋",
      body: "Hi {name}! Welcome to the family. Use coupon *WELCOME10* for 10% off your initial order.",
      footer: "Explore our newest catalog",
      buttonLabel: "View Catalog",
      buttonType: "url",
      buttonUrl: "https://yourbrand.in/store",
      isActive: false,
    },
  ],
};

export const getTemplatesByChannel = (channel: string): CampaignTemplate[] =>
  PRE_APPROVED_TEMPLATES[channel.toLowerCase().trim() as CampaignChannel] ?? PRE_APPROVED_TEMPLATES.sms;

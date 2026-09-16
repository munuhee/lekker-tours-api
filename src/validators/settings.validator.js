import { z } from 'zod';

const ctaSchema = z.object({
  label: z.string().trim().max(60).optional(),
  href: z.string().trim().max(200).optional(),
});

export const updateSettingsSchema = z.object({
  hero: z
    .object({
      title: z.string().trim().max(160).optional(),
      subtitle: z.string().trim().max(400).optional(),
      backgroundImage: z
        .object({ url: z.string().optional(), alt: z.string().optional() })
        .optional(),
      primaryCta: ctaSchema.optional(),
      secondaryCta: ctaSchema.optional(),
    })
    .optional(),

  values: z
    .array(
      z.object({
        title: z.string().trim().max(80),
        description: z.string().trim().max(400),
        icon: z.string().trim().max(40).optional(),
      })
    )
    .optional(),

  contact: z
    .object({
      phone: z.string().trim().max(40).optional(),
      whatsapp: z.string().trim().max(40).optional(),
      email: z.string().trim().max(160).optional(),
      addressLine: z.string().trim().max(200).optional(),
      poBox: z.string().trim().max(80).optional(),
      city: z.string().trim().max(120).optional(),
      supportHours: z.string().trim().max(120).optional(),
    })
    .optional(),

  socials: z
    .object({
      facebook: z.string().trim().max(200).optional(),
      instagram: z.string().trim().max(200).optional(),
      x: z.string().trim().max(200).optional(),
      youtube: z.string().trim().max(200).optional(),
      tiktok: z.string().trim().max(200).optional(),
    })
    .optional(),

  newsletter: z
    .object({
      heading: z.string().trim().max(120).optional(),
      blurb: z.string().trim().max(400).optional(),
    })
    .optional(),

  footerBlurb: z.string().trim().max(600).optional(),

  // A YouTube ID, not a URL: the homepage builds the embed src from it. Pasting
  // a full watch URL is the obvious mistake, so reject anything outside the
  // 11-character ID alphabet and say what was expected. Empty clears the video.
  video: z
    .object({
      youtubeId: z
        .string()
        .trim()
        .regex(
          /^[A-Za-z0-9_-]{11}$/,
          'Enter the 11-character YouTube video ID (the v= part of the URL), not the whole link.'
        )
        .or(z.literal(''))
        .optional(),
    })
    .optional(),

  seo: z
    .object({
      defaultTitle: z.string().trim().max(70).optional(),
      defaultDescription: z.string().trim().max(200).optional(),
      ogImage: z.string().trim().optional(),
    })
    .optional(),
});

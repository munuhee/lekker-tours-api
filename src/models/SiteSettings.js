import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Singleton document holding everything the landing page renders that is not a
 * content collection — hero copy, the values strip, the contact block, socials.
 * Enforced as a singleton by an immutable unique `key`.
 */
const siteSettingsSchema = new Schema(
  {
    key: { type: String, default: 'primary', unique: true, immutable: true },

    hero: {
      title: { type: String, trim: true, default: 'Feel the Pulse of the African Wilderness' },
      subtitle: {
        type: String,
        trim: true,
        default:
          'Expertly curated expeditions from the heart of Nairobi to the legendary golden plains.',
      },
      backgroundImage: {
        url: { type: String, trim: true, default: '/images/mara-wildebeest-migration.jpg' },
        alt: { type: String, trim: true, default: 'Wildebeest crossing the Maasai Mara plains' },
      },
      primaryCta: {
        label: { type: String, trim: true, default: 'Explore Expeditions' },
        href: { type: String, trim: true, default: '/tours' },
      },
      secondaryCta: {
        label: { type: String, trim: true, default: 'Plan My Trip' },
        href: { type: String, trim: true, default: '/contact' },
      },
    },

    values: [
      {
        _id: false,
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        icon: { type: String, trim: true },
      },
    ],

    contact: {
      phone: { type: String, trim: true, default: '+254 100 201 950' },
      whatsapp: { type: String, trim: true, default: '+254 100 201 950' },
      email: { type: String, trim: true, default: 'lekkertours@gmail.com' },
      addressLine: { type: String, trim: true, default: 'Agip House, Haile Selassie Avenue' },
      poBox: { type: String, trim: true, default: 'P.O Box 13689-00200' },
      city: { type: String, trim: true, default: 'Nairobi, Kenya' },
      supportHours: { type: String, trim: true, default: '24/7 Global Service' },
    },

    socials: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      x: { type: String, trim: true },
      youtube: { type: String, trim: true },
      tiktok: { type: String, trim: true },
    },

    newsletter: {
      heading: { type: String, trim: true, default: 'Stories from the bush' },
      blurb: {
        type: String,
        trim: true,
        default: 'Occasional dispatches on wildlife, seasons and new expeditions. No noise.',
      },
    },

    footerBlurb: {
      type: String,
      trim: true,
      default:
        'Bringing the pulse of the African wilderness to life through expertly curated expeditions. Based in Nairobi, serving East Africa with excellence.',
    },

    seo: {
      defaultTitle: { type: String, trim: true, default: 'Lekker Tours and Travel' },
      defaultDescription: {
        type: String,
        trim: true,
        default:
          'Expertly curated safari expeditions and weekend escapes across East Africa, from our base in Nairobi.',
      },
      ogImage: { type: String, trim: true, default: '/images/mara-elephant-savanna.jpg' },
    },
  },
  { timestamps: true }
);

/** Always returns the one settings document, creating it with defaults if absent. */
siteSettingsSchema.statics.getSingleton = async function () {
  const existing = await this.findOne({ key: 'primary' });
  if (existing) return existing;
  return this.create({ key: 'primary' });
};

export const SiteSettings = model('SiteSettings', siteSettingsSchema);

/**
 * Default content for the site-settings singleton.
 *
 * These lived as `default:` on the Mongoose schema, which applied them field by
 * field. Postgres JSON columns have no such mechanism, so the defaults live
 * here and are applied in two places: when the singleton row is first created,
 * and when a PATCH arrives for a section that has never been saved.
 */
export const SITE_SETTINGS_DEFAULTS = {
  hero: {
    title: 'Feel the Pulse of the African Wilderness',
    subtitle:
      'Expertly curated expeditions from the heart of Nairobi to the legendary golden plains.',
    backgroundImage: {
      url: '/images/mara-wildebeest-migration.jpg',
      alt: 'Wildebeest crossing the Maasai Mara plains',
    },
    primaryCta: { label: 'Explore Expeditions', href: '/tours' },
    secondaryCta: { label: 'Plan My Trip', href: '/contact' },
  },

  values: [],

  contact: {
    phone: '+254 705 356 161',
    whatsapp: '+254 705 356 161',
    email: 'lekkertours@gmail.com',
    addressLine: 'Agip House, Haile Selassie Avenue',
    poBox: 'P.O Box 13689-00200',
    city: 'Nairobi, Kenya',
    supportHours: 'We aim to respond to enquiries as quickly as practical',
  },

  socials: {},

  newsletter: {
    heading: 'Stories from the bush',
    blurb: 'Occasional dispatches on wildlife, seasons and new expeditions. No noise.',
  },

  footerBlurb:
    'Bringing the pulse of the African wilderness to life through expertly curated expeditions. Based in Nairobi, serving East Africa with excellence.',

  // Empty by default: the homepage renders a placeholder until an admin sets a
  // real video, rather than shipping someone else's footage as Lekker's own.
  video: {},

  seo: {
    defaultTitle: 'Lekker Tours and Travel',
    defaultDescription:
      'Expertly curated safari expeditions and weekend escapes across East Africa, from our base in Nairobi.',
    ogImage: '/images/mara-elephant-savanna.jpg',
  },
};

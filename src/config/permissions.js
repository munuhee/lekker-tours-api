/**
 * The permission vocabulary.
 *
 * Every admin route is gated by one of these strings. They are grouped by
 * resource for the role editor's benefit — the UI renders a section per group
 * and a checkbox per permission, so adding one here makes it appear there with
 * no further work.
 *
 * `publish` is deliberately separate from `edit`: the common request is a
 * writer who may draft and revise but may not put anything in front of the
 * public. Splitting those is the whole reason this system exists rather than
 * the old admin/editor pair.
 */

/** Resources that share the same five-verb shape. */
const CONTENT_RESOURCES = [
  { key: 'tours', label: 'Tours' },
  { key: 'destinations', label: 'Destinations' },
  { key: 'blog', label: 'Blog posts' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'faqs', label: 'FAQs' },
];

const CONTENT_VERBS = [
  { verb: 'view', label: 'View', hint: 'See the list and open records, including drafts.' },
  { verb: 'create', label: 'Create', hint: 'Add new records.' },
  { verb: 'edit', label: 'Edit', hint: 'Change existing records.' },
  { verb: 'publish', label: 'Publish', hint: 'Move between draft and published.' },
  { verb: 'delete', label: 'Delete', hint: 'Permanently remove records.' },
];

const contentGroups = CONTENT_RESOURCES.map(({ key, label }) => ({
  key,
  label,
  permissions: CONTENT_VERBS.map(({ verb, label: verbLabel, hint }) => ({
    key: `${key}.${verb}`,
    label: verbLabel,
    hint,
  })),
}));

export const PERMISSION_GROUPS = [
  ...contentGroups,
  {
    key: 'enquiries',
    label: 'Enquiries',
    permissions: [
      { key: 'enquiries.view', label: 'View', hint: 'Read enquiries and customer contact details.' },
      {
        key: 'enquiries.edit',
        label: 'Triage',
        hint: 'Move an enquiry through the pipeline, claim unassigned ones, and add notes.',
      },
      {
        key: 'enquiries.assign',
        label: 'Assign to others',
        hint: 'Hand an enquiry to another member of staff. Claiming unassigned work needs only Triage.',
      },
      { key: 'enquiries.delete', label: 'Delete', hint: 'Permanently remove enquiries.' },
    ],
  },
  {
    key: 'media',
    label: 'Media',
    permissions: [
      { key: 'media.upload', label: 'Upload', hint: 'Add images to content.' },
      { key: 'media.delete', label: 'Delete', hint: 'Remove uploaded files from the server.' },
    ],
  },
  {
    key: 'settings',
    label: 'Site settings',
    permissions: [
      {
        key: 'settings.edit',
        label: 'Edit settings',
        hint: 'Contact details, hero, values and SEO — affects every public page.',
      },
    ],
  },
  {
    key: 'users',
    label: 'Users and roles',
    permissions: [
      { key: 'users.view', label: 'View users', hint: 'See the list of dashboard accounts.' },
      { key: 'users.manage', label: 'Manage users', hint: 'Invite, edit and remove accounts.' },
      {
        key: 'roles.manage',
        label: 'Manage roles',
        hint: 'Create roles and change what they may do. Effectively grants everything.',
      },
      { key: 'audit.view', label: 'View audit log', hint: 'See who changed access and when.' },
    ],
  },
];

/** Flat list of every valid permission string. */
export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((p) => p.key)
);

const PERMISSION_SET = new Set(ALL_PERMISSIONS);

export function isPermission(value) {
  return PERMISSION_SET.has(value);
}

/**
 * Seeded on first run. `Administrator` is marked locked: it always holds every
 * permission, including ones added by a later release, and the UI refuses to
 * edit or delete it. Without that, a deploy that introduces a permission would
 * silently leave the owner unable to use the new feature.
 */
export const SYSTEM_ROLES = [
  {
    name: 'Administrator',
    description: 'Full access to everything, including users, roles and site settings.',
    locked: true,
    permissions: ALL_PERMISSIONS,
  },
  {
    name: 'Editor',
    description: 'Creates, edits, publishes and deletes all content. No access to users or settings.',
    locked: false,
    permissions: [
      ...contentGroups.flatMap((g) => g.permissions.map((p) => p.key)),
      'enquiries.view',
      'enquiries.edit',
      'media.upload',
      'media.delete',
    ],
  },
  {
    name: 'Author',
    description: 'Writes and edits content but cannot publish or delete it.',
    locked: false,
    permissions: [
      ...contentGroups.flatMap((g) =>
        g.permissions
          .filter((p) => !p.key.endsWith('.publish') && !p.key.endsWith('.delete'))
          .map((p) => p.key)
      ),
      'media.upload',
    ],
  },
  {
    name: 'Enquiries',
    description: 'Handles incoming enquiries only. Sees no content editing.',
    locked: false,
    permissions: ['enquiries.view', 'enquiries.edit', 'enquiries.assign'],
  },
];

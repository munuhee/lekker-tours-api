/**
 * FAQs, testimonials, blog posts and site settings.
 *
 * Contact details, taglines, the company values and the footer blurb are taken
 * from lekkertours.com. Everything else — FAQ answers, testimonials, blog
 * articles — is written for this site.
 *
 * NOTE ON TESTIMONIALS: these are illustrative examples showing how real
 * reviews will render. They are NOT real customers. Replace them with genuine,
 * attributable reviews before launch — publishing invented testimonials as
 * real would mislead customers.
 */

const img = (file, alt) => ({ url: `/images/${file}`, alt });

export const faqs = [
  {
    question: 'When is the best time to go on safari in East Africa?',
    answer:
      'The dry seasons — late June to October, and January to February — concentrate wildlife around shrinking water sources and make tracks easier to drive. The Great Migration reaches the Mara River between July and October, while calving on the southern Serengeti peaks in February. That said, the green season from March to May is beautiful, far quieter and noticeably cheaper, and the wildlife does not leave.',
    group: 'travel',
    order: 1,
    status: 'published',
  },
  {
    question: 'Will I definitely see the Big Five?',
    answer:
      'On a trip of four days or more across the right parks, most of our guests see four of the five comfortably. Leopard is the one we never promise — they are solitary, nocturnal and genuinely elusive. Rhino requires being in a park that has them, such as Nakuru, Ol Pejeta or the Ngorongoro Crater, which is why we build them into our longer itineraries. Any operator guaranteeing all five is overpromising.',
    group: 'travel',
    order: 2,
    status: 'published',
  },
  {
    question: 'How far in advance should I book?',
    answer:
      'For travel in the July to October high season, three to six months ahead is sensible — the best camps fill early. Gorilla permits in Uganda and Rwanda are strictly limited in number and should be secured six months ahead where possible. For green season travel, six to eight weeks is usually enough.',
    group: 'booking',
    order: 1,
    status: 'published',
  },
  {
    question: 'What is included in the price?',
    answer:
      'Every quoted price covers your professional driver-guide, a custom 4x4 with a guaranteed window seat, all park and conservancy fees, accommodation, the meals listed in the itinerary, bottled water throughout, and round-the-clock support from our Nairobi team. International flights, visas, insurance, drinks, tips and optional extras such as balloon flights are not included, and each tour page lists its exclusions in full.',
    group: 'booking',
    order: 2,
    status: 'published',
  },
  {
    question: 'How do I pay, and what is your cancellation policy?',
    answer:
      'We take a deposit to confirm your booking and the balance before departure, by bank transfer or card. Deposits are generally refundable up to a defined point before travel, after which charges apply — gorilla permits are the exception, as the parks themselves do not refund them. Exact terms are set out in the booking confirmation we send you before any money changes hands.',
    group: 'payment',
    order: 1,
    status: 'published',
  },
  {
    question: 'Is it safe, and what about health requirements?',
    answer:
      'Safari travel in East Africa is well established and our guides are trained in wildlife safety and first aid. Yellow fever vaccination may be required depending on your route and where you have travelled recently, and antimalarials are strongly advised for most areas. Please consult a travel health clinic six to eight weeks before departure, and travel with comprehensive medical insurance.',
    group: 'travel',
    order: 3,
    status: 'published',
  },
  {
    question: 'Can you tailor an itinerary for us?',
    answer:
      'Yes — most of what we run is adjusted in some way. Tell us your dates, budget, pace and what matters most to you, and our specialists will build something around it. Honeymoons, families with young children, photographers and travellers with limited mobility all need different things, and a fixed itinerary rarely suits everyone.',
    group: 'general',
    order: 1,
    status: 'published',
  },
  {
    question: 'What should I pack?',
    answer:
      'Neutral colours, layers for cold mornings and hot afternoons, a warm fleece for dawn drives, a wide-brimmed hat, sunscreen, insect repellent and closed shoes. Binoculars make an enormous difference. Soft duffel bags are required on light aircraft transfers, which usually cap baggage at 15kg including hand luggage. We send a full packing list once your booking is confirmed.',
    group: 'travel',
    order: 4,
    status: 'published',
  },
  {
    question: 'Do you arrange single travellers and small groups?',
    answer:
      'Yes. Most of our departures are private, so the vehicle is yours whether you are one person or six. Single travellers should be aware that accommodation is priced per room, so a single supplement usually applies — we will always show it separately rather than bury it in the total.',
    group: 'general',
    order: 2,
    status: 'published',
  },
];

export const testimonials = [
  {
    authorName: 'Marieke de Vries',
    authorLocation: 'Utrecht, Netherlands',
    quote:
      'We were met at the airport and from that moment nothing was our problem to solve. Our guide read the Mara like a book — he knew which pride had cubs and where they would be at six in the morning. Three river crossings in four days.',
    rating: 5,
    tourName: 'Great Migration — Mara River Crossings',
    featured: true,
    status: 'published',
    order: 1,
  },
  {
    authorName: 'James Okoth',
    authorLocation: 'Kampala, Uganda',
    quote:
      'I had one weekend free and did not expect much. Left Nairobi on Friday afternoon, watched a leopard come down a tree on Saturday evening, and was back at my desk on Monday. Extraordinary value for what it was.',
    rating: 5,
    tourName: 'Big Five Express',
    featured: true,
    status: 'published',
    order: 2,
  },
  {
    authorName: 'Sarah & Tom Whitfield',
    authorLocation: 'Bristol, United Kingdom',
    quote:
      'The bush and beach combination was exactly right for us. A proper safari first, then a week at Diani to actually rest. Booking the internal flights rather than driving made all the difference — we would have lost two days on the road.',
    rating: 5,
    tourName: 'Bush & Beach — Mara and Diani',
    featured: true,
    status: 'published',
    order: 3,
  },
  {
    authorName: 'Priya Raghunathan',
    authorLocation: 'Bengaluru, India',
    quote:
      'The trek was harder than I expected — four hours up through wet forest — and worth every minute. Our porter carried my camera bag and our ranger was patient with all of us. That hour with the family does not really translate into words.',
    rating: 5,
    tourName: 'Gorilla Trekking — Bwindi Impenetrable Forest',
    featured: true,
    status: 'published',
    order: 4,
  },
  {
    authorName: 'Daniel Mwangi',
    authorLocation: 'Nairobi, Kenya',
    quote:
      'I have used several operators over the years for visiting family and clients. Lekker are the ones who answer the phone at ten at night when a flight moves. The logistics are what you are actually paying for and theirs are excellent.',
    rating: 5,
    tourName: 'Classic Kenya — Mara, Nakuru & Amboseli',
    featured: false,
    status: 'published',
    order: 5,
  },
  {
    authorName: 'Anneliese Bauer',
    authorLocation: 'Munich, Germany',
    quote:
      'As a photographer I have been on trips where you are shooting over three other people. Five guests, beanbags provided, and a guide who understood why I wanted the vehicle moved two metres to the left. I came home with work I am proud of.',
    rating: 5,
    tourName: 'The Pattern of the Bush',
    featured: false,
    status: 'published',
    order: 6,
  },
];

export const blogPosts = [
  {
    title: 'When to See the Great Migration: A Month-by-Month Guide',
    slug: 'when-to-see-the-great-migration',
    excerpt:
      'The migration is a year-round circuit, not a single event. Here is roughly where the herds are in each month, and what that means for where you should be standing.',
    content: `The Great Migration is often sold as a fixed event on a fixed date. It is not. Around two million wildebeest, zebra and gazelle move in a continuous loop between the Serengeti and the Maasai Mara, following rainfall and grazing, and they have been doing it for far longer than anyone has been selling tickets to watch.

Knowing roughly where they are in a given month is the difference between a good trip and a frustrating one.

## December to March — the southern Serengeti

The herds spread across the short-grass plains around Ndutu. Calving peaks in February, when something like 8,000 calves are born each day. Predator activity is at its most intense of the year: this is when you are most likely to see a hunt, and cheetah in particular do well on open ground.

## April and May — the long rains

The herds begin moving north-west through the central Serengeti. Many camps close and the tracks are difficult. It is also the cheapest and emptiest time of year, and the country is green and beautiful. A trade-off worth considering if you are not fixed on river crossings.

## June and July — the western corridor

Movement north along the Grumeti. The first river crossings happen here, with fewer vehicles than the Mara crossings attract later.

## July to October — the Mara River

The period most people mean when they say "the migration". Herds cross the Mara River into Kenya, sometimes in enormous numbers, sometimes turning back at the last moment for no reason anyone can see. Being camped close to the crossing points matters more than anything else, because the waiting is the activity.

## November — moving south

The short rains draw the herds back down into the Serengeti, and the loop begins again.

## A word of caution

No guide can promise you a crossing. The herds gather at the bank, sometimes for hours, and then decide. What a good operator can do is put you in the right place in the right month with someone who reads the build-up — and be honest with you about the rest.`,
    coverImage: img('mara-wildebeest-migration.jpg', 'Wildebeest herds crossing the Maasai Mara'),
    tags: ['migration', 'kenya', 'tanzania', 'planning'],
    readingMinutes: 5,
    featured: true,
    status: 'published',
    publishedAt: new Date('2026-06-12'),
  },
  {
    title: 'What to Pack for an East African Safari',
    slug: 'what-to-pack-for-an-east-african-safari',
    excerpt:
      'Neutral colours, warm layers and a soft bag. A practical list from people who load the vehicles, including the things guests most often wish they had brought.',
    content: `Packing for safari is mostly an exercise in restraint. You will be in the same vehicle with the same people for days, laundry is available at most camps, and light aircraft transfers impose a hard baggage limit. Here is what actually matters.

## The bag itself

If any part of your trip involves a light aircraft, you need a **soft duffel** — no wheels, no rigid frame. The limit is typically 15kg including hand luggage, and it is enforced. Hard cases do not fit in the hold.

## Clothing

Neutral colours: khaki, olive, brown, grey. Not because animals object to bright colours, but because you will be photographed constantly and dust shows less. Avoid blue and black entirely in tsetse fly country — they are genuinely attracted to it.

Layers matter more than volume. A dawn game drive in an open vehicle at altitude is cold, often single digits. By eleven in the morning it is hot. A fleece and a windproof outer layer make the early starts bearable, and both come off by mid-morning.

## The things people wish they had brought

- **Binoculars.** The single biggest improvement to your experience. One pair per person, not one to share.
- **A wide-brimmed hat**, not a cap. Your ears and neck will thank you.
- **Sunscreen and lip balm.** The altitude and the dust are harder on skin than people expect.
- **A power bank.** Charging in tented camps is often limited to certain hours.
- **A dust-proof bag for camera gear.** Everything gets into everything.

## What to leave behind

Camouflage clothing is illegal for civilians in several East African countries, including Uganda and Zimbabwe, and will cause you real problems at the border. Leave it at home. Drones require permits almost everywhere and are banned outright in most national parks.

We send a complete packing list once your booking is confirmed, tailored to the parks you are visiting and the time of year.`,
    coverImage: img('camp-white-tents.jpg', 'Tented camp set up under acacia trees'),
    tags: ['planning', 'practical', 'packing'],
    readingMinutes: 4,
    featured: true,
    status: 'published',
    publishedAt: new Date('2026-07-03'),
  },
  {
    title: 'Gorilla Trekking: What the Day Actually Looks Like',
    slug: 'gorilla-trekking-what-the-day-actually-looks-like',
    excerpt:
      'An honest account of a trekking day in Bwindi or the Virungas — the briefing, the walk, the hour, and how hard it really is.',
    content: `Gorilla trekking is the most affecting wildlife encounter in East Africa and also the most physically demanding thing most of our guests do. It helps to know what the day involves before you commit to it.

## The briefing

You arrive at park headquarters by seven in the morning. Rangers divide visitors into groups of no more than eight, each assigned to one habituated gorilla family. The briefing covers the rules: stay seven metres back, no flash, no eating near the animals, and if you have any infectious illness you will be turned away. These rules exist because gorillas share enough of our physiology to catch what we carry.

## The walk

This is the part that varies. Trackers have been with your family since dawn and radio their position, but "position" can mean forty minutes away or five hours. The forest is steep, wet and thick — Bwindi is called the Impenetrable Forest for a reason — and there is no path in the usual sense. A ranger cuts through the vegetation ahead of you.

**Hire a porter.** They cost very little, they will carry your bag and physically haul you up the steep sections, and the work matters to the communities around the park. Everyone who declines one regrets it by hour two.

## The hour

When you reach the family, the clock starts and you have exactly sixty minutes. It goes faster than you can imagine.

What people rarely mention beforehand is how ordinary the gorillas make it feel. They are not performing. Juveniles wrestle, a mother nurses, the silverback watches you with mild disinterest and goes back to eating. You are, briefly, simply there — and then a ranger says the hour is up.

## Being realistic

If you have significant mobility limitations, say so when booking. Some families are reliably closer than others and rangers will do their best to assign accordingly. Sedan-chair carries are available in Rwanda at additional cost. What does not work is arriving on the day and hoping.

Permits are strictly limited and non-refundable once issued. Book six months ahead where you can.`,
    coverImage: img('gorilla-bwindi-feeding.jpg', 'Mountain gorilla feeding in dense forest'),
    tags: ['uganda', 'rwanda', 'gorillas', 'practical'],
    readingMinutes: 5,
    featured: true,
    status: 'published',
    publishedAt: new Date('2026-07-28'),
  },
  {
    title: 'Beyond the Mara: Five Kenyan Parks Worth Your Time',
    slug: 'beyond-the-mara-five-kenyan-parks',
    excerpt:
      'The Maasai Mara deserves its reputation, but Kenya has a great deal else. Five parks that reward travellers willing to look past the obvious.',
    content: `The Maasai Mara is genuinely one of the best wildlife destinations on earth, and it is also where almost every first-time visitor goes. If you have a little more time, or you have been before, these five are worth building an itinerary around.

## Samburu National Reserve

North of the equator the country turns dry and rocky, and the species change with it. Grevy zebra, reticulated giraffe, gerenuk, Beisa oryx and Somali ostrich — the "Samburu Special Five" — occur here and essentially nowhere else in Kenya. The Ewaso Ngiro river draws everything to a narrow green strip, which concentrates the game beautifully.

## Ol Pejeta Conservancy

A working conservancy on the Laikipia plateau with the highest predator density in Kenya and serious rhino conservation work you can actually see up close. Night drives are permitted here, which they are not in national parks.

## Tsavo East and West

Kenya's largest protected area by a wide margin, and startlingly empty of vehicles. The elephants are famously red from dust-bathing in the local soil. Mzima Springs in Tsavo West has an underwater viewing chamber where you can watch hippo from below.

## Lake Nakuru

Compact, fenced and reliable for both black and white rhino. The flamingo numbers fluctuate with water levels and are not what they were in the 1970s, but the setting — a soda lake ringed by yellow-barked acacia and cliffs — is spectacular.

## Meru National Park

Where Elsa the lioness of *Born Free* was released. Remote, lush, watered by thirteen rivers, and visited by very few people. If you want a park almost to yourself, this is it.

Any of these can be built into a longer Kenyan itinerary. Ask our specialists what would suit the time you have.`,
    coverImage: img('tsavo-elephants-road.jpg', 'Red elephants walking through Tsavo'),
    tags: ['kenya', 'destinations', 'planning'],
    readingMinutes: 4,
    featured: false,
    status: 'published',
    publishedAt: new Date('2026-08-15'),
  },
  {
    title: 'A Safari with Children: What Works and What Does Not',
    slug: 'a-safari-with-children-what-works',
    excerpt:
      'Family safaris are entirely doable with some planning. Age limits, drive lengths, and how to keep a six-year-old engaged on day four.',
    content: `Taking children on safari is one of the better things you can do with a family holiday, provided the trip is built for them rather than adapted at the last minute.

## Age limits are real

Many camps set a minimum age, commonly six or eight, and some private conservancies go higher. Gorilla trekking has a hard minimum of fifteen in both Uganda and Rwanda, with no exceptions. Walking safaris are generally twelve and up. We check these before proposing anything.

## Keep the drives short

A four-hour game drive is a long time for an adult and an eternity for a seven-year-old. Shorter, more frequent outings work far better, with a proper break in the middle of the day when the animals are resting anyway. Parks close to Nairobi, such as Nairobi National Park and Lake Naivasha, are excellent for a first family trip precisely because nothing is far away.

## Private vehicles are worth it

Not because of comfort, but because you can turn around when you need to. On a shared vehicle you cannot, and nobody enjoys that — least of all you.

## What children actually respond to

In our experience, rarely the Big Five. It is dung beetles, a giraffe drinking with its legs splayed, the guide showing them how to identify tracks. Guides who are good with children know this and lean into it. Ask for one specifically; we know which of ours are best with young families.

## Practical points

Malaria prophylaxis for children needs a conversation with a travel clinic well in advance. Bring familiar snacks. Pack a torch each — camps are dark at night and children find this either thrilling or alarming, sometimes both within a minute.

Tell us the ages when you enquire and we will build around them rather than sending you a standard itinerary and hoping.`,
    coverImage: img('amboseli-elephants-walking.jpg', 'Elephant family walking together'),
    tags: ['family', 'planning', 'practical'],
    readingMinutes: 4,
    featured: false,
    status: 'published',
    publishedAt: new Date('2026-08-30'),
  },
];

/** Values strip on the homepage — taken from lekkertours.com/about-us. */
export const siteValues = [
  {
    title: 'Local Expertise',
    description:
      'Born and bred in the savanna, our guides provide insights that only a lifetime of African residency can offer.',
    icon: 'compass',
  },
  {
    title: '24/7 Support',
    description:
      'From your first enquiry to your final departure, our Nairobi team is reachable at any hour, on any day.',
    icon: 'clock',
  },
  {
    title: 'Respect for the Land',
    description:
      'We operate with a deep reverence for the cradle of humanity, ensuring sustainable practices on every expedition.',
    icon: 'leaf',
  },
  {
    title: 'Transparent Pricing',
    description:
      'What is included is listed in full on every itinerary, and what is not is listed just as plainly.',
    icon: 'receipt',
  },
];

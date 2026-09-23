/**
 * Destination seed data.
 *
 * Park names, locations and seasonal windows are real. The descriptive copy is
 * written for this site; it is not taken from lekkertours.com, which has no
 * destination pages.
 */

const img = (file, alt) => ({ url: `/images/${file}`, alt });

/** Park slugs are anchor targets. Seeds upsert, which skips pre('validate'), so set them here. */
export const withParkSlugs = (parks) =>
  parks.map((p) => ({
    ...p,
    slug: p.name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),
  }));

export const destinations = [
  {
    name: 'Kenya',
    slug: 'kenya',
    country: 'Kenya',
    tagline: 'Where the safari was born',
    categoryLabel: 'Country',
    overview:
      'Kenya is where the word safari entered the language, and it still sets the standard. Within a day of Nairobi you can stand on the Mara plains during the migration, watch elephants cross beneath Kilimanjaro, and end the week on the Indian Ocean. It is the most complete safari country in East Africa, and it is our home.',
    heroImage: img('mara-wildebeest-migration.jpg', 'Wildebeest herds moving across the Maasai Mara'),
    cardImage: img('mara-lioness-cubs.jpg', 'A lioness resting with her cubs in the Maasai Mara'),
    highlights: [
      'The Great Migration river crossings, July to October',
      'Elephant herds framed by Mount Kilimanjaro in Amboseli',
      'Rift Valley lakes alive with flamingos',
      'Bush and beach in a single itinerary',
    ],
    bestTime: {
      months: ['January', 'February', 'June', 'July', 'August', 'September', 'October'],
      note: 'Dry seasons concentrate wildlife around water. July to October is migration season in the Mara; January and February are excellent everywhere and quieter.',
    },
    featured: true,
    status: 'published',
    order: 1,
    parks: [
      {
        name: 'Maasai Mara National Reserve',
        blurb:
          'Open grassland with the highest density of big cats in Kenya, and the stage for the Mara River crossings.',
        image: img('mara-lions-stalking.jpg', 'Lions moving through long grass in the Maasai Mara'),
        bestTime: 'July - October',
        highlights: ['Mara River crossings', 'Resident lion prides', 'Balloon safaris at dawn'],
      },
      {
        name: 'Amboseli National Park',
        blurb:
          'Famous for large, relaxed elephant families and uninterrupted views of Kilimanjaro across the border.',
        image: img('amboseli-elephant-kilimanjaro.jpg', 'Elephant on the savanna with Kilimanjaro behind'),
        bestTime: 'June - October, January - February',
        highlights: ['Big tusker elephants', 'Kilimanjaro backdrop', 'Observation Hill'],
      },
      {
        name: 'Tsavo East & West',
        blurb:
          "Kenya's largest protected area, red with dust, where elephants take their colour from the earth.",
        image: img('tsavo-elephants-road.jpg', 'Elephants walking through Tsavo scrub'),
        bestTime: 'June - October',
        highlights: ['Red elephants', 'Mzima Springs', 'Lugard Falls'],
      },
      {
        name: 'Lake Nakuru National Park',
        blurb:
          'A soda lake ringed by forest and cliffs, and one of the most reliable rhino sanctuaries in the country.',
        image: img('nakuru-lesser-flamingos.jpg', 'Lesser flamingos feeding in a Rift Valley lake'),
        bestTime: 'Year-round',
        highlights: ['Black and white rhino', 'Flamingo flocks', 'Rothschild giraffe'],
      },
      {
        name: 'Samburu National Reserve',
        blurb:
          'Semi-arid country north of the equator, home to species you will not see further south.',
        image: img('mara-giraffes.jpg', 'Giraffes standing in dry northern bush'),
        bestTime: 'June - October',
        highlights: ['Grevy zebra and reticulated giraffe', 'Ewaso Ngiro river', 'Samburu culture'],
      },
      {
        name: 'Ol Pejeta Conservancy',
        blurb:
          'A working conservancy on the Laikipia plateau with the highest predator density in Kenya.',
        image: img('lodge-aerial-greenery.jpg', 'Aerial view of a conservancy lodge in green country'),
        bestTime: 'Year-round',
        highlights: ['Rhino conservation work', 'Chimpanzee sanctuary', 'Night game drives'],
      },
      {
        name: 'Lake Naivasha',
        blurb:
          'A freshwater lake an easy drive from Nairobi, best explored by boat and on foot at Crescent Island.',
        image: img('naivasha-greater-flamingos.jpg', 'Greater flamingos at the edge of Lake Naivasha'),
        bestTime: 'Year-round',
        highlights: ['Boat safaris', 'Walking on Crescent Island', 'Hells Gate by bicycle'],
      },
      {
        name: 'Nairobi National Park',
        blurb:
          'The only national park inside a capital city, with rhino and lion against a skyline of towers.',
        image: img('mara-herd-safari.jpg', 'Herd of plains game grazing near Nairobi'),
        bestTime: 'Year-round',
        highlights: ['Half-day game drives', 'Black rhino', 'Ivory Burning Site'],
      },
      {
        name: 'Diani & the Kenyan Coast',
        blurb:
          'White sand, warm water and a reef offshore: the natural end to a week in the bush.',
        image: img('zanzibar-dhow-shore.jpg', 'Traditional sailing boat resting on a white sand beach'),
        bestTime: 'December - March, July - October',
        highlights: ['Coral reef snorkelling', 'Dhow sailing', 'Swahili old towns'],
      },
    ],
  },
  {
    name: 'Tanzania',
    slug: 'tanzania',
    country: 'Tanzania',
    tagline: 'Endless plains and the great crater',
    categoryLabel: 'Country',
    overview:
      'Tanzania holds the largest herds on the continent. The Serengeti runs to the horizon in every direction, and the Ngorongoro Crater concentrates an entire ecosystem inside a collapsed volcano. The scale is what people remember.',
    heroImage: img('serengeti-wildebeest-grazing.jpg', 'Wildebeest grazing across the Serengeti plains'),
    cardImage: img('ngorongoro-crater-landscape.jpg', 'The floor of the Ngorongoro Crater at first light'),
    highlights: [
      'Calving season on the southern Serengeti, January to March',
      'The Ngorongoro Crater floor in a single morning',
      'Tarangire elephant herds among baobabs',
      'Balloon flights over the western corridor',
    ],
    bestTime: {
      months: ['January', 'February', 'June', 'July', 'August', 'September', 'October'],
      note: 'June to October is the classic dry season. January to March is calving season in the south, with predators close behind.',
    },
    featured: true,
    status: 'published',
    order: 2,
    parks: [
      {
        name: 'Serengeti National Park',
        blurb: 'Grassland to the horizon, holding the migration for most of the year.',
        image: img('serengeti-zebra-wildebeest.jpg', 'Zebra and wildebeest grazing together'),
        bestTime: 'June - October, January - March',
        highlights: ['Migration herds', 'Seronera big cats', 'Balloon safaris'],
      },
      {
        name: 'Ngorongoro Crater',
        blurb: 'A collapsed caldera holding 25,000 large animals within its walls year-round.',
        image: img('ngorongoro-lioness.jpg', 'A lioness on the crater floor'),
        bestTime: 'Year-round',
        highlights: ['Black rhino', 'Crater floor game drive', 'Maasai grazing lands'],
      },
      {
        name: 'Tarangire National Park',
        blurb: 'Baobab country along a river that draws enormous elephant herds in the dry months.',
        image: img('serengeti-antelope-herd.jpg', 'Antelope herd on open savanna'),
        bestTime: 'June - October',
        highlights: ['Elephant herds', 'Ancient baobabs', 'Tree-climbing pythons'],
      },
      {
        name: 'Lake Manyara National Park',
        blurb: 'Groundwater forest below the Rift escarpment, known for tree-climbing lions.',
        image: img('nakuru-flamingo-group.jpg', 'Flamingos wading in shallow lake water'),
        bestTime: 'June - October',
        highlights: ['Tree-climbing lions', 'Flamingos', 'Canopy walkway'],
      },
      {
        name: 'Zanzibar Archipelago',
        blurb: 'Spice islands off the Tanzanian coast, and the usual finish to a northern circuit.',
        image: img('zanzibar-dhow-sunset.jpg', 'A dhow under sail at sunset off Zanzibar'),
        bestTime: 'June - October, December - February',
        highlights: ['Stone Town', 'Nungwi and Kendwa beaches', 'Spice farms'],
      },
    ],
  },
  {
    name: 'Uganda',
    slug: 'uganda',
    country: 'Uganda',
    tagline: 'Forests, gorillas and the source of the Nile',
    categoryLabel: 'Country',
    overview:
      'Uganda is green where the savanna countries are gold. Half the world\'s mountain gorillas live in its southern forests, and the Nile begins here. It rewards travellers who want to walk rather than only drive.',
    heroImage: img('gorilla-uganda-forest.jpg', 'A mountain gorilla resting in dense forest'),
    cardImage: img('gorilla-bwindi-feeding.jpg', 'Mountain gorilla feeding in Bwindi'),
    highlights: [
      'Gorilla trekking in Bwindi Impenetrable Forest',
      'Chimpanzee tracking in Kibale',
      'Tree-climbing lions in Ishasha',
      'The Nile at Murchison Falls',
    ],
    bestTime: {
      months: ['January', 'February', 'June', 'July', 'August', 'September', 'December'],
      note: 'Drier months make forest trails easier underfoot. Gorilla permits should be secured several months ahead.',
    },
    featured: true,
    status: 'published',
    order: 3,
    parks: [
      {
        name: 'Bwindi Impenetrable Forest',
        blurb: 'Ancient montane forest sheltering roughly half the remaining mountain gorillas.',
        image: img('gorilla-bwindi-foliage.jpg', 'Gorilla among dense green foliage in Bwindi'),
        bestTime: 'June - August, December - February',
        highlights: ['Gorilla trekking', 'Batwa cultural trails', 'Forest birding'],
      },
      {
        name: 'Queen Elizabeth National Park',
        blurb: 'Crater lakes, the Kazinga Channel, and the tree-climbing lions of Ishasha.',
        image: img('serengeti-lions-resting.jpg', 'Lions resting in the shade'),
        bestTime: 'June - September',
        highlights: ['Kazinga Channel boat safari', 'Ishasha lions', 'Crater drives'],
      },
      {
        name: 'Kibale Forest',
        blurb: 'The best chimpanzee tracking in East Africa, with thirteen primate species.',
        image: img('gorilla-kinigi-habitat.jpg', 'Primate habitat in thick rainforest'),
        bestTime: 'Year-round',
        highlights: ['Chimpanzee tracking', 'Bigodi wetland walk', 'Night forest walks'],
      },
      {
        name: 'Murchison Falls National Park',
        blurb: 'The Nile forced through a seven-metre gap, with game-rich plains on either bank.',
        image: img('tsavo-elephant-field-alt.jpg', 'Elephant grazing on open plains'),
        bestTime: 'December - February, June - September',
        highlights: ['Boat to the falls', 'Delta game drives', 'Rhino tracking en route'],
      },
    ],
  },
  {
    name: 'Rwanda',
    slug: 'rwanda',
    country: 'Rwanda',
    tagline: 'A thousand hills, and the gorillas of the Virungas',
    categoryLabel: 'Country',
    overview:
      'Rwanda is small, orderly and startlingly beautiful. Volcanoes National Park puts you within two hours of Kigali and a morning\'s walk of a gorilla family. It suits travellers with limited time who want one extraordinary encounter.',
    heroImage: img('gorilla-silverback-rwanda.jpg', 'A silverback gorilla in the Rwandan forest'),
    cardImage: img('gorilla-kinigi-habitat.jpg', 'Gorilla habitat in the Virunga foothills'),
    highlights: [
      'Gorilla families in Volcanoes National Park',
      'Golden monkeys in the bamboo zone',
      'Canopy walkway at Nyungwe',
      'Kigali, among the cleanest cities in Africa',
    ],
    bestTime: {
      months: ['June', 'July', 'August', 'September', 'December', 'January', 'February'],
      note: 'The long dry season from June to September gives the firmest trekking conditions.',
    },
    featured: false,
    status: 'published',
    order: 4,
    parks: [
      {
        name: 'Volcanoes National Park',
        blurb: 'Bamboo and hagenia forest on the Virunga slopes, home to habituated gorilla families.',
        image: img('gorilla-silverback-rwanda.jpg', 'Silverback gorilla in mountain forest'),
        bestTime: 'June - September, December - February',
        highlights: ['Gorilla trekking', 'Golden monkeys', 'Dian Fossey memorial hike'],
      },
      {
        name: 'Nyungwe Forest',
        blurb: 'Montane rainforest with a suspended canopy walkway and thirteen primate species.',
        image: img('gorilla-bwindi-feeding.jpg', 'Primate feeding in montane rainforest'),
        bestTime: 'June - September',
        highlights: ['Canopy walkway', 'Chimpanzee tracking', 'Waterfall trails'],
      },
      {
        name: 'Akagera National Park',
        blurb: 'Rwanda\'s savanna park in the east, restocked with lion and rhino and now a Big Five reserve.',
        image: img('serengeti-zebra-herd.jpg', 'Zebra herd on open grassland'),
        bestTime: 'June - September',
        highlights: ['Big Five game drives', 'Lake Ihema boat safari', 'Behind-the-scenes conservation'],
      },
    ],
  },
  {
    name: 'Zanzibar',
    slug: 'zanzibar',
    country: 'Zanzibar',
    tagline: 'Where the safari ends and the ocean begins',
    categoryLabel: 'Island',
    overview:
      'Zanzibar is the natural counterweight to a week of early starts and dusty tracks. Stone Town is a working Swahili port with centuries of trade in its architecture; the north and east coasts are as good as beaches get in the Indian Ocean.',
    heroImage: img('zanzibar-dhow-beach.jpg', 'A traditional dhow drawn up on a Zanzibar beach'),
    cardImage: img('zanzibar-low-tide-boat.jpg', 'Fishing boat resting on the sand at low tide'),
    highlights: [
      'Stone Town, a UNESCO World Heritage site',
      'Nungwi and Kendwa for swimmable beaches at all tides',
      'Spice farm walks inland',
      'Dolphins and reef at Mnemba Atoll',
    ],
    bestTime: {
      months: ['June', 'July', 'August', 'September', 'October', 'December', 'January', 'February'],
      note: 'Avoid the long rains in April and May. June to October is dry and breezy; December to February is hot and calm.',
    },
    featured: false,
    status: 'published',
    order: 5,
    parks: [
      {
        name: 'Stone Town',
        blurb: 'Coral-stone alleys, carved doors and a seafront market that starts at dusk.',
        image: img('zanzibar-fishing-boat.jpg', 'Fishing boat on the shore near Stone Town'),
        bestTime: 'Year-round',
        highlights: ['Carved door walking tour', 'Forodhani night market', 'Former slave market memorial'],
      },
      {
        name: 'Nungwi & Kendwa',
        blurb: 'The north tip, where the tide barely retreats and the sunsets face west.',
        image: img('zanzibar-dhow-sunset.jpg', 'Dhow silhouetted against a Zanzibar sunset'),
        bestTime: 'June - October, December - February',
        highlights: ['Swimming at all tides', 'Sunset dhow cruises', 'Diving off Mnemba'],
      },
      {
        name: 'Jozani Forest',
        blurb: 'The last stand of Zanzibar\'s endemic red colobus monkey, on a boardwalk through mangroves.',
        image: img('zanzibar-dhow-shore.jpg', 'Coastal forest and shoreline in Zanzibar'),
        bestTime: 'Year-round',
        highlights: ['Red colobus monkeys', 'Mangrove boardwalk', 'Butterfly centre'],
      },
    ],
  },
];

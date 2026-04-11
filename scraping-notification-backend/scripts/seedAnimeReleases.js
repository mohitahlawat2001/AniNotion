const mongoose = require('mongoose');
const AnimeRelease = require('../models/AnimeRelease');
require('dotenv').config();

const sampleData = [
  {
    title: 'Digimon Beatbreak - 24',
    animeName: 'Digimon Beatbreak',
    episodeNumber: '24',
    thumbnailUrl: 'https://i.animepahe.si/snapshots/6a2dbcff3c0146313894e1001f461f84a4cf2702d5806520312e024fd3cf31dd.jpg',
    watchUrl: 'https://animepahe.com/play/e308e5cb-1c1a-3f2c-0519-27ade6aa47df/0154f531fc2ba589cb88872cd284effa0f31579f92e557d1761d966ccb3f0c10',
    animePageUrl: 'https://animepahe.com/anime/e308e5cb-1c1a-3f2c-0519-27ade6aa47df',
    sourceWebsite: 'animepahe',
    dataId: '6394',
    releaseDate: new Date(),
    isNew: true,
    isComplete: false
  },
  {
    title: 'SI-VIS: The Sound of Heroes - 24',
    animeName: 'SI-VIS: The Sound of Heroes',
    episodeNumber: '24',
    thumbnailUrl: 'https://i.animepahe.si/snapshots/10101f699fcc0629210cdee16148a1b576d307da5aaeeb167ca9ec8111bb6638.jpg',
    watchUrl: 'https://animepahe.com/play/30c57a4b-bc4b-6516-b77e-86aef3ae5bb8/149225fa3d4deee5b4d74243aeea041a8c02661aa8d9bac5a94a496a16ea0ca9',
    animePageUrl: 'https://animepahe.com/anime/30c57a4b-bc4b-6516-b77e-86aef3ae5bb8',
    sourceWebsite: 'animepahe',
    dataId: '6404',
    releaseDate: new Date(),
    isNew: false,
    isComplete: true
  },
  {
    title: 'Star Detective Precure! - 9',
    animeName: 'Star Detective Precure!',
    episodeNumber: '9',
    thumbnailUrl: 'https://i.animepahe.si/snapshots/fd949fcda5b954ece102f457329b43f8412c684ce549590db9df71c87ce06567.jpg',
    watchUrl: 'https://animepahe.com/play/f1dc115e-a79d-d85b-e3ef-83218935abbc/dbb5cda762c71ecc1bafedf11a7dfc322d8ee3762a2e2e133a8c460bd0693d4f',
    animePageUrl: 'https://animepahe.com/anime/f1dc115e-a79d-d85b-e3ef-83218935abbc',
    sourceWebsite: 'animepahe',
    dataId: '6561',
    releaseDate: new Date(),
    isNew: true,
    isComplete: false
  },
  {
    title: 'Scum of the Brave - 12',
    animeName: 'Scum of the Brave',
    episodeNumber: '12',
    thumbnailUrl: 'https://i.animepahe.si/snapshots/f2fae679032e4567fc5fb7ba7d02d26d7aec424796c6e67d36f5c8e1c9960fcc.jpg',
    watchUrl: 'https://animepahe.com/play/e2cf881c-74ae-1523-936b-e6f16b786df1/8139620123c46600ee17b05ab8c3b930a337ba2d323ce6e94b84e512cca1774e',
    animePageUrl: 'https://animepahe.com/anime/e2cf881c-74ae-1523-936b-e6f16b786df1',
    sourceWebsite: 'animepahe',
    dataId: '6472',
    releaseDate: new Date(),
    isNew: true,
    isComplete: false
  },
  {
    title: 'Agents of the Four Seasons: Dance of Spring - 1',
    animeName: 'Agents of the Four Seasons: Dance of Spring',
    episodeNumber: '1',
    thumbnailUrl: 'https://i.animepahe.si/snapshots/130d8f4ae1a144ea58235ea1edb297309db91ad27aad66e1c9c9a1084562937d.jpg',
    watchUrl: 'https://animepahe.com/play/4f2a787e-bf25-d545-95ab-75c612e7d8e4/2ff1f0dc1edd179b990c164af1701bcf13e6e4270f7d0df9cda497b829bc2e12',
    animePageUrl: 'https://animepahe.com/anime/4f2a787e-bf25-d545-95ab-75c612e7d8e4',
    sourceWebsite: 'animepahe',
    dataId: '6660',
    releaseDate: new Date(),
    isNew: true,
    isComplete: false
  },
  {
    title: 'Demon Slayer Season 5 - 3',
    animeName: 'Demon Slayer Season 5',
    episodeNumber: '3',
    thumbnailUrl: 'https://i.animepahe.si/snapshots/sample123.jpg',
    watchUrl: 'https://animepahe.com/play/sample-id/sample-hash',
    animePageUrl: 'https://animepahe.com/anime/sample-id',
    sourceWebsite: 'animepahe',
    dataId: '7001',
    releaseDate: new Date(Date.now() - 86400000), // Yesterday
    isNew: true,
    isComplete: false
  }
];

async function seedAnimeReleases() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aninotion');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await AnimeRelease.deleteMany({});
    console.log('🗑️  Cleared existing anime releases');

    // Insert sample data
    const result = await AnimeRelease.insertMany(sampleData);
    console.log(`✅ Inserted ${result.length} anime releases`);

    console.log('\n📺 Sample Data:');
    result.forEach((anime, i) => {
      console.log(`${i + 1}. ${anime.animeName} - Episode ${anime.episodeNumber}`);
    });

    console.log('\n🎉 Seed completed successfully!');
    console.log('🔗 Visit http://localhost:5173/anime-releases to see the data');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedAnimeReleases();

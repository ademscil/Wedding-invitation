import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'node:path';

const dbPath = path.join(__dirname, 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  const templates = [
    {
      name: 'Elegant Rose',
      slug: 'elegant-rose',
      category: 'ELEGANT',
      description: 'Template elegan dengan nuansa rose gold dan ornamen klasik',
      componentName: 'elegant',
      isPremium: false,
      thumbnail: '/templates/elegant-rose.jpg',
    },
    {
      name: 'Modern Clean',
      slug: 'modern-clean',
      category: 'MODERN',
      description: 'Template modern dengan desain bersih dan minimalis',
      componentName: 'modern',
      isPremium: false,
      thumbnail: '/templates/modern-clean.jpg',
    },
    {
      name: 'Simply White',
      slug: 'simply-white',
      category: 'MINIMALIST',
      description: 'Template minimalis dengan warna putih dan tipografi elegan',
      componentName: 'minimalist',
      isPremium: false,
      thumbnail: '/templates/simply-white.jpg',
    },
    {
      name: 'Islamic Green',
      slug: 'islamic-green',
      category: 'ISLAMIC',
      description: 'Template Islami dengan ornamen arabesque dan warna hijau',
      componentName: 'islamic',
      isPremium: true,
      price: 50000,
      thumbnail: '/templates/islamic-green.jpg',
    },
    {
      name: 'Rustic Garden',
      slug: 'rustic-garden',
      category: 'RUSTIC',
      description: 'Template rustic dengan nuansa taman dan bunga wildflower',
      componentName: 'rustic',
      isPremium: true,
      price: 50000,
      thumbnail: '/templates/rustic-garden.jpg',
    },
    {
      name: 'Christian Grace',
      slug: 'christian-grace',
      category: 'CHRISTIAN',
      description: 'Template Kristiani dengan ayat Alkitab dan nuansa biru lembut',
      componentName: 'christian',
      isPremium: false,
      thumbnail: '/templates/christian-grace.jpg',
    },
    {
      name: 'Javanese Heritage',
      slug: 'javanese-heritage',
      category: 'TRADITIONAL',
      description: 'Template tradisional Jawa dengan motif batik dan warna coklat hangat',
      componentName: 'javanese',
      isPremium: true,
      price: 75000,
      thumbnail: '/templates/javanese-heritage.jpg',
    },
    {
      name: 'Modern Dark',
      slug: 'modern-dark',
      category: 'MODERN',
      description: 'Template modern gelap dengan aksen emas mewah',
      componentName: 'modern-dark',
      isPremium: true,
      price: 75000,
      thumbnail: '/templates/modern-dark.jpg',
    },
    {
      name: 'Chinese Double Happiness',
      slug: 'chinese-double-happiness',
      category: 'CHINESE',
      description: 'Template pernikahan Tionghoa dengan simbol kebahagiaan ganda',
      componentName: 'chinese',
      isPremium: true,
      price: 75000,
      thumbnail: '/templates/chinese-double-happiness.jpg',
    },
    {
      name: 'Floral Romance',
      slug: 'floral-romance',
      category: 'ELEGANT',
      description: 'Template romantis dengan ornamen bunga merah muda yang cantik',
      componentName: 'floral',
      isPremium: false,
      thumbnail: '/templates/floral-romance.jpg',
    },
  ];

  for (const template of templates) {
    await prisma.template.upsert({
      where: { slug: template.slug },
      update: template,
      create: template,
    });
  }

  console.log('Seed completed: 10 templates created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

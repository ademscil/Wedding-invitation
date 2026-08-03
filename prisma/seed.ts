import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
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
      thumbnail: '/templates/elegant-rose.svg',
    },
    {
      name: 'Modern Clean',
      slug: 'modern-clean',
      category: 'MODERN',
      description: 'Template modern dengan desain bersih dan minimalis',
      componentName: 'modern',
      isPremium: false,
      thumbnail: '/templates/modern-clean.svg',
    },
    {
      name: 'Simply White',
      slug: 'simply-white',
      category: 'MINIMALIST',
      description: 'Template minimalis dengan warna putih dan tipografi elegan',
      componentName: 'minimalist',
      isPremium: false,
      thumbnail: '/templates/simply-white.svg',
    },
    {
      name: 'Islamic Green',
      slug: 'islamic-green',
      category: 'ISLAMIC',
      description: 'Template Islami dengan ornamen arabesque dan warna hijau',
      componentName: 'islamic',
      isPremium: true,
      price: 50000,
      thumbnail: '/templates/islamic-green.svg',
    },
    {
      name: 'Rustic Garden',
      slug: 'rustic-garden',
      category: 'RUSTIC',
      description: 'Template rustic dengan nuansa taman dan bunga wildflower',
      componentName: 'rustic',
      isPremium: true,
      price: 50000,
      thumbnail: '/templates/rustic-garden.svg',
    },
    {
      name: 'Christian Grace',
      slug: 'christian-grace',
      category: 'CHRISTIAN',
      description: 'Template Kristiani dengan ayat Alkitab dan nuansa biru lembut',
      componentName: 'christian',
      isPremium: false,
      thumbnail: '/templates/christian-grace.svg',
    },
    {
      name: 'Javanese Heritage',
      slug: 'javanese-heritage',
      category: 'TRADITIONAL',
      description: 'Template tradisional Jawa dengan motif batik dan warna coklat hangat',
      componentName: 'javanese',
      isPremium: true,
      price: 75000,
      thumbnail: '/templates/javanese-heritage.svg',
    },
    {
      name: 'Modern Dark',
      slug: 'modern-dark',
      category: 'MODERN',
      description: 'Template modern gelap dengan aksen emas mewah',
      componentName: 'modern-dark',
      isPremium: true,
      price: 75000,
      thumbnail: '/templates/modern-dark.svg',
    },
    {
      name: 'Chinese Double Happiness',
      slug: 'chinese-double-happiness',
      category: 'CHINESE',
      description: 'Template pernikahan Tionghoa dengan simbol kebahagiaan ganda',
      componentName: 'chinese',
      isPremium: true,
      price: 75000,
      thumbnail: '/templates/chinese-double-happiness.svg',
    },
    {
      name: 'Floral Romance',
      slug: 'floral-romance',
      category: 'ELEGANT',
      description: 'Template romantis dengan ornamen bunga merah muda yang cantik',
      componentName: 'floral',
      isPremium: false,
      thumbnail: '/templates/floral-romance.svg',
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

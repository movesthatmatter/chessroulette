import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const gabe = await prisma.user.upsert({
    where: { email: 'gabriel@movesthatmatter.io' },
    update: {},
    create: {
      email: 'gabriel@movesthatmatter.io',
      firstName: 'Gabriel',
      lastName: 'Troia',
    },
  });

  // await prisma.lesson.create({
  //   data: {
  //     name: 'Opening Lesson',
  //     createdBy: gabe.id,
  //   }
  // })

  
  console.log({ gabe });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

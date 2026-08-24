import prisma from '../src/config/prisma';

async function main() {
  const allOrgs = await prisma.organization.findMany({
    select: { id: true, name: true, slug: true },
  });

  const validSlugs = new Set(['syntrix-labs', 'syntrix-platform', 'syntrix-technologies']);

  const testOrgs = allOrgs.filter((org) => !validSlugs.has(org.slug));

  if (testOrgs.length > 0) {
    console.log(`\n🧹 Cleaning up ${testOrgs.length} non-production test organizations...`);
    for (const org of testOrgs) {
      await prisma.organization.delete({ where: { id: org.id } });
      console.log(`  - Deleted: ${org.name} (${org.slug})`);
    }
  }

  const remaining = await prisma.organization.findMany({
    select: { id: true, name: true, slug: true },
  });

  console.log('\n✨ Remaining Clean Production Organizations:');
  console.table(remaining);
}

main()
  .catch((err) => console.error('Error:', err))
  .finally(() => prisma.$disconnect());

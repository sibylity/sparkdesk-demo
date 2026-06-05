import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const org = await db.organization.findFirst({ where: { workosOrganizationId: 'demo-org' } })
  if (!org) { console.error('Demo org not found — run db:seed first'); process.exit(1) }

  console.log('Clearing demo data…')
  await db.note.deleteMany({ where: { ticket: { organizationId: org.id } } })
  await db.message.deleteMany({ where: { ticket: { organizationId: org.id } } })
  await db.ticket.deleteMany({ where: { organizationId: org.id } })
  await db.customer.deleteMany({ where: { organizationId: org.id } })
  console.log('Cleared. Reseeding…\n')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
  .then(() => import('./seed'))

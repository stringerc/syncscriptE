import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanDuplicates() {
  console.log('🧹 Cleaning duplicate templates...\n')

  try {
    // Get all scripts
    const allScripts = await prisma.script.findMany({
      orderBy: { createdAt: 'asc' } // Oldest first
    })

    console.log(`Found ${allScripts.length} total scripts`)

    // Group by title
    const groupedByTitle = allScripts.reduce((acc, script) => {
      if (!acc[script.title]) {
        acc[script.title] = []
      }
      acc[script.title].push(script)
      return acc
    }, {} as Record<string, any[]>)

    // Delete all but the LATEST of each title
    for (const [title, scripts] of Object.entries(groupedByTitle)) {
      if (scripts.length > 1) {
        console.log(`\n📋 "${title}": Found ${scripts.length} duplicates`)
        
        // Keep the latest (last one)
        const toKeep = scripts[scripts.length - 1]
        const toDelete = scripts.slice(0, -1)

        console.log(`  ✓ Keeping: ${toKeep.id} (${toKeep.createdAt})`)
        
        for (const script of toDelete) {
          console.log(`  ✗ Deleting: ${script.id} (${script.createdAt})`)
          
          // Delete related records first (cascade should handle this, but being explicit)
          await prisma.templateCatalog.deleteMany({
            where: { versionId: script.id }
          })
          
          await prisma.templateStats.deleteMany({
            where: { versionId: script.id }
          })
          
          await prisma.script.delete({
            where: { id: script.id }
          })
        }
        
        console.log(`  ✨ Cleaned up ${toDelete.length} duplicates for "${title}"`)
      }
    }

    // Final count
    const finalCount = await prisma.script.count()
    const catalogCount = await prisma.templateCatalog.count()
    
    console.log(`\n🎉 Cleanup complete!`)
    console.log(`   Scripts: ${finalCount}`)
    console.log(`   Catalog: ${catalogCount}`)
    console.log(`\n✅ Should now have 6 unique templates!`)

  } catch (error) {
    console.error('❌ Error cleaning duplicates:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanDuplicates().catch(console.error)

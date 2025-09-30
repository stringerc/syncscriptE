import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function enableFeaturesForLaunch() {
  console.log('🚀 Enabling ShareScript and Friends for all users...')
  
  try {
    // Update all existing users to enable ShareScript and Friends
    const result = await prisma.userFeatureFlags.updateMany({
      data: {
        shareScript: true,
        friends: true
      }
    })
    
    console.log(`✅ Updated ${result.count} users with ShareScript and Friends enabled`)
    
    // Also create feature flags for users who don't have them yet
    const usersWithoutFlags = await prisma.user.findMany({
      where: {
        featureFlags: null
      },
      select: { id: true }
    })
    
    if (usersWithoutFlags.length > 0) {
      const newFlags = usersWithoutFlags.map(user => ({
        userId: user.id,
        shareScript: true,
        friends: true
      }))
      
      await prisma.userFeatureFlags.createMany({
        data: newFlags
      })
      
      console.log(`✅ Created feature flags for ${usersWithoutFlags.length} new users`)
    }
    
    console.log('🎉 All users now have ShareScript and Friends enabled!')
    
  } catch (error) {
    console.error('❌ Error enabling features:', error)
  } finally {
    await prisma.$disconnect()
  }
}

enableFeaturesForLaunch()

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const templates = [
  {
    // 1. WEDDING PLANNING
    title: 'Wedding Planning',
    description: 'Complete wedding planning checklist from engagement to honeymoon',
    category: 'wedding',
    tags: ['venue', 'catering', 'photographer', 'planning', 'celebration'],
    quality: 95,
    tasks: [
      { title: 'Set wedding budget', priority: 'CRITICAL', durationMin: 120 },
      { title: 'Choose wedding date', priority: 'CRITICAL', durationMin: 60 },
      { title: 'Create guest list', priority: 'HIGH', durationMin: 90 },
      { title: 'Book ceremony venue', priority: 'CRITICAL', durationMin: 180 },
      { title: 'Book reception venue', priority: 'CRITICAL', durationMin: 180 },
      { title: 'Hire wedding photographer', priority: 'HIGH', durationMin: 120 },
      { title: 'Hire videographer', priority: 'MEDIUM', durationMin: 90 },
      { title: 'Book catering service', priority: 'CRITICAL', durationMin: 120 },
      { title: 'Choose wedding dress/suit', priority: 'HIGH', durationMin: 240 },
      { title: 'Send save-the-date cards', priority: 'MEDIUM', durationMin: 60 },
      { title: 'Book wedding DJ/band', priority: 'HIGH', durationMin: 90 },
      { title: 'Order wedding cake', priority: 'MEDIUM', durationMin: 60 },
      { title: 'Book florist', priority: 'MEDIUM', durationMin: 90 },
      { title: 'Arrange transportation', priority: 'LOW', durationMin: 45 },
      { title: 'Book honeymoon', priority: 'MEDIUM', durationMin: 120 },
      { title: 'Send formal invitations', priority: 'HIGH', durationMin: 90 },
      { title: 'Final venue walkthrough', priority: 'HIGH', durationMin: 120 },
      { title: 'Rehearsal dinner', priority: 'MEDIUM', durationMin: 180 },
      { title: 'Final vendor confirmations', priority: 'CRITICAL', durationMin: 60 },
      { title: 'Pack for honeymoon', priority: 'MEDIUM', durationMin: 90 }
    ]
  },
  {
    // 2. HOME MOVE
    title: 'Home Move & Relocation',
    description: 'Organized moving checklist for a stress-free relocation',
    category: 'moving',
    tags: ['moving', 'packing', 'utilities', 'organization', 'relocation'],
    quality: 92,
    tasks: [
      { title: 'Research moving companies', priority: 'CRITICAL', durationMin: 120 },
      { title: 'Get moving quotes', priority: 'HIGH', durationMin: 90 },
      { title: 'Book moving company', priority: 'CRITICAL', durationMin: 60 },
      { title: 'Create moving budget', priority: 'HIGH', durationMin: 60 },
      { title: 'Declutter and donate items', priority: 'MEDIUM', durationMin: 180 },
      { title: 'Order packing supplies', priority: 'HIGH', durationMin: 45 },
      { title: 'Change address with USPS', priority: 'CRITICAL', durationMin: 30 },
      { title: 'Notify utility companies', priority: 'CRITICAL', durationMin: 60 },
      { title: 'Transfer internet service', priority: 'HIGH', durationMin: 45 },
      { title: 'Pack non-essentials', priority: 'MEDIUM', durationMin: 240 },
      { title: 'Label all boxes', priority: 'MEDIUM', durationMin: 60 },
      { title: 'Arrange childcare for moving day', priority: 'MEDIUM', durationMin: 30 },
      { title: 'Pack essentials box', priority: 'HIGH', durationMin: 60 },
      { title: 'Clean old home', priority: 'MEDIUM', durationMin: 180 },
      { title: 'Final walkthrough of old home', priority: 'HIGH', durationMin: 45 },
      { title: 'Moving day coordination', priority: 'CRITICAL', durationMin: 480 },
      { title: 'Unpack essentials', priority: 'HIGH', durationMin: 120 },
      { title: 'Set up utilities at new home', priority: 'CRITICAL', durationMin: 60 },
      { title: 'Update driver\'s license', priority: 'MEDIUM', durationMin: 60 },
      { title: 'Register to vote in new area', priority: 'LOW', durationMin: 30 }
    ]
  },
  {
    // 3. PRODUCT LAUNCH
    title: 'Product Launch Campaign',
    description: 'Complete product launch workflow from planning to post-launch',
    category: 'business',
    tags: ['launch', 'marketing', 'product', 'startup', 'growth'],
    quality: 94,
    tasks: [
      { title: 'Define launch goals and KPIs', priority: 'CRITICAL', durationMin: 120 },
      { title: 'Create launch timeline', priority: 'CRITICAL', durationMin: 90 },
      { title: 'Build landing page', priority: 'HIGH', durationMin: 480 },
      { title: 'Set up analytics tracking', priority: 'HIGH', durationMin: 120 },
      { title: 'Create demo video', priority: 'HIGH', durationMin: 360 },
      { title: 'Write press release', priority: 'MEDIUM', durationMin: 120 },
      { title: 'Prepare ProductHunt submission', priority: 'HIGH', durationMin: 90 },
      { title: 'Design social media graphics', priority: 'MEDIUM', durationMin: 180 },
      { title: 'Build email list', priority: 'HIGH', durationMin: 60 },
      { title: 'Create launch email sequence', priority: 'HIGH', durationMin: 180 },
      { title: 'Reach out to press/influencers', priority: 'MEDIUM', durationMin: 120 },
      { title: 'Final QA testing', priority: 'CRITICAL', durationMin: 240 },
      { title: 'Set up customer support system', priority: 'HIGH', durationMin: 120 },
      { title: 'Prepare launch day social posts', priority: 'MEDIUM', durationMin: 90 },
      { title: 'Schedule launch announcement tweets', priority: 'MEDIUM', durationMin: 60 },
      { title: 'Launch on ProductHunt', priority: 'CRITICAL', durationMin: 30 },
      { title: 'Send launch email to list', priority: 'CRITICAL', durationMin: 15 },
      { title: 'Monitor launch metrics', priority: 'HIGH', durationMin: 480 },
      { title: 'Respond to early feedback', priority: 'HIGH', durationMin: 240 },
      { title: 'Post-launch retrospective', priority: 'MEDIUM', durationMin: 90 }
    ]
  },
  {
    // 4. TEAM OFFSITE
    title: 'Team Offsite Retreat',
    description: 'Plan and execute a productive team offsite or retreat',
    category: 'business',
    tags: ['team', 'retreat', 'planning', 'workshop', 'meeting'],
    quality: 88,
    tasks: [
      { title: 'Define offsite objectives', priority: 'CRITICAL', durationMin: 90 },
      { title: 'Set budget and get approval', priority: 'CRITICAL', durationMin: 60 },
      { title: 'Choose offsite dates', priority: 'HIGH', durationMin: 45 },
      { title: 'Survey team preferences', priority: 'MEDIUM', durationMin: 30 },
      { title: 'Research venues', priority: 'HIGH', durationMin: 120 },
      { title: 'Book venue', priority: 'CRITICAL', durationMin: 60 },
      { title: 'Arrange transportation', priority: 'HIGH', durationMin: 60 },
      { title: 'Book accommodations', priority: 'HIGH', durationMin: 90 },
      { title: 'Plan agenda and activities', priority: 'CRITICAL', durationMin: 180 },
      { title: 'Book team building activities', priority: 'MEDIUM', durationMin: 60 },
      { title: 'Arrange catering/meals', priority: 'HIGH', durationMin: 90 },
      { title: 'Prepare workshop materials', priority: 'HIGH', durationMin: 120 },
      { title: 'Send pre-offsite communication', priority: 'MEDIUM', durationMin: 45 },
      { title: 'Create offsite Slack channel', priority: 'LOW', durationMin: 15 },
      { title: 'Pack presentation materials', priority: 'MEDIUM', durationMin: 60 },
      { title: 'Set up venue technology', priority: 'HIGH', durationMin: 90 },
      { title: 'Facilitate offsite sessions', priority: 'CRITICAL', durationMin: 960 },
      { title: 'Document key decisions', priority: 'HIGH', durationMin: 60 },
      { title: 'Send follow-up summary', priority: 'HIGH', durationMin: 90 },
      { title: 'Create action items list', priority: 'CRITICAL', durationMin: 60 }
    ]
  },
  {
    // 5. BABY ARRIVAL
    title: 'Baby Arrival Preparation',
    description: 'Complete checklist for preparing for your new baby',
    category: 'family',
    tags: ['baby', 'nursery', 'preparation', 'family', 'newborn'],
    quality: 90,
    tasks: [
      { title: 'Choose healthcare provider', priority: 'CRITICAL', durationMin: 90 },
      { title: 'Schedule prenatal appointments', priority: 'CRITICAL', durationMin: 60 },
      { title: 'Take prenatal vitamins', priority: 'HIGH', durationMin: 5 },
      { title: 'Plan nursery design', priority: 'MEDIUM', durationMin: 120 },
      { title: 'Buy crib and mattress', priority: 'HIGH', durationMin: 120 },
      { title: 'Purchase car seat', priority: 'CRITICAL', durationMin: 90 },
      { title: 'Buy stroller', priority: 'HIGH', durationMin: 60 },
      { title: 'Stock diapers and wipes', priority: 'HIGH', durationMin: 60 },
      { title: 'Buy baby clothes (0-3 months)', priority: 'MEDIUM', durationMin: 90 },
      { title: 'Set up changing station', priority: 'MEDIUM', durationMin: 60 },
      { title: 'Childproof home', priority: 'HIGH', durationMin: 180 },
      { title: 'Choose pediatrician', priority: 'CRITICAL', durationMin: 90 },
      { title: 'Pack hospital bag', priority: 'HIGH', durationMin: 60 },
      { title: 'Install car seat', priority: 'CRITICAL', durationMin: 45 },
      { title: 'Take infant CPR class', priority: 'HIGH', durationMin: 240 },
      { title: 'Prepare frozen meals', priority: 'MEDIUM', durationMin: 180 },
      { title: 'Set up baby monitor', priority: 'MEDIUM', durationMin: 30 },
      { title: 'Wash baby clothes and bedding', priority: 'MEDIUM', durationMin: 90 },
      { title: 'Arrange parental leave', priority: 'CRITICAL', durationMin: 60 },
      { title: 'Create birth plan', priority: 'MEDIUM', durationMin: 90 }
    ]
  },
  {
    // 6. HOLIDAY HOSTING
    title: 'Holiday Hosting & Dinner Party',
    description: 'Host the perfect holiday gathering or dinner party',
    category: 'entertainment',
    tags: ['holiday', 'hosting', 'dinner', 'party', 'celebration'],
    quality: 87,
    tasks: [
      { title: 'Set date and send invitations', priority: 'HIGH', durationMin: 60 },
      { title: 'Plan menu', priority: 'CRITICAL', durationMin: 90 },
      { title: 'Make grocery list', priority: 'HIGH', durationMin: 45 },
      { title: 'Check dietary restrictions', priority: 'MEDIUM', durationMin: 30 },
      { title: 'Shop for non-perishables', priority: 'MEDIUM', durationMin: 90 },
      { title: 'Deep clean house', priority: 'HIGH', durationMin: 240 },
      { title: 'Buy fresh flowers', priority: 'LOW', durationMin: 30 },
      { title: 'Set up guest room', priority: 'MEDIUM', durationMin: 60 },
      { title: 'Buy beverages', priority: 'MEDIUM', durationMin: 45 },
      { title: 'Shop for fresh ingredients', priority: 'HIGH', durationMin: 90 },
      { title: 'Prep ingredients (day before)', priority: 'HIGH', durationMin: 180 },
      { title: 'Set table and decorate', priority: 'MEDIUM', durationMin: 60 },
      { title: 'Prepare appetizers', priority: 'MEDIUM', durationMin: 90 },
      { title: 'Cook main course', priority: 'CRITICAL', durationMin: 180 },
      { title: 'Prepare side dishes', priority: 'HIGH', durationMin: 120 },
      { title: 'Bake dessert', priority: 'MEDIUM', durationMin: 90 },
      { title: 'Chill wine and drinks', priority: 'LOW', durationMin: 15 },
      { title: 'Final tidying', priority: 'MEDIUM', durationMin: 30 },
      { title: 'Welcome guests', priority: 'HIGH', durationMin: 15 },
      { title: 'Send thank you notes', priority: 'LOW', durationMin: 45 }
    ]
  }
]

async function seedTemplates() {
  console.log('🌱 Starting template seeding...\n')

  try {
    // Find or create an admin user for the templates
    let adminUser = await prisma.user.findFirst({
      where: { email: { contains: 'admin' } }
    })

    if (!adminUser) {
      // Use first user or create a system user
      adminUser = await prisma.user.findFirst()
      
      if (!adminUser) {
        console.log('⚠️  No users found. Creating system user...')
        adminUser = await prisma.user.create({
          data: {
            email: 'system@syncscript.app',
            name: 'SyncScript System',
            password: 'system-templates-only'
          }
        })
      }
    }

    console.log(`✅ Using user: ${adminUser.email} (${adminUser.id})\n`)

    for (const template of templates) {
      console.log(`📋 Creating template: ${template.title}`)

      // Create a script (which is our template)
      const manifest = JSON.stringify({
        title: template.title,
        description: template.description,
        tasks: template.tasks
      })

      const script = await prisma.script.create({
        data: {
          title: template.title,
          description: template.description,
          userId: adminUser.id,
          category: template.category,
          status: 'PUBLISHED',
          isPublic: true,
          manifest: manifest
        }
      })

      console.log(`  ✓ Script created: ${script.id}`)

      // Add to catalog (curated templates)
      const catalogEntry = await prisma.templateCatalog.create({
        data: {
          versionId: script.id,
          category: template.category,
          tags: JSON.stringify(template.tags),
          quality: template.quality
        }
      })

      console.log(`  ✓ Added to catalog: ${catalogEntry.versionId}`)

      // Initialize stats
      await prisma.templateStats.create({
        data: {
          versionId: script.id,
          applyCount: 0
        }
      })

      console.log(`  ✓ Stats initialized`)
      console.log(`  ✨ ${template.title} seeded successfully!\n`)
    }

    console.log('🎉 All templates seeded successfully!')
    console.log(`\n📊 Summary:`)
    console.log(`   - ${templates.length} templates created`)
    console.log(`   - ${templates.reduce((sum, t) => sum + t.tasks.length, 0)} total tasks`)
    console.log(`   - Categories: ${[...new Set(templates.map(t => t.category))].join(', ')}`)
    console.log(`\n🔍 View them at: /templates`)

  } catch (error) {
    console.error('❌ Error seeding templates:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedTemplates()
  .catch(console.error)

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminMaxUser() {
  const email = 'admin@scope.ai'
  const password = 'ScopeAI_Admin2026!'

  console.log('Creating Admin Max user:', email)

  // Create user via admin API
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Scope AI Admin'
    }
  })

  if (authError) {
    // User might already exist
    if (authError.message.includes('already been registered')) {
      console.log('User already exists, fetching...')
      const { data: users } = await supabase.auth.admin.listUsers()
      const user = users?.users?.find(u => u.email === email)
      if (user) {
        console.log('Found existing user:', user.id)
        await upgradeToAdminMax(user.id)
        return
      }
    }
    console.error('Auth error:', authError)
    process.exit(1)
  }

  console.log('User created:', authData.user.id)
  await upgradeToAdminMax(authData.user.id)
}

async function upgradeToAdminMax(userId: string) {
  // Update profile to admin role and max tier
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role: 'admin',
      subscription_tier: 'max',
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (profileError) {
    console.error('Profile update error:', profileError)
    process.exit(1)
  }

  // Add credits to user_credits table
  const { error: creditsError } = await supabase
    .from('user_credits')
    .upsert({
      user_id: userId,
      credits_remaining: 1000000,
      lifetime_credits_purchased: 1000000
    }, { onConflict: 'user_id' })

  if (creditsError) {
    console.log('Credits table note (might not exist):', creditsError.message)
  }

  console.log('✅ User upgraded to Admin role and Max tier!')
  console.log('')
  console.log('=== ADMIN MAX USER CREDENTIALS ===')
  console.log('Email:    admin@scope.ai')
  console.log('Password: ScopeAI_Admin2026!')
  console.log('Role:     admin')
  console.log('Tier:     max')
  console.log('==================================')
}

createAdminMaxUser()

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

async function createProUser() {
  const email = 'testpro@scope.ai'
  const password = 'ScopeAI_Pro2026!'

  console.log('Creating user:', email)

  // Create user via admin API
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Test Pro User'
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
        await updateToProTier(user.id)
        return
      }
    }
    console.error('Auth error:', authError)
    process.exit(1)
  }

  console.log('User created:', authData.user.id)
  await updateToProTier(authData.user.id)
}

async function updateToProTier(userId: string) {
  // Update profile to pro tier
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'pro',
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
      credits_remaining: 100000,
      lifetime_credits_purchased: 100000
    }, { onConflict: 'user_id' })

  if (creditsError) {
    console.log('Credits table note:', creditsError.message)
  }

  console.log('✅ User upgraded to Pro tier!')
  console.log('')
  console.log('=== TEST PRO USER CREDENTIALS ===')
  console.log('Email:    testpro@scope.ai')
  console.log('Password: ScopeAI_Pro2026!')
  console.log('Tier:     pro')
  console.log('=================================')
}

createProUser()

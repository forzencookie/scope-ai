import os
import re

move_helpers = [
    "verifyAuth", "ApiResponse", "requireAuth", "getServerUser", 
    "getServerSession", "getAuthContext", "isAuthenticated", "isAdmin", 
    "requireApiAuth", "requireAdminAuth", "withAuth", "withAdminAuth", 
    "getAuthenticatedSupabase", "AuthError", "AuthResult", "AuthContext"
]

keep_helpers = [
    "signUp", "signIn", "signInWithOAuth", "signOut", 
    "getCurrentUser", "getSession", "resetPassword", "updatePassword", 
    "onAuthStateChange"
]

def update_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Find imports from auth
    # This regex handles single and multiline imports
    import_pattern = re.compile(r'import\s+\{([^}]+)\}\s+from\s+[\'"](.*/lib/database/auth)[\'"]', re.MULTILINE)
    
    def replace_import(match):
        helpers_str = match.group(1)
        path = match.group(2)
        
        helpers = [h.strip() for h in helpers_str.split(',')]
        # Filter out empty strings from trailing commas
        helpers = [h for h in helpers if h]
        
        to_move = [h for h in helpers if any(mh in h for mh in move_helpers)]
        to_keep = [h for h in helpers if any(kh in h for kh in keep_helpers)]
        
        # Handle cases where helper might be aliased: "verifyAuth as v"
        # The any(mh in h) handles this loosely but safely enough if helpers names are unique
        
        if not to_move:
            return match.group(0) # No change
            
        if not to_keep:
            # Only move helpers, just change the path
            new_path = path + "-server"
            return f'import {{ {", ".join(helpers)} }} from "{new_path}"'
        else:
            # Both move and keep helpers, split the import
            new_path = path + "-server"
            keep_import = f'import {{ {", ".join(to_keep)} }} from "{path}"'
            move_import = f'import {{ {", ".join(to_move)} }} from "{new_path}"'
            return f'{keep_import}\n{move_import}'

    new_content = import_pattern.sub(replace_import, content)
    
    if new_content != content:
        with open(file_path, 'w') as f:
            f.write(new_content)
        return True
    return False

files_to_check = [
    "src/app/api/ai/extract-receipt/route.ts",
    "src/app/api/ai/extract/route.ts",
    "src/app/api/chat/booking/route.ts",
    "src/app/api/chat/extract-memories/route.ts",
    "src/app/api/chat/history/[id]/route.ts",
    "src/app/api/chat/history/route.ts",
    "src/app/api/chat/route.ts",
    "src/app/api/chat/title/route.ts",
    "src/app/api/company/logo/route.ts",
    "src/app/api/company/route.ts",
    "src/app/api/compliance/route.ts",
    "src/app/api/employees/route.ts",
    "src/app/api/financial-periods/route.ts",
    "src/app/api/integrations/route.ts",
    "src/app/api/invoices/[id]/book/route.ts",
    "src/app/api/invoices/[id]/credit-note/route.ts",
    "src/app/api/invoices/[id]/pay/route.ts",
    "src/app/api/invoices/route.ts",
    "src/app/api/manadsavslut/route.ts",
    "src/app/api/members/route.ts",
    "src/app/api/models/available/route.ts",
    "src/app/api/monthly-review/route.ts",
    "src/app/api/notices/route.ts",
    "src/app/api/onboarding/seed/route.ts",
    "src/app/api/partners/route.ts",
    "src/app/api/payroll/payslips/[id]/route.ts",
    "src/app/api/payroll/payslips/route.ts",
    "src/app/api/pending-bookings/route.ts",
    "src/app/api/receipts/[id]/book/route.ts",
    "src/app/api/receipts/[id]/route.ts",
    "src/app/api/receipts/processed/route.ts",
    "src/app/api/reports/annual-report/route.ts",
    "src/app/api/reports/income-declaration/route.ts",
    "src/app/api/reports/k10/route.ts",
    "src/app/api/reports/vat/route.ts",
    "src/app/api/search/route.ts",
    "src/app/api/sie/export/route.ts",
    "src/app/api/sie/import/route.ts",
    "src/app/api/stripe/billing-history/route.ts",
    "src/app/api/stripe/checkout/route.ts",
    "src/app/api/stripe/checkout/status/route.ts",
    "src/app/api/stripe/credits/route.ts",
    "src/app/api/stripe/portal/route.ts",
    "src/app/api/supplier-invoices/[id]/book/route.ts",
    "src/app/api/supplier-invoices/[id]/status/route.ts",
    "src/app/api/supplier-invoices/processed/route.ts",
    "src/app/api/transactions/[id]/book/route.ts",
    "src/app/api/transactions/[id]/route.ts",
    "src/app/api/transactions/import/route.ts",
    "src/app/api/transactions/route.ts",
    "src/app/api/transcribe/route.ts",
    "src/app/api/user/avatar/route.ts",
    "src/app/api/user/profile/route.ts",
    "src/app/api/verifications/route.ts",
    "src/app/api/verifikationer/auto/route.ts",
    "src/hooks/use-auth.ts"
]

updated_count = 0
for f in files_to_check:
    full_path = os.path.join("/Users/rice/Development/startups/scope-ai", f)
    if os.path.exists(full_path):
        if update_file(full_path):
            print(f"Updated: {f}")
            updated_count += 1
    else:
        print(f"File not found: {f}")

print(f"Total updated: {updated_count}")

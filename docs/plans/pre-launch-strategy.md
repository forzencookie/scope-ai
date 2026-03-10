# Pre-Launch & Waitlist Strategy

## Goal
Implement a "Gated Account" pre-launch phase. Users can fully sign up and create an account, but cannot access the application dashboard or features until the official launch. 

Additionally, the application will no longer offer a "Free" or "Demo" tier. All users will eventually need a paid plan to access the core app (with a separate demo page planned for later).

## Architecture (Option B: Gated Full Accounts)

### 1. Environment Control
We will use an environment variable to control the application's state.
*   **Variable:** `PRE_LAUNCH_MODE`
*   **Pre-launch State:** `true`
*   **Live State:** `false`

### 2. User Flow & UI Changes
1.  **Landing Page:** Change primary Call-To-Action (CTA) buttons from "Buy Now" / "Subscribe" to "Join the Waitlist" or "Create Account for Early Access".
2.  **Pricing Section:** Completely hide the standard pricing cards using conditional rendering (`if (!PRE_LAUNCH_MODE)`). 
3.  **Authentication:** Users will go through the standard Sign-Up flow (email, password, OAuth, etc.) and their user record will be created in the database.
4.  **The Gate (Middleware/Guard):** Upon successful login, the application will check the `PRE_LAUNCH_MODE` variable.
    *   If `true`: The user is immediately redirected to a dedicated `/waiting-room` (or `/pending-access`) route. They cannot navigate to the dashboard or any protected routes.
    *   If `false`: Normal application flow.
5.  **Waiting Room Page:** A clean, branded page that confirms their account is created and states: *"You're on the list! We will email you as soon as we open up access."*

### 3. Removal of Free/Demo Tiers
*   The codebase will be updated to remove references to a "Free" subscription tier in the database schemas, pricing UI, and Stripe/payment logic.

---

## The Launch Checklist (How to transition to Live)

When you are ready to officially launch and open the floodgates, follow these steps:

1.  **Update Environment Variable:** Change `PRE_LAUNCH_MODE` from `true` to `false` in your production environment.
2.  **Deploy/Restart:** Ensure the server/frontend picks up the new environment variable.
3.  **Verify:** 
    *   Pricing plans are now visible on the landing page.
    *   New signups are directed to the payment flow / dashboard.
    *   Existing "Waitlist" users can now log in and access the payment flow / dashboard instead of the `/waiting-room`.
4.  **Email Campaign:** Export the list of users who signed up during pre-launch and send them the "We are live!" email.
5.  **Code Cleanup (Optional but recommended):** Once fully launched, you can remove the `PRE_LAUNCH_MODE` checks, the `/waiting-room` page component, and this strategy file from the codebase to keep things clean.
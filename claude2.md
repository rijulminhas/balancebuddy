Update the BalanceBuddy landing/home page authentication behavior:

1. When a user is NOT logged in:

   * Keep the current behavior.
   * Show "Sign In" and "Get Started" buttons.
   * Show "Create Your Group Free" CTA.
   * Show the final CTA section: "Ready to stop stressing about shared expenses?"

2. When a user IS logged in:

   * Replace the "Sign In" and "Get Started" buttons with a single clickable user profile button displaying:

     * User avatar
     * User name
     * User email
   * Clicking this profile button should redirect to `/dashboard`.
   * Hide the "Create Your Group Free" button/CTA.
   * Hide the final CTA section ("Ready to stop stressing about shared expenses?").

3. Remove any existing logic/middleware/redirects that automatically prevent logged-in users from accessing the landing/home page.

   * Logged-in users should be able to visit `/` normally.
   * Do not automatically redirect logged-in users from `/` to `/dashboard`.

4. Sidebar update:

   * Make the BalanceBuddy logo/brand section clickable.
   * Clicking the BalanceBuddy logo should navigate to `/` (landing/home page).

Requirements:

* Preserve existing styling and responsive design.
* Use the current authentication/session system.
* Avoid code duplication by conditionally rendering UI based on authentication state.
* Ensure no TypeScript, ESLint, or build errors are introduced.

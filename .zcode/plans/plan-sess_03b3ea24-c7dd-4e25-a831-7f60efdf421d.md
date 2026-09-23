The user wants to fix the About Us page in the Next.js project. The issues are:

1. The About Us page is still showing the broken UI from the old implementation
2. It's not connected to the navbars About Us link
3. The page needs to be updated with the two-section structure (GlobalZwItech and Why GlobalZwItech)

Based on my exploration of the codebase, I found:

1. **Existing About Component**: `/src/components/About.tsx` - This contains the old, broken implementation
2. **New About Page Route**: `/src/app/about/page.tsx` - This was created earlier but is not properly connected
3. **Navigation**: The Header component in `/src/components/Header.tsx` has NAV_LINKS that need to be updated to include About
4. **Main Layout**: The About component is already imported in `/src/app/(solaris)/page.tsx` as part of the main Home page

The fixes needed:

1. Update the About component to show the two-section structure (GlobalZwItech and Why GlobalZwItech)
2. Ensure the page has proper navigation links
3. Fix any broken styling or functionality
4. Update the navigation to properly highlight the About link

I should provide a clear plan for the user to implement these fixes.
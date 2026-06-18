Add a new **Group Chat** module to BalanceBuddy that allows members of a group to communicate with each other. The implementation must be fully compatible with the existing project architecture (Next.js, PostgreSQL, Drizzle ORM, NextAuth, Vercel deployment) and should not require WebSockets, Socket.IO, Firebase, or any paid third-party realtime service.

### Functional Requirements

#### Group Chat

* Add a new **Chat** tab/page inside each group.
* Only members of the group can view and send messages.
* Messages should be displayed in chronological order (oldest to newest).
* Show sender name, avatar, message content, and timestamp.
* Differentiate the current user's messages from other members' messages with modern chat bubble styling.
* Support multiline text messages.
* Prevent empty messages from being sent.
* Automatically scroll to the latest message when opening the chat.

#### Message Refresh

* Implement automatic message updates using polling.
* Fetch new messages every 5 seconds.
* Refresh only new messages to minimize database load.
* Show a subtle loading indicator while fetching updates.
* Ensure polling is optimized and does not cause unnecessary rerenders.

#### Database

Create a new chat messages table:

* id
* groupId
* senderId
* message
* createdAt
* updatedAt

Relationships:

* Message belongs to a group.
* Message belongs to a user.
* Cascade appropriately when groups are deleted.

Use Drizzle ORM schema definitions and migrations according to the existing project structure.

#### Backend APIs

Create secure APIs:

* Send Message
* Get Messages
* Get Latest Messages Since Timestamp

Requirements:

* Validate authenticated user.
* Verify user is a member of the group before accessing chat.
* Sanitize message input.
* Add proper error handling.
* Follow existing API patterns used in BalanceBuddy.

#### UI/UX

Create a modern, professional chat interface consistent with the BalanceBuddy design system.

Features:

* Sticky message input at bottom.
* Responsive design for desktop and mobile.
* Empty state when no messages exist.
* Smooth loading states.
* Message timestamps.
* Sender avatar or initials.
* Clean spacing and modern card-based design.
* Dark mode compatibility if supported by the project.

#### Notifications

For now:

* Do not implement WebSockets.
* Do not implement Firebase.
* Do not implement push notifications.

Structure the code so notifications can be added later without major refactoring.

but for now , we can use web push notifications as already implemented for other modules in this project 

#### Performance

* Use pagination or lazy loading for older messages.
* Load recent messages first.
* Optimize database queries.
* Prevent duplicate messages during polling.
* Ensure chat remains performant with thousands of messages.

#### Permissions & Security

* Only authenticated users can access chat.
* Only group members can read/send messages.
* Validate all inputs on server side.
* Protect APIs from unauthorized access.
* Follow existing project security patterns.

#### Integration

* Add a "Chat" navigation item within the group details page.
* Integrate seamlessly with existing group functionality.
* Follow existing folder structure, naming conventions, TypeScript types, components, hooks, server actions, and database architecture already used in BalanceBuddy.

Generate complete production-ready code including:

* Drizzle schema
* Migrations
* API routes/server actions
* TypeScript types
* React components
* Database queries
* Polling logic
* Loading states
* Error handling
* Responsive UI

The implementation must be deployable on Vercel without requiring any additional paid services or infrastructure.

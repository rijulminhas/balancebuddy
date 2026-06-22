Room History Enhancement

Problem:
Currently, if a user leaves and rejoins the same group multiple times, the Room History page displays multiple entries for the same group. This creates unnecessary duplicate records in the UI, clutters the history page, and provides a poor user experience.

Required Changes:

1. Display each group only once in Room History.

   * A group should appear only once regardless of how many times the user has joined or left it.
   * Room History should represent "groups the user has been a member of" rather than every join/leave event.

2. Maintain join/leave events internally if needed.

   * Historical membership events can still be stored for auditing and analytics purposes.
   * However, these events should not create duplicate entries in the Room History UI.

3. Rejoin functionality.

   * Users should still be able to rejoin a previously left group from the Room History page.
   * The existing rejoin workflow should continue to work.

4. Chronological ordering.

   * Room History should be sorted by the most recently left group first.
   * The group that the user left most recently should always appear at the top.
   * Example:

   Room History

   1. Flatmates Group (left today)
   2. Office Team (left 3 days ago)
   3. College Friends (left 2 weeks ago)

5. Group history metadata.

   * Each Room History entry should store and display:

     * Group name
     * Last left date/time
     * Group avatar (if available)
     * Rejoin action

6. Database optimization.

   * Avoid creating multiple Room History records for the same user-group combination.
   * Prefer maintaining a single history record per user-group pair.
   * Update the existing record whenever the user leaves the group again.

Suggested Structure:

## GroupHistory

id
userId
groupId
firstJoinedAt
lastLeftAt
joinCount
createdAt
updatedAt

Behavior:

* If a history record already exists for the user and group:

  * Update lastLeftAt.
  * Increment joinCount when applicable.
* Do not create duplicate Room History entries.

Expected Result:

* Cleaner UI.
* Reduced database redundancy.
* Faster Room History queries.
* Better user experience.
* Most recently left groups always appear at the top of the Room History list.

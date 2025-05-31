- ✅ Refactor context/note-context.tsx into smaller files without breaking any functionality. Make sure to delete any unused imports or files after the operation is done.

- ✅ Refactor context/note-operations.tsx into smaller files without breaking any functionality. Make sure to delete any unused imports or files after the operation is done.

- ✅ Move all 'note' contexts files into the context/notes folder and make sure to update all imports with the new file part.

- ✅ Improve the search functionality to also search by tags and categories. Complete this task without changing the UI design of the app. Make sure to refactor the file into smaller files when it goes above 250 lines of code without breaking any functionality. Make sure to delete any unused imports or files after the operation is done.

- ✅ The Filter by Tags should be redesigned into a button that displays a dropdown of tags and note count that user can click on to filter by tags. On the same line, add filter by Categories which should also be a dropdown button to display all categories and note count so that when user clicks on one, it filters.
The button should be designed to be a 'filter icon Tags' and 'filter icon Categories' 'filter icon Archives'
Add the Archives button but without any implementation as we will implement it next.
Make sure to refactor the file into smaller files when it goes above 250 lines of code without breaking any functionality. Make sure to delete any unused imports or files after the operation is done.

- ✅ Let's improve on how delete note works. When a note is deleted, delete its fields first before deleting the document, this way firebase firestore will prorperly remove the document. Also we need to allow for bulk delete, but we need to todo this without changing how our ui looks already since we're trying to maintain a very minimal uncluttered UI. Make sure to refactor the file into smaller files when it goes above 250 lines of code without breaking any functionality. Make sure to delete any unused imports or files after the operation is done.

- ✅ Components folder: create folders to organise the files in components folder for better manageability and structure. Make sure to refactor the file into smaller files when it goes above 250 lines of code without breaking any functionality. Make sure to delete any unused imports or files after the operation is done.

- ✅ On the sidebar, add tags filter and categories filter into a single filter button to reduce clutter. onclick of the filter icon, show filter by tags and categories. Add a sort button to sort by alphabetical order / date added / date updated last. Add the delete button for bulk delete. Implement this into the app but remove the archive button and replace with a delete button for bulk delete.
Remove that section that says 'Select Multiple' and let's use a delete button for it instead, when user clicks on it they'll be able to bulk delete.
Remember to keep it minimal, simple, straightforward, do not tamoer with existing design.

- ✅ Archive notes: add an option to details modal for user to archive notes. When note is archived, hide it from the list of notes on the sidebar. This means we will need to add archived? as a oolean prop to notes so that on our frontend we check if archived is true or false to know which notes to display on the sidebar and which one not to. Make sure to refactor the file into smaller files when it goes above 250 lines of code without breaking any functionality. Make sure to delete any unused imports or files after the operation is done.

- ✅ Best Way to Implement Edit History: Use autosave at a reasonable interval (every 30-60 seconds of inactivity, or when the user leaves the page).
    - Only save a new history entry if the content has changed significantly (e.g., more than X characters or X% difference). You could compare the current content to the last saved version and skip saving if changes are minor.
    - Only keep the last N versions (e.g., 10 or 20) per note to avoid unbounded growth.
    - Prune old versions beyond your retention policy.


-  ✅ Allow login and saving of notes for new users not just admin. Use 'users' collection for the new users while also maintaining the 'admin' and 'notes' collections for just admin. Improve on notes syncing, at no point in time should local storage override database storage. 

-  ✅ All users asides admin user should be given storage limit for their notes. each user gets a 10MB storage, and the file size per note should be calculated in order to track and manage users storage. 
Display an alert when user gets to 7mb+
Add a progress ba for them to be able to track their storage usage
Add this Storage to the ellipsis dropdown on the header so that when user clicks on it, a modal with info on storage will open for them to see details.
When user checks details for each note, display the file size for them as well on the first tab.

- ✅ Fix my editors both monaco and note-editor to use the global font selected. I have two fonts and i change between both from time to time so the editors should also use the selected note than a hard coded one.

---

### 1. Syncing Local Storage to Firebase Without Overwriting

- **Principle:**  
  Firebase (your database) is always the main source of truth for notes.  
  Local storage is just a temporary space for offline or unauthenticated users.

- **Sync Rule:**  
  When a user logs in, you should only sync notes from local storage to Firebase **if those notes do not already exist in Firebase**.  
  This prevents accidental overwriting of cloud data with old or stale local notes.

- **How to Identify Unique Notes:**  
  To check if a note from local storage already exists in Firebase, each note must have a unique identifier that doesn’t change.  
  To do this, give each note a unique ID (6-8 characters, like a random string or generated code) when it is created.  
  Whenever you sync, compare the IDs from local storage with those in Firebase:
    - If the Firebase database **does not** have a note with that ID, upload it.
    - If Firebase already has a note with that ID, do not overwrite it.

---

### 2. How to Implement Unique IDs

- When a note is created (even for guests/offline users), generate a unique string ID for it.  
- This ID is saved with the note both in local storage and, later, in Firebase.

- When the user logs in and you want to sync, for each local note:
   - Check if there is already a note with the same unique ID in Firebase.
   - Only upload notes that don’t exist in Firebase yet.

---

### 3. User Experience

- If a user has created notes while offline or before logging in, those notes will be safely uploaded to their account **without overwriting** any existing notes in their cloud storage.
- If the same note exists in both places (because it was synced before), it will never be duplicated or overwritten.

---

### 4. Summary

- Always use a unique 6-8 character ID for each note, added at creation time.
- When syncing, only upload local notes to Firebase if Firebase doesn’t already have a note with that ID.
- Never overwrite or merge notes with the same ID—Firebase is the source of truth for logged-in users.

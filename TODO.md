- Allow login and saving of notes for new users not just admin. Use 'users' collection.

- ✅ Refactor context/note-context.tsx into smaller files without breaking any functionality. Make sure to delete any unused imports or files after the operation is done.

- ✅ Refactor context/note-operations.tsx into smaller files without breaking any functionality. Make sure to delete any unused imports or files after the operation is done.

- ✅ Move all 'note' contexts files into the context/notes folder and make sure to update all imports with the new file part.

- ✅ Improve the search functionality to also search by tags and categories. Complete this task without changing the UI design of the app. Make sure to refactor the file into smaller files when it goes above 250 lines of code without breaking any functionality. Make sure to delete any unused imports or files after the operation is done.

- ✅ The Filter by Tags should be redesigned into a button that displays a dropdown of tags and note count that user can click on to filter by tags. On the same line, add filter by Categories which should also be a dropdown button to display all categories and note count so that when user clicks on one, it filters.
The button should be designed to be a 'filter icon Tags' and 'filter icon Categories' 'filter icon Archives'
Add the Archives button but without any implementation as we will implement it next.
Make sure to refactor the file into smaller files when it goes above 250 lines of code without breaking any functionality. Make sure to delete any unused imports or files after the operation is done.

- Let's improve on how delete note works. When a note is deleted, delete its fields first before deleting the document, this way firebase firestore will prorperly remove the document. Also we need to allow for bulk delete, but we need to todo this without changing how our ui looks already since we're trying to maintain a very minimal uncluttered UI. Make sure to refactor the file into smaller files when it goes above 250 lines of code without breaking any functionality. Make sure to delete any unused imports or files after the operation is done.

- Archive notes: add an option to details modal for user to archive notes. When note is archived, hide it from the list of notes on the sidebar. This means we will need to add archived? as a oolean prop to notes so that on our frontend we check if archived is true or false to know which notes to display on the sidebar and which one not to. Make sure to refactor the file into smaller files when it goes above 250 lines of code without breaking any functionality. Make sure to delete any unused imports or files after the operation is done.

- Components folder: create folders to organise the files in components folder for better manageability and structure. Make sure to refactor the file into smaller files when it goes above 250 lines of code without breaking any functionality. Make sure to delete any unused imports or files after the operation is done.
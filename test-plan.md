# Test Plan for Note Overwriting Bug Fix

## Test Scenarios

### Basic Functionality
- [ ] Create a new note, add content, and save it
- [ ] Switch to another note and verify the first note's content is preserved
- [ ] Switch back to the first note and verify its content is still preserved

### Rapid Switching
- [ ] Create two notes with distinct content
- [ ] Switch rapidly between them multiple times (10+)
- [ ] Verify both notes maintain their correct content

### Unsaved Changes
- [ ] Make changes to a note without saving
- [ ] Switch to another note
- [ ] Switch back to the first note and verify the unsaved changes are preserved
- [ ] Repeat with multiple notes

### Undo/Redo History
- [ ] Make several edits to a note
- [ ] Use undo multiple times
- [ ] Switch to another note
- [ ] Switch back to the first note and verify the undo history is preserved correctly

### Autosave Testing
- [ ] Make changes to a note and wait for autosave to trigger (60s)
- [ ] Switch to another note during autosave
- [ ] Verify both notes maintain their integrity

### Browser Refresh
- [ ] Make changes to a note
- [ ] Refresh the browser
- [ ] Verify the changes are preserved correctly

### Large Content
- [ ] Create a note with very large content (10,000+ characters)
- [ ] Make small changes at different points in the document
- [ ] Switch between notes
- [ ] Verify the large note maintains all changes correctly

## Edge Cases
- [ ] Test with maximum number of notes (if there is a limit)
- [ ] Test with notes that have embedded code blocks, images, and complex formatting
- [ ] Test with notes containing special characters
- [ ] Test with very small edits (single character changes)

## Regression Prevention
- [ ] Create unit tests for EditHistoryService
- [ ] Create unit tests for useEditHistory hook
- [ ] Create integration tests for note switching scenarios

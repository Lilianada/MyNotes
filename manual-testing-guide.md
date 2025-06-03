# Manual Testing Guide for Edit History Bug Fix

This document provides step-by-step instructions to verify the fix for the critical bug where content from one note was overwriting another when switching between notes.

## Prerequisites
- Start the application in development mode: `npm run dev`
- Have at least two distinct notes in your application

## Test Case 1: Basic Note Switching
1. Open the first note and add some unique content (e.g., "This is note 1 content")
2. Switch to a second note and add different content (e.g., "This is note 2 content")
3. Switch back to the first note
   - **Expected:** Content from note 1 should be preserved exactly
4. Switch back to the second note
   - **Expected:** Content from note 2 should be preserved exactly
5. Repeat switching several times to verify consistency

## Test Case 2: Rapid Note Switching
1. Create two notes with distinct content
2. Switch rapidly between them 10+ times (clicking back and forth quickly)
   - **Expected:** Each note should maintain its correct content regardless of switching speed

## Test Case 3: Unsaved Changes During Note Switch
1. Open the first note and make changes without explicitly saving
2. Immediately switch to the second note
3. Switch back to the first note
   - **Expected:** Unsaved changes to note 1 should still be present

## Test Case 4: Large Content Test
1. Create a note with very large content (paste 10,000+ characters)
2. Make small changes throughout the document
3. Switch to another note and back
   - **Expected:** All changes in the large note should be preserved

## Test Case 5: Multiple Edits and History
1. Open the first note and make several distinct edits
2. Use the undo feature multiple times
3. Switch to another note
4. Switch back to the first note
   - **Expected:** The undo history state should be preserved correctly

## Test Case 6: Browser Refresh Test
1. Make changes to a note without explicitly saving
2. Refresh the browser (F5)
   - **Expected:** Changes should be restored via autosave functionality

## Test Case 7: Session End Test
1. Make changes to multiple notes
2. Close the browser tab
3. Reopen the application
   - **Expected:** All notes should have their most recent content preserved

## Bug Reproduction Steps (For Verification)
The original bug occurred when:
1. User opened note A and made changes
2. User switched to note B without waiting for autosave
3. The content from note A would incorrectly appear in note B
4. Switching back to note A would show empty content or wrong content

**Expected Result After Fix:** This sequence should now work correctly, with each note maintaining its own content.

## What To Look For
- No content leaking between notes
- No empty notes appearing when there should be content
- No loss of changes when switching notes
- Proper autosave behavior for each note
- Clean undo/redo history per note

## If Issues Are Found
Document them with:
- Steps to reproduce
- Expected vs. actual behavior
- Browser console logs
- Screenshots if applicable

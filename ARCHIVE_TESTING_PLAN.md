# Archive Functionality Testing Plan

## Testing Status: ✅ READY FOR TESTING

### Components Modified:
1. ✅ **ArchivesDropdown** - `/components/filters/archives-dropdown.tsx` - FIXED and enabled
2. ✅ **Metadata Tab** - Archive checkbox functionality already implemented
3. ✅ **Note Filtering** - Logic to hide archived notes by default already implemented
4. ✅ **Note Context** - `updateNoteData` method for archive status already implemented

### Test Scenarios to Complete:

#### 1. Basic Archive Functionality ⏳
- [ ] Open note details modal 
- [ ] Navigate to metadata tab
- [ ] Test archive checkbox (check/uncheck)
- [ ] Verify note disappears from sidebar when archived
- [ ] Verify archive status persists on page refresh

#### 2. Archive Filter Testing ⏳  
- [ ] Test ArchivesDropdown in FilterSortToolbar
- [ ] Verify "Active Notes" filter (default) hides archived notes
- [ ] Verify "Archived Notes" filter shows only archived notes
- [ ] Verify "Show All Notes" filter shows both active and archived notes
- [ ] Test filter visual indicators (blue background when active)

#### 3. Unarchive Functionality ⏳
- [ ] Archive a note
- [ ] Use ArchivesDropdown to view "Archived Notes" 
- [ ] Open archived note details → metadata tab
- [ ] Uncheck archive checkbox
- [ ] Verify note appears in "Active Notes" filter

#### 4. Data Persistence Testing ⏳
- [ ] Archive notes and refresh page
- [ ] Test in localStorage mode (non-admin user)
- [ ] Test in Firebase mode (if admin user available)
- [ ] Verify archive status persists across sessions

#### 5. Edge Cases ⏳
- [ ] Archive all notes - verify empty state in active filter
- [ ] Create new note while in archived filter view
- [ ] Test archive with notes that have tags/categories
- [ ] Test archive with linked notes
- [ ] Test bulk operations with archived notes

### Application Status:
- ✅ Server running on http://localhost:3002
- ✅ No compilation errors
- ✅ ArchivesDropdown component fixed and enabled
- 🔄 Ready for manual browser testing

### Next Steps:
1. ✅ Open application in browser (http://localhost:3002)
2. ⏳ Create/verify test notes exist
3. ⏳ Execute test scenarios systematically
4. ⏳ Document any issues found
5. ⏳ Verify complete end-to-end workflow

## TESTING PROGRESS LOG:

### Phase 1: Initial Setup ✅
**Status:** COMPLETED
- [x] Application server running on port 3002 (HTTP 200 ✅)
- [x] Simple Browser opened at http://localhost:3002 ✅
- [x] ArchivesDropdown component fixed and enabled ✅
- [x] No compilation errors ✅
- ⏳ **NEXT:** Manual verification needed in browser

## MANUAL TESTING INSTRUCTIONS:

### Step 1: Verify Application State
**In the browser at http://localhost:3002:**
1. ✅ Check if sidebar shows notes list
2. ✅ If no notes exist, create 3 test notes using the "+ New Note" button:
   - "Test Note 1 - Archive Testing"
   - "Test Note 2 - Filter Testing" 
   - "Test Note 3 - Persistence Testing"
3. ✅ Verify FilterSortToolbar shows the ArchivesDropdown button
4. ✅ Note the current button text (should show "Active" by default)

### Step 2: First Archive Test
**Archive functionality verification:**
1. ✅ Select any test note from sidebar
2. ✅ Click the "ⓘ" (info) button to open note details modal
3. ✅ Click on "Metadata" tab
4. ✅ Find the "Archive" checkbox
5. ✅ Check the archive checkbox
6. ✅ Click "Save" or close modal
7. ✅ **VERIFY:** Note should disappear from sidebar
8. ✅ **VERIFY:** ArchivesDropdown button should still show "Active"

### Step 3: Filter Testing
**Test the ArchivesDropdown filter:**
1. ✅ Click the ArchivesDropdown button in FilterSortToolbar
2. ✅ **VERIFY:** Dropdown shows options: "Show All Notes", "Active Notes", "Archived Notes"
3. ✅ Click "Archived Notes"
4. ✅ **VERIFY:** Only archived note(s) appear in sidebar
5. ✅ **VERIFY:** Button text changes to "Archived" with blue background
6. ✅ Click "Show All Notes"
7. ✅ **VERIFY:** Both active and archived notes visible
8. ✅ **VERIFY:** Button text changes to "All" with blue background

### Phase 2: Archive Checkbox Testing ⏳
**Status:** PENDING
- [ ] **Test Case 1:** Archive a note via metadata tab
  - Open any note details modal
  - Navigate to metadata tab
  - Check archive checkbox
  - Verify note disappears from sidebar
  - Document result: ✅/❌
- [ ] **Test Case 2:** Verify archive persistence
  - Refresh page after archiving
  - Verify archived note still missing from sidebar
  - Document result: ✅/❌

### Phase 3: Archive Filter Testing ⏳
**Status:** PENDING
- [ ] **Test Case 3:** Test ArchivesDropdown filter states
  - Verify "Active Notes" filter shows non-archived notes only
  - Test "Archived Notes" filter shows archived notes only
  - Test "Show All Notes" filter displays both types
  - Document filter behavior: ✅/❌
- [ ] **Test Case 4:** Visual indicators
  - Verify button text changes: "Active", "Archived", "All"
  - Verify blue background when filter is active
  - Document UI feedback: ✅/❌

### Phase 4: Unarchive Functionality ⏳
**Status:** PENDING
- [ ] **Test Case 5:** Unarchive workflow
  - Set filter to "Archived Notes"
  - Open archived note → metadata tab
  - Uncheck archive checkbox
  - Verify note appears in "Active Notes" filter
  - Document unarchive flow: ✅/❌

### Phase 5: Data Persistence Testing ⏳
**Status:** PENDING
- [ ] **Test Case 6:** Cross-session persistence
  - Archive/unarchive notes
  - Close and reopen browser
  - Verify archive states preserved
  - Document persistence: ✅/❌

### Phase 6: Edge Cases ⏳
**Status:** PENDING
- [ ] **Test Case 7:** Archive all notes scenario
  - Archive every note
  - Verify empty state in "Active Notes" filter
  - Create new note while in archived view
  - Document behavior: ✅/❌

### Key Files for Reference:
- `/components/filters/archives-dropdown.tsx` - Archive filter dropdown
- `/components/note-details/metadata-tab-content.tsx` - Archive checkbox
- `/components/sidebar/note-filtering.ts` - Filtering logic
- `/contexts/notes/note-context.tsx` - Note management context
- `/contexts/notes/note-hooks.tsx` - Hook implementations

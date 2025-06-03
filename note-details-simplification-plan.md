# Note Details Simplification Plan

The current note details implementation is highly fragmented across multiple files:
- `note-details.tsx`
- `note-details-tabs.tsx`
- `details-tab-content.tsx`
- `metadata-tab-content.tsx`
- `tags-tab-content.tsx`
- `category-tab-content.tsx`
- `note-details-hooks.ts`
- `category-handlers.ts`
- `tags-handlers.ts`
- `metadata-handlers.ts`

This structure creates excessive fragmentation and makes it difficult to follow the flow of data.

## Proposed Changes

### 1. Simplify Tab Structure

Reduce the number of tab-related components by:
- Merging `note-details-tabs.tsx` into `note-details.tsx`
- Using a simpler tab implementation with fewer props

### 2. Consolidate Handler Logic

Create a single handler file to replace:
- `category-handlers.ts`
- `tags-handlers.ts`  
- `metadata-handlers.ts`

### 3. Reduce Hook Complexity

- Combine related functionality into fewer, more focused hooks
- Remove unnecessary state management where possible

### Implementation Steps

1. Create a single, simplified hook for all note details functionality
2. Refactor the tab content components to use less state and props
3. Consider merging some tab content files where appropriate

### Expected Benefits

- Simplified component structure
- Reduced prop-drilling
- Fewer state synchronization issues
- Improved maintainability

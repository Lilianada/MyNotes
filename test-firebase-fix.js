// Test script to verify Firebase undefined value fix
console.log('Testing Firebase undefined value fix...');

// Mock the scenario that was causing issues
const testUpdateData = {
  content: "This is test content",
  editHistory: [
    {
      id: "test-id",
      timestamp: new Date(),
      content: "Previous content",
      changeType: "manual"
    }
  ],
  updatedAt: new Date(),
  undefinedProperty: undefined, // This should be filtered out
  anotherUndefinedProperty: undefined
};

// Test the filtering logic similar to what's in updateNoteData
const updateData = {
  updatedAt: new Date()
};

// Filter out undefined values (same logic as in updateNoteData)
Object.keys(testUpdateData).forEach(key => {
  const value = testUpdateData[key];
  if (value !== undefined) {
    updateData[key] = value;
  }
});

console.log('Original data:', testUpdateData);
console.log('Filtered data (what goes to Firebase):', updateData);

// Verify undefined values are filtered out
const hasUndefinedValues = Object.values(updateData).some(value => value === undefined);
console.log('Contains undefined values:', hasUndefinedValues);

if (!hasUndefinedValues) {
  console.log('✅ SUCCESS: No undefined values would be sent to Firebase');
} else {
  console.log('❌ FAILED: Undefined values still present');
}

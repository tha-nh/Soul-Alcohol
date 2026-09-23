// Jest runs on Node with no native TurboModule registered, so component
// smoke tests need a stand-in instead of the real op-sqlite binding.
// Actual query behavior is exercised on-device, not in this unit test.
const noopResult = { rows: [], rowsAffected: 0 };

function createMockDb() {
  return {
    execute: jest.fn().mockResolvedValue(noopResult),
    executeSync: jest.fn().mockReturnValue(noopResult),
    close: jest.fn(),
    closeAsync: jest.fn().mockResolvedValue(undefined),
  };
}

module.exports = {
  open: jest.fn(() => createMockDb()),
  openAsync: jest.fn(async () => createMockDb()),
};

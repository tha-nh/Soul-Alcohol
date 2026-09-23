/**
 * Section 50: lets the whole app flow (including alerts) be demoed and
 * tested end to end before real sensors/AI models exist (Phase 9-13).
 * Flip to false once real analysis engines are wired in.
 */
export const DEV_SIMULATION_MODE = true;

// Section 50 example decline curve: 100 → 80 → 65 → 50 → 35.
export const SIMULATED_SCORE_SEQUENCE: readonly number[] = [
  100, 96, 91, 85, 80, 74, 68, 65, 60, 55, 50, 44, 38, 35, 35, 35,
];

export const SIMULATION_TICK_MS = 3000;

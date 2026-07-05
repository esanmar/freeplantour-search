export const CHAT_ID = 'search' as const

// Shown instead of the raw "No enabled model is available" — this is a
// deployment-configuration issue (no AI provider key set), not something an
// end user (or a FreePlanTour destination-page visitor) can act on, but it
// should still be clear rather than a bare technical error string.
export const NO_MODEL_AVAILABLE_MESSAGE =
  'The assistant is not configured yet. Please check the AI provider settings.'

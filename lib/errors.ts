// Turns database error codes (raised inside supabase/schema.sql) into plain messages for parents and admins.
const MESSAGES: Record<string, string> = {
  CONSENT_REQUIRED: "Please tick the parent consent box to continue.",
  PACKAGE_UNAVAILABLE: "This package is no longer available. Please choose another one.",
  PRICE_CHANGED: "The price of this package was just updated. We have refreshed it — please review the new total and continue.",
  PROGRAM_UNAVAILABLE: "This program is not open for enrollment right now.",
  BAD_AGE: "Please enter a valid student age.",
  MISSING_DETAILS: "Please fill in all required details.",
  AGE_GROUP_REQUIRED: "Please choose an age group.",
  AGE_GROUP_MISMATCH: "The student's age does not fit the selected age group. Please pick the group that matches the age.",
  GRADE_REQUIRED: "Please select the student's school grade.",
  SUBJECT_REQUIRED: "Please select the tuition subject.",
  SEATS_FULL: "Sorry, all seats for this choice are full right now. Please message us on WhatsApp to join the waiting list.",
  ENROLLMENT_NOT_FOUND: "We could not find this enrollment.",
  ALREADY_VERIFIED: "This payment is already verified.",
  ALREADY_SUBMITTED: "You have already submitted payment details for this enrollment. We are verifying it.",
  ENROLLMENT_CLOSED: "This enrollment is closed. Please start a new enrollment.",
  BAD_TXN: "Please enter the full transaction ID / reference number.",
  RECEIPT_REQUIRED: "Please upload a photo or screenshot of your payment receipt.",
  TXN_REUSED: "This transaction ID has already been used for another enrollment. Please check it and try again.",
  PAYMENT_NOT_FOUND: "Payment not found.",
  PAYMENT_NOT_PENDING: "This payment is not waiting for verification.",
  SHORT_PAYMENT: "The amount received is less than the amount payable, so it cannot be approved.",
  PAYMENT_NOT_VERIFIED: "A student cannot be enrolled without a verified payment.",
  FEE_LOCKED: "The fee charged at checkout cannot be changed.",
  ENROLLMENT_PROTECTED: "Paid enrollments cannot be deleted because they are money records. Use Mark refunded instead.",
  NOT_ENROLLED: "Only students with a verified payment can be placed in a class or refunded.",
  BATCH_FULL: "That class batch is full.",
  BATCH_NOT_FOUND: "That class batch was not found or is inactive.",
  BATCH_WRONG_PROGRAM: "That batch belongs to a different program.",
  BATCH_WRONG_CLASS_TYPE: "That batch is for a different class type (group / private).",
};

export function friendly(err: { message?: string } | null | undefined, fallback = "Something went wrong. Please try again."): string {
  const m = err?.message || "";
  for (const k of Object.keys(MESSAGES)) if (m.includes(k)) return MESSAGES[k];
  return fallback;
}

export function errorCode(err: { message?: string } | null | undefined): string | null {
  const m = err?.message || "";
  return Object.keys(MESSAGES).find((k) => m.includes(k)) ?? null;
}

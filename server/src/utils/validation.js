import mongoose from 'mongoose';

export function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

export function isPositiveInteger(value) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function isNonNegativeInteger(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export function isNonEmptyString(value, maxLength = 200) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

// Minimum bar: 8+ chars, at least one letter and one number. Rejects
// non-string input outright (e.g. `{"$ne": null}`), which is what stops a
// type-confusion crash on endpoints that don't already call isNonEmptyString
// first.
export function isStrongPassword(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 200) return false;
  return /[A-Za-z]/.test(value) && /[0-9]/.test(value);
}

// Builds a fresh object from only the known shippingAddress fields — never
// spreads the raw request body, so unexpected keys or operator-shaped
// values (e.g. `{ "$ne": null }`) can never reach a Mongo query or a save.
export function sanitizeShippingAddress(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;

  const { name, line1, city, postcode } = input;
  if (![name, line1, city, postcode].every((v) => isNonEmptyString(v, 120))) return null;

  return {
    name: name.trim(),
    line1: line1.trim(),
    city: city.trim(),
    postcode: postcode.trim(),
  };
}

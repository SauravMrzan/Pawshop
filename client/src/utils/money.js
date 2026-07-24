const formatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function formatPence(pence) {
  return `Rs ${formatter.format(pence / 100)}`;
}

// Admin forms take a plain Rs amount from the user and need to send pence to the API.
export function rupeesToPence(rupees) {
  return Math.round(Number(rupees) * 100);
}

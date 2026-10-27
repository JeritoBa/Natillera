// UI-16: lists hide cancelled records by default. Hiding is a VIEW only: balances, guards and form helpers keep using every record.

// Records behind the select options (month, member, borrower, type): live records by default, the cancelled ones in the "Anulados" view.
export function optionSource<T>(records: T[], isCancelled: (record: T) => boolean, showingCancelled: boolean): T[] {
  return records.filter(record => isCancelled(record) === showingCancelled)
}

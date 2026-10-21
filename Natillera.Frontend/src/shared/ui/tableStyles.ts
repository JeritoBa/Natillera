// UI-06: one table pattern for every list (reference: LoansPage).
// Mobile (< 640 px): main cell + amount + actions, with a small line below the main cell.
// Tablet/laptop (640-1279 px): adds the status column, one key secondary column and the eye button.
// Desktop (>= 1280 px): all columns.
export const tableCardStyle = { background: '#fff', border: '1px solid #d6e8dc' }
export const tableHeadStyle = { borderBottom: '1px solid #eef4f0', background: '#f8fbf8' }

export const tableWrap = 'rounded-xl overflow-hidden'
export const tableScroll = 'overflow-x-auto'
export const headCell = 'py-3 text-[#4e7460] text-xs font-medium'

// Visibility of secondary columns.
export const colTablet = 'hidden sm:table-cell'
export const colDesktop = 'hidden xl:table-cell'

// Cell padding: first cell pl-3 sm:pl-5, last cell pr-3 sm:pr-5.
export const cellFirst = 'pl-3 pr-3 sm:pl-5 sm:pr-4'
export const cell = 'px-3 sm:px-4'
export const cellLast = 'pl-3 pr-3 sm:pl-4 sm:pr-5'

export const cellMain = 'max-w-0 sm:max-w-none'
export const mainLink = 'block truncate sm:inline sm:whitespace-normal sm:pointer-events-none font-medium text-[#0c1a12] hover:underline sm:hover:no-underline focus-visible:outline-2 focus-visible:outline-[#0c5c38] rounded'
export const subMobile = 'sm:hidden text-xs text-[#4e7460] mt-0.5 flex items-center gap-1.5 flex-wrap'
export const subTablet = 'hidden sm:flex xl:hidden flex-wrap gap-x-1.5 text-xs text-[#4e7460] mt-0.5'
export const cellAmount = 'text-right mono whitespace-nowrap'
export const cellActions = 'text-right w-px whitespace-nowrap'

// Icon buttons are at least 40 x 40 px at every width.
export const iconButton = 'btn-ghost p-2 rounded-md min-w-10 min-h-10 inline-flex items-center justify-center'
export const dangerButton = 'btn-danger p-2 rounded-md min-w-10 min-h-10 inline-flex items-center justify-center'
export const eyeButton = 'btn-ghost p-2 rounded-md min-w-10 min-h-10 hidden sm:inline-flex items-center justify-center'

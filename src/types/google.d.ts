// Google Identity Services type declarations
interface GoogleAccountsId {
  initialize: (config: {
    client_id: string
    callback: (response: { credential: string }) => void
    auto_select?: boolean
  }) => void
  prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void
}

interface GoogleAccounts {
  id: GoogleAccountsId
}

declare global {
  var google: {
    accounts: GoogleAccounts
  } | undefined
}

export {}

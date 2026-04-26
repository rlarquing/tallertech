// Google Identity Services type declarations
interface GoogleAccountsId {
  initialize: (config: {
    client_id: string
    callback: (response: { credential: string }) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
  }) => void
  prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void
  renderButton: (parent: HTMLElement, options: {
    theme?: 'outline' | 'filled_blue' | 'filled_black'
    size?: 'large' | 'medium' | 'small'
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
    shape?: 'rectangular' | 'pill' | 'circle' | 'square'
    logo_alignment?: 'left' | 'center'
    width?: string
    local_policy?: 'single_host_origin'
  }) => void
}

interface GoogleAccounts {
  id: GoogleAccountsId
  oauth2: {
    initTokenClient: (config: {
      client_id: string
      scope?: string
      callback: (response: { access_token: string }) => void
    }) => { requestAccessToken: () => void }
  }
}

declare global {
  var google: {
    accounts: GoogleAccounts
  } | undefined
}

export {}

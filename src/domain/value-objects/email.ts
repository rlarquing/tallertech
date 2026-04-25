import { InvalidEmailError } from '../errors'

/**
 * Email Value Object
 * Validates format on creation and encapsulates email behavior.
 */
export class Email {
  private constructor(private readonly address: string) {
    this.address = address.toLowerCase().trim()
  }

  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  /** Create an Email instance, throws InvalidEmailError if format is invalid */
  static create(address: string): Email {
    const trimmed = address.trim().toLowerCase()
    if (!Email.EMAIL_REGEX.test(trimmed)) {
      throw new InvalidEmailError(address)
    }
    return new Email(trimmed)
  }

  /** Check equality with another Email instance */
  equals(other: Email): boolean {
    return this.address === other.address
  }

  /** Get the string representation of the email */
  toString(): string {
    return this.address
  }

  /** Get the domain part of the email (after @) */
  getDomain(): string {
    return this.address.split('@')[1]
  }

  valueOf(): string {
    return this.address
  }
}

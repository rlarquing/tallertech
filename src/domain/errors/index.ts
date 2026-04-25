/**
 * Domain Errors
 * Business rule violation errors for the domain layer.
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`, 'ENTITY_NOT_FOUND')
  }
}

export class InsufficientStockError extends DomainError {
  constructor(
    productName: string,
    requested: number,
    available: number,
  ) {
    super(
      `Stock insuficiente para ${productName}. Solicitado: ${requested}, Disponible: ${available}`,
      'INSUFFICIENT_STOCK',
    )
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(
      `Transición de estado inválida: ${from} → ${to}`,
      'INVALID_STATE_TRANSITION',
    )
  }
}

export class DuplicateSkuError extends DomainError {
  constructor(sku: string) {
    super(
      `Ya existe un producto con SKU: ${sku}`,
      'DUPLICATE_SKU',
    )
  }
}

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`Email inválido: ${email}`, 'INVALID_EMAIL')
  }
}

export class AuthenticationError extends DomainError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR')
  }
}

export class AuthorizationError extends DomainError {
  constructor(message: string) {
    super(message, 'AUTHORIZATION_ERROR')
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
  }
}

// ============================================================
// Code Generator - Generates unique codes for sales and repairs
// Clean Architecture: Infrastructure Layer - Services
// ============================================================

export class CodeGenerator {
  /**
   * Generate a unique sale code (VEN-XXXX...)
   */
  generateSaleCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `VEN-${timestamp.slice(-4)}${random}`
  }

  /**
   * Generate a unique repair order code (REP-XXXX...)
   */
  generateRepairCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `REP-${timestamp.slice(-4)}${random}`
  }
}

// Singleton instance for convenience
export const codeGenerator = new CodeGenerator()

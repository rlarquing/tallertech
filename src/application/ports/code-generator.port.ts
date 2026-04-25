// ============================================================
// Code Generator Port - Interface for generating business codes
// Clean Architecture: Application Business Rules Layer
// ============================================================

export interface CodeGeneratorPort {
  generateSaleCode(): string
  generateRepairCode(): string
}

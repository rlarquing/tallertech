/**
 * Setting Entity
 * Simple key-value business setting.
 */
export class Setting {
  private constructor(
    public readonly id: string,
    public key: string,
    private _value: string,
  ) {}

  static create(params: { id: string; key: string; value: string }): Setting {
    return new Setting(params.id, params.key, params.value)
  }

  /** Get the setting value */
  get value(): string {
    return this._value
  }

  /** Update the setting value */
  updateValue(newValue: string): void {
    this._value = newValue
  }

  /** Check if the value is a boolean-like string */
  isBoolean(): boolean {
    return ['true', 'false', '1', '0'].includes(this._value.toLowerCase())
  }

  /** Get the value as a boolean */
  getBooleanValue(): boolean {
    return ['true', '1'].includes(this._value.toLowerCase())
  }

  /** Get the value as a number */
  getNumberValue(): number {
    const num = Number(this._value)
    return isNaN(num) ? 0 : num
  }

  /** Serialize to a plain object matching the original interface shape */
  toPlainObject() {
    return {
      id: this.id,
      key: this.key,
      value: this.value,
    }
  }
}

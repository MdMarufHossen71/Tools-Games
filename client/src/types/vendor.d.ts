/** Minimal shapes for untyped third-party modules (Wave 2+ lazy chunks). */
declare module "papaparse" {
  const Papa: {
    parse<T = Record<string, string>>(input: string, config?: Record<string, unknown>): {
      data: T[];
      errors: Array<{ message: string }>;
      meta: { fields?: string[] };
    };
    unparse(data: unknown, config?: Record<string, unknown>): string;
  };
  export default Papa;
}

declare module "iban" {
  const IBAN: { isValid(input: string): boolean };
  export default IBAN;
}

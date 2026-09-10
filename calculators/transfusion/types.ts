export type Species = "dog" | "cat";
export type Product = "wholeBlood" | "pRbc" | "plasma";
export type History = "none" | "yes" | "unknown";
export type Input = string | number;
export type Warning = { severity: "error" | "caution" | "info"; message: string };
export type RbcInput = { species: Species; product: Exclude<Product, "plasma">; weight: Input; current: Input; target: Input; productPcv: Input; ebvOverride?: Input };

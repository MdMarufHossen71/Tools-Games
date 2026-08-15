export type PercentageMode = "of" | "is" | "increase" | "decrease";
export type AreaShape = "circle" | "rectangle" | "triangle";

const precedence: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2, "^": 3 };
const operators = new Set(Object.keys(precedence));

function tokenize(expression: string) {
  const raw = expression.replace(/×/g, "*").replace(/÷/g, "/").replace(/,/g, "").replace(/\s+/g, "");
  if (!raw || !/^[\d.+\-*/%^()]+$/.test(raw)) throw new Error("Unsupported expression");
  const tokens = raw.match(/\d*\.?\d+|[()+\-*/%^]/g) ?? [];
  if (tokens.join("") !== raw) throw new Error("Invalid expression");
  return tokens;
}

/** Evaluate a constrained arithmetic expression without `eval` or dynamic code execution. */
export function evaluateExpression(expression: string) {
  const output: string[] = [];
  const stack: string[] = [];
  let expectValue = true;

  for (const token of tokenize(expression)) {
    if (/^\d/.test(token) || token === ".") {
      output.push(token);
      expectValue = false;
      continue;
    }
    if (token === "(") { stack.push(token); expectValue = true; continue; }
    if (token === ")") {
      while (stack.length && stack.at(-1) !== "(") output.push(stack.pop()!);
      if (stack.pop() !== "(") throw new Error("Mismatched parentheses");
      expectValue = false;
      continue;
    }
    if (!operators.has(token)) throw new Error("Unsupported operator");
    if (expectValue && token === "-") output.push("0");
    else if (expectValue) throw new Error("Missing value");
    while (stack.length && operators.has(stack.at(-1)!) && (precedence[stack.at(-1)!] > precedence[token] || (precedence[stack.at(-1)!] === precedence[token] && token !== "^"))) output.push(stack.pop()!);
    stack.push(token);
    expectValue = true;
  }
  if (expectValue) throw new Error("Missing value");
  while (stack.length) {
    const item = stack.pop()!;
    if (item === "(") throw new Error("Mismatched parentheses");
    output.push(item);
  }
  const values: number[] = [];
  for (const token of output) {
    if (!operators.has(token)) { values.push(Number(token)); continue; }
    const right = values.pop(); const left = values.pop();
    if (left === undefined || right === undefined) throw new Error("Invalid expression");
    if ((token === "/" || token === "%") && right === 0) throw new Error("Cannot divide by zero");
    const value = token === "+" ? left + right : token === "-" ? left - right : token === "*" ? left * right : token === "/" ? left / right : token === "%" ? left % right : left ** right;
    if (!Number.isFinite(value)) throw new Error("Result is too large");
    values.push(value);
  }
  if (values.length !== 1 || !Number.isFinite(values[0])) throw new Error("Invalid expression");
  return values[0];
}

export function formatMath(value: number, maximumFractionDigits = 10) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en", { maximumFractionDigits, useGrouping: false }).format(value);
}

export function percentageResult(mode: PercentageMode, first: number, second: number) {
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
  if (mode === "of") return first * second / 100;
  if (mode === "is") return second === 0 ? null : first / second * 100;
  return first * (mode === "increase" ? 1 + second / 100 : 1 - second / 100);
}

export function areaResult(shape: AreaShape, first: number, second: number) {
  if (!Number.isFinite(first) || first < 0 || !Number.isFinite(second) || second < 0) return null;
  if (shape === "circle") return Math.PI * first ** 2;
  if (shape === "rectangle") return first * second;
  return first * second / 2;
}

export function angleToRadians(value: number, mode: "deg" | "rad") {
  return mode === "deg" ? value * Math.PI / 180 : value;
}

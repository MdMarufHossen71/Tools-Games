export type UTMParameters = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

export function buildTrackedUrl(target: string, parameters: UTMParameters) {
  const url = new URL(target);
  const entries = Object.entries(parameters) as Array<[keyof UTMParameters, string | undefined]>;
  for (const [key, value] of entries) {
    const clean = value?.trim();
    if (clean) url.searchParams.set(`utm_${key}`, clean);
  }
  return url.toString();
}

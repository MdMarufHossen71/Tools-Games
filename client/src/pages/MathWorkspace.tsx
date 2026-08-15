import { Copy, Delete, History, RotateCcw } from "lucide-react";
import React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { angleToRadians, areaResult, evaluateExpression, formatMath, percentageResult, type AreaShape, type PercentageMode } from "@/lib/mathWorkspaces";
import type { Locale } from "@/i18n";
import "@/math-workspace.css";

type MathToolSlug = "calculator" | "scientific-calculator" | "percentage-calculator" | "area-calculator" | "trigonometry";
type AngleMode = "deg" | "rad";

const localized = {
  en: { calculator: "Calculator", scientific: "Scientific calculator", percentage: "Percentage calculator", area: "Area calculator", trig: "Trigonometry", clear: "Clear", reset: "Reset", history: "Recent calculations", noHistory: "Your completed calculations will appear here.", copy: "Copy result", copied: "Result copied", error: "Check the expression and try again.", degrees: "Degrees", radians: "Radians", number: "Number", percent: "Percent", result: "Result", shape: "Shape", radius: "Radius", width: "Width", height: "Height", base: "Base", circle: "Circle", rectangle: "Rectangle", triangle: "Triangle", angle: "Angle", sine: "Sine", cosine: "Cosine", tangent: "Tangent", undefined: "Undefined", use: "Use this result", of: "What is B% of A?", is: "A is what % of B?", increase: "Increase A by B%", decrease: "Decrease A by B%" },
  bn: { calculator: "ক্যালকুলেটর", scientific: "বৈজ্ঞানিক ক্যালকুলেটর", percentage: "শতকরা ক্যালকুলেটর", area: "ক্ষেত্রফল ক্যালকুলেটর", trig: "ত্রিকোণমিতি", clear: "মুছুন", reset: "রিসেট", history: "সাম্প্রতিক হিসাব", noHistory: "সম্পন্ন হিসাব এখানে দেখা যাবে।", copy: "ফল কপি করুন", copied: "ফল কপি হয়েছে", error: "এক্সপ্রেশনটি যাচাই করে আবার চেষ্টা করুন।", degrees: "ডিগ্রি", radians: "রেডিয়ান", number: "সংখ্যা", percent: "শতকরা", result: "ফল", shape: "আকৃতি", radius: "ব্যাসার্ধ", width: "প্রস্থ", height: "উচ্চতা", base: "ভূমি", circle: "বৃত্ত", rectangle: "আয়তক্ষেত্র", triangle: "ত্রিভুজ", angle: "কোণ", sine: "সাইন", cosine: "কোসাইন", tangent: "ট্যানজেন্ট", undefined: "সংজ্ঞায়িত নয়", use: "এই ফল ব্যবহার করুন", of: "A-এর B% কত?", is: "B-এর কত শতাংশ A?", increase: "A-কে B% বাড়ান", decrease: "A-কে B% কমান" },
  hi: { calculator: "कैलकुलेटर", scientific: "वैज्ञानिक कैलकुलेटर", percentage: "प्रतिशत कैलकुलेटर", area: "क्षेत्रफल कैलकुलेटर", trig: "त्रिकोणमिति", clear: "साफ़ करें", reset: "रीसेट", history: "हाल की गणनाएँ", noHistory: "पूर्ण गणनाएँ यहाँ दिखाई देंगी।", copy: "परिणाम कॉपी करें", copied: "परिणाम कॉपी हो गया", error: "अभिव्यक्ति जाँचें और फिर प्रयास करें।", degrees: "डिग्री", radians: "रेडियन", number: "संख्या", percent: "प्रतिशत", result: "परिणाम", shape: "आकार", radius: "त्रिज्या", width: "चौड़ाई", height: "ऊँचाई", base: "आधार", circle: "वृत्त", rectangle: "आयत", triangle: "त्रिभुज", angle: "कोण", sine: "साइन", cosine: "कोसाइन", tangent: "टैन्जेंट", undefined: "अपरिभाषित", use: "यह परिणाम उपयोग करें", of: "A का B% कितना है?", is: "B का कितने % A है?", increase: "A को B% बढ़ाएँ", decrease: "A को B% घटाएँ" },
  ur: { calculator: "کیلکولیٹر", scientific: "سائنسی کیلکولیٹر", percentage: "فیصد کیلکولیٹر", area: "رقبہ کیلکولیٹر", trig: "مثلثیات", clear: "صاف کریں", reset: "ری سیٹ", history: "حالیہ حساب", noHistory: "مکمل حساب یہاں ظاہر ہوں گے۔", copy: "نتیجہ کاپی کریں", copied: "نتیجہ کاپی ہو گیا", error: "اظہار جانچیں اور دوبارہ کوشش کریں۔", degrees: "ڈگری", radians: "ریڈین", number: "عدد", percent: "فیصد", result: "نتیجہ", shape: "شکل", radius: "رداس", width: "چوڑائی", height: "اونچائی", base: "بنیاد", circle: "دائرہ", rectangle: "مستطیل", triangle: "مثلث", angle: "زاویہ", sine: "سائن", cosine: "کوسائن", tangent: "ٹینجنٹ", undefined: "غیر متعین", use: "یہ نتیجہ استعمال کریں", of: "A کا B% کتنا ہے؟", is: "B کا کتنے فیصد A ہے؟", increase: "A میں B% اضافہ کریں", decrease: "A میں B% کمی کریں" },
  ar: { calculator: "آلة حاسبة", scientific: "آلة حاسبة علمية", percentage: "حاسبة النسبة المئوية", area: "حاسبة المساحة", trig: "حساب المثلثات", clear: "مسح", reset: "إعادة ضبط", history: "الحسابات الأخيرة", noHistory: "ستظهر الحسابات المكتملة هنا.", copy: "نسخ النتيجة", copied: "تم نسخ النتيجة", error: "تحقق من التعبير وحاول مرة أخرى.", degrees: "درجات", radians: "راديان", number: "العدد", percent: "النسبة المئوية", result: "النتيجة", shape: "الشكل", radius: "نصف القطر", width: "العرض", height: "الارتفاع", base: "القاعدة", circle: "دائرة", rectangle: "مستطيل", triangle: "مثلث", angle: "الزاوية", sine: "جيب", cosine: "جيب التمام", tangent: "ظل", undefined: "غير معرّف", use: "استخدم هذه النتيجة", of: "كم يساوي B% من A؟", is: "A يساوي كم % من B؟", increase: "زيادة A بنسبة B%", decrease: "إنقاص A بنسبة B%" },
  es: { calculator: "Calculadora", scientific: "Calculadora científica", percentage: "Calculadora de porcentajes", area: "Calculadora de área", trig: "Trigonometría", clear: "Borrar", reset: "Restablecer", history: "Cálculos recientes", noHistory: "Los cálculos terminados aparecerán aquí.", copy: "Copiar resultado", copied: "Resultado copiado", error: "Revise la expresión e inténtelo de nuevo.", degrees: "Grados", radians: "Radianes", number: "Número", percent: "Porcentaje", result: "Resultado", shape: "Forma", radius: "Radio", width: "Ancho", height: "Alto", base: "Base", circle: "Círculo", rectangle: "Rectángulo", triangle: "Triángulo", angle: "Ángulo", sine: "Seno", cosine: "Coseno", tangent: "Tangente", undefined: "No definido", use: "Usar este resultado", of: "¿Cuánto es B% de A?", is: "¿A es qué % de B?", increase: "Aumentar A en B%", decrease: "Disminuir A en B%" },
  fr: { calculator: "Calculatrice", scientific: "Calculatrice scientifique", percentage: "Calculatrice de pourcentage", area: "Calculatrice d’aire", trig: "Trigonométrie", clear: "Effacer", reset: "Réinitialiser", history: "Calculs récents", noHistory: "Les calculs terminés apparaîtront ici.", copy: "Copier le résultat", copied: "Résultat copié", error: "Vérifiez l’expression et réessayez.", degrees: "Degrés", radians: "Radians", number: "Nombre", percent: "Pourcentage", result: "Résultat", shape: "Forme", radius: "Rayon", width: "Largeur", height: "Hauteur", base: "Base", circle: "Cercle", rectangle: "Rectangle", triangle: "Triangle", angle: "Angle", sine: "Sinus", cosine: "Cosinus", tangent: "Tangente", undefined: "Non défini", use: "Utiliser ce résultat", of: "Combien font B % de A ?", is: "A représente quel % de B ?", increase: "Augmenter A de B %", decrease: "Diminuer A de B %" },
  de: { calculator: "Rechner", scientific: "Wissenschaftlicher Rechner", percentage: "Prozentrechner", area: "Flächenrechner", trig: "Trigonometrie", clear: "Löschen", reset: "Zurücksetzen", history: "Letzte Berechnungen", noHistory: "Abgeschlossene Berechnungen erscheinen hier.", copy: "Ergebnis kopieren", copied: "Ergebnis kopiert", error: "Prüfen Sie den Ausdruck und versuchen Sie es erneut.", degrees: "Grad", radians: "Radiant", number: "Zahl", percent: "Prozent", result: "Ergebnis", shape: "Form", radius: "Radius", width: "Breite", height: "Höhe", base: "Basis", circle: "Kreis", rectangle: "Rechteck", triangle: "Dreieck", angle: "Winkel", sine: "Sinus", cosine: "Kosinus", tangent: "Tangens", undefined: "Nicht definiert", use: "Dieses Ergebnis verwenden", of: "Wie viel sind B % von A?", is: "A sind wie viel % von B?", increase: "A um B % erhöhen", decrease: "A um B % verringern" },
} as const;

type MathCopy = Record<keyof typeof localized.en, string>;

function copyResult(value: string, copy: MathCopy) {
  navigator.clipboard.writeText(value).then(() => toast.success(copy.copied)).catch(() => toast.error(copy.error));
}

function CalculatorPanel({ scientific, copy }: { scientific: boolean; copy: MathCopy }) {
  const [expression, setExpression] = useState("");
  const [error, setError] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [angleMode, setAngleMode] = useState<AngleMode>("deg");
  const title = scientific ? copy.scientific : copy.calculator;
  const append = (value: string) => { setExpression(current => current === "0" ? value : `${current}${value}`); setError(false); };
  const compute = () => {
    try { const result = formatMath(evaluateExpression(expression)); setHistory(current => [`${expression} = ${result}`, ...current].slice(0, 6)); setExpression(result); setError(false); }
    catch { setError(true); toast.error(copy.error); }
  };
  const applyScientific = (operation: "sin" | "cos" | "tan" | "sqrt" | "square" | "ln" | "log" | "inverse") => {
    try {
      const current = evaluateExpression(expression);
      const angle = angleToRadians(current, angleMode);
      const result = operation === "sin" ? Math.sin(angle) : operation === "cos" ? Math.cos(angle) : operation === "tan" ? Math.tan(angle) : operation === "sqrt" ? Math.sqrt(current) : operation === "square" ? current ** 2 : operation === "ln" ? Math.log(current) : operation === "log" ? Math.log10(current) : 1 / current;
      if (!Number.isFinite(result)) throw new Error();
      setExpression(formatMath(result)); setError(false);
    } catch { setError(true); toast.error(copy.error); }
  };
  const buttons = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "(", ")", "%", "^", "+", "="];
  return <section className="math-workspace calculator-workspace" aria-label={title}>
    <div className="math-heading"><div><p className="eyebrow">PRIVATE / BROWSER-LOCAL</p><h2>{title}</h2></div><button type="button" className="math-reset" onClick={() => { setExpression(""); setHistory([]); setError(false); }}><RotateCcw size={15} />{copy.reset}</button></div>
    {scientific && <div className="angle-toggle" role="group" aria-label={copy.angle}><button type="button" className={angleMode === "deg" ? "active" : ""} onClick={() => setAngleMode("deg")}>{copy.degrees}</button><button type="button" className={angleMode === "rad" ? "active" : ""} onClick={() => setAngleMode("rad")}>{copy.radians}</button></div>}
    <label className="math-display-label">{copy.result}<input className={`math-display ${error ? "has-error" : ""}`} value={expression} onChange={event => { setExpression(event.target.value); setError(false); }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); compute(); } }} inputMode="decimal" autoComplete="off" aria-describedby={error ? "math-error" : undefined} placeholder="0" /></label>
    {error && <p id="math-error" className="math-error">{copy.error}</p>}
    {scientific && <div className="scientific-actions"><button type="button" onClick={() => applyScientific("sin")}>sin</button><button type="button" onClick={() => applyScientific("cos")}>cos</button><button type="button" onClick={() => applyScientific("tan")}>tan</button><button type="button" onClick={() => applyScientific("ln")}>ln</button><button type="button" onClick={() => applyScientific("log")}>log</button><button type="button" onClick={() => applyScientific("sqrt")}>√</button><button type="button" onClick={() => applyScientific("square")}>x²</button><button type="button" onClick={() => applyScientific("inverse")}>1/x</button><button type="button" onClick={() => append(String(Math.PI))}>π</button><button type="button" onClick={() => append(String(Math.E))}>e</button></div>}
    <div className="calculator-keys">{buttons.map(button => <button type="button" key={button} className={button === "=" ? "equals" : ["/", "*", "-", "+", "%", "^"].includes(button) ? "operator" : ""} onClick={() => button === "=" ? compute() : append(button)}>{button === "*" ? "×" : button}</button>)}<button type="button" className="clear-key" onClick={() => { setExpression(""); setError(false); }}><Delete size={18} />{copy.clear}</button></div>
    <div className="math-history"><div><History size={15} /><strong>{copy.history}</strong></div>{history.length ? history.map(item => <button type="button" key={item} onClick={() => setExpression(item.split(" = ").at(-1) ?? "")}>{item}</button>) : <p>{copy.noHistory}</p>}</div>
  </section>;
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="math-field"><span>{label}</span><input type="number" inputMode="decimal" value={value} onChange={event => onChange(event.target.value)} placeholder="0" /></label>;
}

function PercentagePanel({ copy }: { copy: MathCopy }) {
  const [mode, setMode] = useState<PercentageMode>("of"); const [first, setFirst] = useState("100"); const [second, setSecond] = useState("10");
  const result = percentageResult(mode, Number(first), Number(second));
  return <section className="math-workspace form-workspace"><div className="math-heading"><div><p className="eyebrow">PRIVATE / BROWSER-LOCAL</p><h2>{copy.percentage}</h2></div></div><label className="math-field"><span>{copy.use}</span><select value={mode} onChange={event => setMode(event.target.value as PercentageMode)}><option value="of">{copy.of}</option><option value="is">{copy.is}</option><option value="increase">{copy.increase}</option><option value="decrease">{copy.decrease}</option></select></label><div className="math-form-grid"><NumberField label="A" value={first} onChange={setFirst} /><NumberField label="B" value={second} onChange={setSecond} /></div><ResultCard copy={copy} value={result === null ? "—" : `${formatMath(result)}${mode === "is" ? "%" : ""}`} /></section>;
}

function AreaPanel({ copy }: { copy: MathCopy }) {
  const [shape, setShape] = useState<AreaShape>("rectangle"); const [first, setFirst] = useState("12"); const [second, setSecond] = useState("8");
  const result = areaResult(shape, Number(first), Number(second));
  const firstLabel = shape === "circle" ? copy.radius : shape === "triangle" ? copy.base : copy.width;
  return <section className="math-workspace form-workspace"><div className="math-heading"><div><p className="eyebrow">PRIVATE / BROWSER-LOCAL</p><h2>{copy.area}</h2></div></div><label className="math-field"><span>{copy.shape}</span><select value={shape} onChange={event => setShape(event.target.value as AreaShape)}><option value="circle">{copy.circle}</option><option value="rectangle">{copy.rectangle}</option><option value="triangle">{copy.triangle}</option></select></label><div className="math-form-grid"><NumberField label={firstLabel} value={first} onChange={setFirst} />{shape !== "circle" && <NumberField label={copy.height} value={second} onChange={setSecond} />}</div><ResultCard copy={copy} value={result === null ? "—" : `${formatMath(result)} u²`} /></section>;
}

function TrigonometryPanel({ copy }: { copy: MathCopy }) {
  const [angleMode, setAngleMode] = useState<AngleMode>("deg"); const [angle, setAngle] = useState("30");
  const radians = angleToRadians(Number(angle), angleMode); const cosine = Math.cos(radians);
  const values = useMemo(() => [{ label: copy.sine, value: Math.sin(radians) }, { label: copy.cosine, value: cosine }, { label: copy.tangent, value: Math.abs(cosine) < 1e-10 ? null : Math.tan(radians) }], [copy.cosine, copy.sine, copy.tangent, cosine, radians]);
  return <section className="math-workspace form-workspace"><div className="math-heading"><div><p className="eyebrow">PRIVATE / BROWSER-LOCAL</p><h2>{copy.trig}</h2></div></div><div className="angle-toggle" role="group" aria-label={copy.angle}><button type="button" className={angleMode === "deg" ? "active" : ""} onClick={() => setAngleMode("deg")}>{copy.degrees}</button><button type="button" className={angleMode === "rad" ? "active" : ""} onClick={() => setAngleMode("rad")}>{copy.radians}</button></div><NumberField label={copy.angle} value={angle} onChange={setAngle} /><div className="trig-results">{values.map(item => <div key={item.label}><span>{item.label}</span><strong>{item.value === null ? copy.undefined : formatMath(item.value)}</strong></div>)}</div></section>;
}

function ResultCard({ copy, value }: { copy: MathCopy; value: string }) {
  return <div className="math-result-card"><span>{copy.result}</span><strong>{value}</strong><button type="button" onClick={() => copyResult(value, copy)} aria-label={copy.copy} disabled={value === "—"}><Copy size={16} />{copy.copy}</button></div>;
}

export function isInteractiveMathTool(slug: string): slug is MathToolSlug {
  return ["calculator", "scientific-calculator", "percentage-calculator", "area-calculator", "trigonometry"].includes(slug);
}

export default function MathWorkspace({ slug, language }: { slug: string; language: Locale }) {
  const copy = localized[language] ?? localized.en;
  if (slug === "calculator") return <CalculatorPanel scientific={false} copy={copy} />;
  if (slug === "scientific-calculator") return <CalculatorPanel scientific copy={copy} />;
  if (slug === "percentage-calculator") return <PercentagePanel copy={copy} />;
  if (slug === "area-calculator") return <AreaPanel copy={copy} />;
  return <TrigonometryPanel copy={copy} />;
}

"use client";
import { useState } from "react";
import CalculatorSection from "../../components/calculators/CalculatorSection";
import { getCalculator } from "../../config/calculators";
import { EVIDENCE as E, productNames, TECHNICAL } from "./clinicalConstants";
import { estimatedBloodVolume, recipientRequirement, reversePcv, plasmaRequirement } from "./calculations";
import { doseWarning, ongoingWarning, weightWarning } from "./warnings";
import type { Species, Product } from "./types";
import { Field, Select, Check, Notice, Errors, fmt } from "./components/Controls";
import CompatibilityPanel from "./components/CompatibilityPanel";
import DonorCollection from "./components/DonorCollection";
import AdministrationPanel from "./components/AdministrationPanel";
import ReferencePanel from "./components/ReferencePanel";

export default function Transfusion() {
  const [species, setSpecies] = useState<Species>("dog"), [product, setProduct] = useState<Product>("wholeBlood");
  const [weight, setWeight] = useState(""), [current, setCurrent] = useState(""), [target, setTarget] = useState(""), [productPcv, setProductPcv] = useState("");
  const [override, setOverride] = useState(""), [plasmaDose, setPlasmaDose] = useState(""), [available, setAvailable] = useState(""), [ongoing, setOngoing] = useState(false);
  const ebv = estimatedBloodVolume(species, override);
  const rbc = product !== "plasma" ? recipientRequirement({ species, product, weight, current, target, productPcv, ebvOverride: override }) : null;
  const result = rbc?.result, plasma = product === "plasma" ? plasmaRequirement(weight, plasmaDose) : null;
  const post = product !== "plasma" ? reversePcv(weight, current, productPcv, available, ebv ?? "") : null;
  return <main className="toolkit-workspace transfusion-workspace tx-calculator">
    <div className="toolkit-intro"><h1>{getCalculator("transfusion").name}</h1><p>Dogs &amp; Cats · Veterinary professional decision support</p></div>
    <CalculatorSection number="01" title="Recipient">
      <div className="tx-grid"><Select label="Recipient species" value={species} onChange={value => { setSpecies(value as Species); setWeight(""); setCurrent(""); setTarget(""); setProductPcv(""); setOverride(""); setAvailable(""); setPlasmaDose(""); setOngoing(false); }} options={[["dog", "Dog"], ["cat", "Cat"]]} />
        <Field label="Recipient body weight" value={weight} onChange={setWeight} unit="kg" />
        <Select label="Blood product" value={product} onChange={value => { setProduct(value as Product); setProductPcv(""); setAvailable(""); setPlasmaDose(""); }} options={Object.entries(productNames)} />
        {product === "plasma" ? <Field label="Intended plasma dose" value={plasmaDose} onChange={setPlasmaDose} unit="mL/kg" hint={`Merck coagulopathy reference: ${E.plasma[species].value.join("–")} mL/kg. Cornell fresh/fresh-frozen plasma: ${E.plasma.cornell.value.join("–")} mL/kg.`} /> : <>
          <Field label="Current PCV/Hct" value={current} onChange={setCurrent} unit="%" hint="Enter percentages, e.g. 20 for 20%." />
          <Field label="Target PCV/Hct" value={target} onChange={setTarget} unit="%" hint="Clinician-selected target; normalization is not required for stabilization." />
          <Field label="Product/donor PCV/Hct" value={productPcv} onChange={setProductPcv} unit="%" hint={species === "cat" && product === "wholeBlood" ? "Measured/labelled PCV preferred. Leave blank for empirical-only estimate." : "Measured or product-labelled PCV required; no default assumed."} />
        </>}
      </div><Notice warning={weightWarning(weight)} />
      <p>PCV/Hct alone does not establish a transfusion indication. Interpret clinical signs, hemodynamics, acute/chronic anemia, blood loss, hemolysis, cardiovascular reserve and underlying disease.</p>
      <details><summary>Advanced: estimated blood volume</summary><Field label="EBV override" value={override} onChange={setOverride} unit="mL/kg" hint={`Optional; blank uses ${E.ebv[species].value} mL/kg. Technical limits ${TECHNICAL.ebvMin}–${TECHNICAL.ebvMax}.`} /><p>Merck published range: {E.ebvRange[species].value.join("–")} mL/kg. {E.ebv[species].note}</p></details>
      {product !== "plasma" && <Check label="Ongoing hemorrhage or hemolysis" checked={ongoing} onChange={setOngoing} />}
    </CalculatorSection>
    <CalculatorSection number="02" title="Estimated requirement">
      <div aria-live="polite" aria-atomic="true">
        {product === "plasma" ? plasma ? <div className="tx-result"><span>Estimated plasma volume</span><strong>{fmt(plasma.volumeMl)} mL</strong><b>{fmt(plasma.doseMlKg)} mL/kg</b><p>Weight: {weight} kg · Clinician-entered dose: {plasmaDose} mL/kg</p></div> : <Errors errors={["Enter positive recipient weight and intended plasma dose."]} /> : result ? <>
          <div className="tx-result"><span>{result.empiricalOnly ? "Empirical feline whole-blood estimate" : "Estimated transfusion volume"}</span><strong>{fmt(result.volumeMl)} mL</strong><b>{fmt(result.doseMlKg, 2)} mL/kg</b><p>{productNames[product]} · Weight {fmt(result.weight)} kg · Current PCV {fmt(result.current)}% · Target PCV {fmt(result.target)}% · Product PCV {result.productPcv === null ? "unavailable" : `${fmt(result.productPcv)}%`}</p><p>EBV assumption: {result.ebv} mL/kg {override ? "(override)" : "(implementation default)"}{result.empiricalOnly ? "; not used in empirical equation" : ""}. Published range: {E.ebvRange[species].value.join("–")} mL/kg.</p></div>
          <Notice warning={doseWarning(product, result.doseMlKg)} />
          {result.empiricalMl !== null && !result.empiricalOnly && <aside className="tx-secondary"><b>Feline empirical estimate</b><p>{fmt(result.empiricalMl)} mL · Secondary whole-blood cross-check</p><p>Mass-balance and empirical estimates may differ; neither predicts the achieved PCV exactly.</p></aside>}
          {result.empiricalOnly && <Notice warning={{ severity: "caution", message: "Empirical estimate only. Post-transfusion PCV prediction is imperfect; reassess the patient and measure PCV/Hct following transfusion." }} />}
        </> : <Errors errors={rbc?.errors ?? []} />}
      </div>
      {product !== "plasma" ? <><Notice warning={ongoingWarning(ongoing)} /><details><summary>I have a product volume available</summary><Field label="Available product volume" value={available} onChange={setAvailable} unit="mL" /><p>Independent reverse calculation requires weight, current PCV, measured product PCV and valid EBV; target PCV is not required.</p>{available !== "" && (post !== null ? <div className="tx-secondary"><b>Estimated post-transfusion PCV: {fmt(post)}%</b><p>Prediction using {available} mL, {weight} kg, current PCV {current}%, product PCV {productPcv}%, EBV {ebv} mL/kg {override ? "(override)" : "(default)"}.</p></div> : <Errors errors={["Enter valid reverse-calculation inputs. Predicted PCV must not exceed 100%."]} />)}<p>Achieved PCV may differ with hemorrhage, hemolysis, redistribution, sampling time, product variability and individual physiology. Reassess after transfusion.</p></details></> : <p>Plasma uses weight × dose, not the RBC equation. References vary; this mode is for coagulopathy planning. Plasma is inefficient for isolated hypoproteinemia.</p>}
      <details><summary>Other products — reference only</summary><p>Platelet products: approximately 1 unit / {E.platelet.value} kg (Merck). Cryoprecipitate: approximately 1 unit / {E.cryo.value} kg (Cornell). Unit sizes vary; confirm supplier instructions. These are not RBC-equation inputs.</p></details>
    </CalculatorSection>
    <CalculatorSection number="03" title="Compatibility"><CompatibilityPanel key={`${species}-${product}`} species={species} product={product} /></CalculatorSection>
    <CalculatorSection number="04" title="Donor collection"><DonorCollection /></CalculatorSection>
    <CalculatorSection number="05" title="Administration & monitoring"><AdministrationPanel key={species} weight={weight} ebv={ebv} override={!!override} /></CalculatorSection>
    <CalculatorSection number="06" title="References"><ReferencePanel /></CalculatorSection>
    <footer className="tx-disclaimer"><p>For veterinary professional use as an estimation and decision-support tool.</p><p>Calculations do not replace clinical assessment, blood typing/crossmatching, donor screening, product-specific instructions, patient monitoring, or local transfusion protocols.</p><p>Reassess the recipient clinically and with appropriate laboratory testing after transfusion.</p></footer>
  </main>;
}

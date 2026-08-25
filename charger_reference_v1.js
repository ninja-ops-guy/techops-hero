/* TechOps Hero — Charger reference manifest.
 * The supplied sprite-sheet rows are the visual source for Mike's Night Walker hub car.
 * Runtime currently uses the reference-locked four-door procedural renderer in
 * night_reference_visuals.js until a transparent production crop is committed.
 */
window.CHARGER_REFERENCE_V1={
  provenance:"user_reference_car_rows",
  identity:"modern four-door Dodge Charger",
  requiredSilhouette:["long sedan wheelbase","four-door glasshouse","muscular rear haunch","sedan roofline"],
  prohibited:["two-door coupe","generic slab","sports-car cabin"],
  runtime:"night_reference_visuals.js"
};

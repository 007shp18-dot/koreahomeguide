'use strict';

const fs = require('node:fs');
const path = require('node:path');

const BROWSER_BASELINE_SCHEMA_VERSION = 1;
const CANONICAL_EVIDENCE_FILE = path.join('artifacts', 'v2-migration', 'legacy-browser-baseline.json');
const PRODUCTION_BASE_URL = 'https://koreahomeguide.com';

function record(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value;
}

function stringValue(value, field) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value;
}

function booleanValue(value, field) {
  if (typeof value !== 'boolean') throw new TypeError(`${field} must be a boolean`);
  return value;
}

function finiteNumber(value, field, { positive = false, integer = false } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${field} must be a finite number`);
  }
  if (positive && value <= 0) throw new TypeError(`${field} must be positive`);
  return integer ? Math.round(value) : value;
}

function normalizeBox(value, field) {
  const box = record(value, field);
  return {
    x:finiteNumber(box.x, `${field}.x`, { integer:true }),
    y:finiteNumber(box.y, `${field}.y`, { integer:true }),
    width:finiteNumber(box.width, `${field}.width`, { positive:true, integer:true }),
    height:finiteNumber(box.height, `${field}.height`, { positive:true, integer:true })
  };
}

function normalizeViewport(value, field) {
  const viewport = record(value, field);
  return {
    width:finiteNumber(viewport.width, `${field}.width`, { positive:true, integer:true }),
    height:finiteNumber(viewport.height, `${field}.height`, { positive:true, integer:true })
  };
}

function normalizeConsoleErrors(value) {
  if (!Array.isArray(value)) throw new TypeError('consoleErrors must be an array');
  return value.map((item, index) => {
    if (typeof item === 'string') return { source:'browser-console', message:item };
    const error = record(item, `consoleErrors[${index}]`);
    return {
      source:stringValue(error.source, `consoleErrors[${index}].source`),
      message:stringValue(error.message, `consoleErrors[${index}].message`)
    };
  });
}

function normalizeBrowserBaseline(value) {
  const evidence = record(value, 'browser evidence');
  if (evidence.schemaVersion !== BROWSER_BASELINE_SCHEMA_VERSION) {
    throw new TypeError(`schemaVersion must equal ${BROWSER_BASELINE_SCHEMA_VERSION}`);
  }
  const explorer = record(evidence.explorer, 'explorer');
  const selection = record(explorer.selectionStability, 'explorer.selectionStability');
  const streetView = record(explorer.streetView, 'explorer.streetView');
  const buildingModal = record(evidence.buildingModal, 'buildingModal');
  const focus = record(buildingModal.closeEscapeFocus, 'buildingModal.closeEscapeFocus');
  const rentCheck = record(evidence.rentCheck, 'rentCheck');
  const status = record(rentCheck.status, 'rentCheck.status');
  const fieldBoxes = record(rentCheck.fieldBoxes, 'rentCheck.fieldBoxes');
  if (!Array.isArray(rentCheck.disclosures)) throw new TypeError('rentCheck.disclosures must be an array');

  return {
    schemaVersion:BROWSER_BASELINE_SCHEMA_VERSION,
    capturedAt:stringValue(evidence.capturedAt, 'capturedAt'),
    sourceRevision:stringValue(evidence.sourceRevision, 'sourceRevision'),
    runner:stringValue(evidence.runner, 'runner'),
    targetBaseUrl:stringValue(evidence.targetBaseUrl, 'targetBaseUrl'),
    explorer:{
      url:stringValue(explorer.url, 'explorer.url'),
      pageAvailable:booleanValue(explorer.pageAvailable, 'explorer.pageAvailable'),
      selectedDong:stringValue(explorer.selectedDong, 'explorer.selectedDong'),
      viewport:normalizeViewport(explorer.viewport, 'explorer.viewport'),
      mapBox:normalizeBox(explorer.mapBox, 'explorer.mapBox'),
      selectionStability:{
        durationMs:finiteNumber(selection.durationMs, 'explorer.selectionStability.durationMs', { positive:true, integer:true }),
        urlBeforeIdle:stringValue(selection.urlBeforeIdle, 'explorer.selectionStability.urlBeforeIdle'),
        urlAfterIdle:stringValue(selection.urlAfterIdle, 'explorer.selectionStability.urlAfterIdle')
      },
      buildingCount:finiteNumber(explorer.buildingCount, 'explorer.buildingCount', { positive:true, integer:true }),
      dialogBox:normalizeBox(explorer.dialogBox, 'explorer.dialogBox'),
      streetView:{
        stateAt2Seconds:stringValue(streetView.stateAt2Seconds, 'explorer.streetView.stateAt2Seconds'),
        stateAt8Seconds:stringValue(streetView.stateAt8Seconds, 'explorer.streetView.stateAt8Seconds'),
        boxAt2Seconds:normalizeBox(streetView.boxAt2Seconds, 'explorer.streetView.boxAt2Seconds'),
        boxAt8Seconds:normalizeBox(streetView.boxAt8Seconds, 'explorer.streetView.boxAt8Seconds')
      }
    },
    buildingModal:{
      closeButtonVisible:booleanValue(buildingModal.closeButtonVisible, 'buildingModal.closeButtonVisible'),
      closeEscapeFocus:{
        overlayHidden:booleanValue(focus.overlayHidden, 'buildingModal.closeEscapeFocus.overlayHidden'),
        activeElementLabel:stringValue(focus.activeElementLabel, 'buildingModal.closeEscapeFocus.activeElementLabel')
      }
    },
    rentCheck:{
      url:stringValue(rentCheck.url, 'rentCheck.url'),
      pageAvailable:booleanValue(rentCheck.pageAvailable, 'rentCheck.pageAvailable'),
      viewport:normalizeViewport(rentCheck.viewport, 'rentCheck.viewport'),
      pageScrollWidth:finiteNumber(rentCheck.pageScrollWidth, 'rentCheck.pageScrollWidth', { positive:true, integer:true }),
      formBox:normalizeBox(rentCheck.formBox, 'rentCheck.formBox'),
      fieldBoxes:{
        area:normalizeBox(fieldBoxes.area, 'rentCheck.fieldBoxes.area'),
        type:normalizeBox(fieldBoxes.type, 'rentCheck.fieldBoxes.type'),
        deposit:normalizeBox(fieldBoxes.deposit, 'rentCheck.fieldBoxes.deposit'),
        rent:normalizeBox(fieldBoxes.rent, 'rentCheck.fieldBoxes.rent'),
        size:normalizeBox(fieldBoxes.size, 'rentCheck.fieldBoxes.size'),
        submit:normalizeBox(fieldBoxes.submit, 'rentCheck.fieldBoxes.submit')
      },
      selectedDistrictControl:stringValue(rentCheck.selectedDistrictControl, 'rentCheck.selectedDistrictControl'),
      selectedDistrictLabel:stringValue(rentCheck.selectedDistrictLabel, 'rentCheck.selectedDistrictLabel'),
      selectedType:stringValue(rentCheck.selectedType, 'rentCheck.selectedType'),
      status:{
        state:stringValue(status.state, 'rentCheck.status.state'),
        text:stringValue(status.text, 'rentCheck.status.text')
      },
      resultHidden:booleanValue(rentCheck.resultHidden, 'rentCheck.resultHidden'),
      leadCaptureHidden:booleanValue(rentCheck.leadCaptureHidden, 'rentCheck.leadCaptureHidden'),
      disclosures:rentCheck.disclosures.map((item, index) => (
        stringValue(item, `rentCheck.disclosures[${index}]`)
      ))
    },
    consoleErrors:normalizeConsoleErrors(evidence.consoleErrors)
  };
}

function isProductionBaseUrl(baseUrl) {
  try {
    const parsed = new URL(baseUrl);
    return parsed.origin === PRODUCTION_BASE_URL
      && (parsed.pathname === '/' || parsed.pathname === '')
      && parsed.search === ''
      && parsed.hash === '';
  } catch (_) {
    return false;
  }
}

function resolveBrowserEvidencePath(rootDir, { baseUrl, configuredPath } = {}) {
  if (typeof rootDir !== 'string' || !rootDir) throw new TypeError('rootDir must be a non-empty string');
  const canonicalPath = path.resolve(rootDir, CANONICAL_EVIDENCE_FILE);
  const productionTarget = isProductionBaseUrl(baseUrl);
  if (!productionTarget && !configuredPath) {
    throw new TypeError('LEGACY_EVIDENCE_PATH is required for a non-Production target');
  }
  const evidencePath = configuredPath
    ? path.resolve(rootDir, configuredPath)
    : canonicalPath;
  if (!productionTarget && evidencePath === canonicalPath) {
    throw new TypeError('A non-Production target cannot write canonical browser evidence');
  }
  return evidencePath;
}

function writeBrowserEvidence(outputFile, value) {
  const normalized = normalizeBrowserBaseline(value);
  const outputPath = path.resolve(outputFile);
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  fs.mkdirSync(path.dirname(outputPath), { recursive:true });
  fs.writeFileSync(temporaryPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  fs.renameSync(temporaryPath, outputPath);
  return normalized;
}

module.exports = {
  BROWSER_BASELINE_SCHEMA_VERSION,
  CANONICAL_EVIDENCE_FILE,
  PRODUCTION_BASE_URL,
  normalizeBrowserBaseline,
  resolveBrowserEvidencePath,
  writeBrowserEvidence
};

(function (root) {
  'use strict';

  const SERVICE_EVENT = 'move_service_interest';
  const JOURNEY_EVENT = 'move_journey_click';
  const SERVICES = new Set(['internet', 'sim_esim', 'moving', 'cleaning', 'insurance', 'relocation']);
  const STAGES = new Set(['check', 'prepare', 'move', 'settle']);

  function buildServiceEvent({ city, language, service }) {
    if (!SERVICES.has(service)) return null;
    return {
      eventName: SERVICE_EVENT,
      params: {
        city: String(city || ''),
        service,
        language: String(language || ''),
        source: 'homepage_services'
      }
    };
  }

  function buildJourneyEvent({ city, language, stage }) {
    if (!STAGES.has(stage)) return null;
    return {
      eventName: JOURNEY_EVENT,
      params: {
        city: String(city || ''),
        stage,
        language: String(language || '')
      }
    };
  }

  function safeTrack(gtagFn, eventName, params) {
    try {
      if (typeof gtagFn === 'function' && eventName) {
        gtagFn('event', eventName, params || {});
      }
    } catch (_) {
      // Analytics is optional and must never block the interface.
    }
  }

  function markServiceInterest(button, seenServices, trackFn, context) {
    if (!button || !seenServices || typeof trackFn !== 'function') return;
    const service = button.getAttribute('data-move-service');
    if (!SERVICES.has(service)) return;

    if (!seenServices.has(service)) {
      seenServices.add(service);
      const payload = buildServiceEvent({
        city: context && context.city,
        language: context && context.language,
        service
      });
      if (payload) trackFn(payload);
    }

    button.textContent = button.getAttribute('data-label-done') || 'Interest noted';
    button.disabled = true;
    button.setAttribute('aria-pressed', 'true');
  }

  function init(doc, gtagFn) {
    if (!doc || !doc.body || typeof doc.querySelectorAll !== 'function') return;

    const context = {
      city: doc.body.getAttribute('data-commerce-city') || '',
      language: doc.body.getAttribute('data-commerce-language') || ''
    };
    const seenServices = new Set();

    doc.querySelectorAll('[data-move-service]').forEach((button) => {
      button.addEventListener('click', () => {
        markServiceInterest(
          button,
          seenServices,
          (payload) => safeTrack(gtagFn, payload.eventName, payload.params),
          context
        );
      });
    });

    doc.querySelectorAll('[data-move-stage]').forEach((link) => {
      link.addEventListener('click', () => {
        const payload = buildJourneyEvent({
          city: context.city,
          language: context.language,
          stage: link.getAttribute('data-move-stage')
        });
        if (payload) safeTrack(gtagFn, payload.eventName, payload.params);
      });
    });
  }

  const api = {
    buildServiceEvent,
    buildJourneyEvent,
    safeTrack,
    markServiceInterest,
    init
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (root && root.document) {
    init(root.document, root.gtag);
  }
})(typeof window !== 'undefined' ? window : globalThis);

/* ============================================================================
   Global Suntech — shared lead-capture client.

   Every landing page includes this file and calls one of the two methods below
   from its own submit handler. The pages keep their own validation and their
   own success animations; this file owns the part that must be identical
   everywhere: the request, the payload shape, and the failure messages.

   The payload it sends is the canonical shape `POST /api/leads` expects:

     { site, formId, path, fields: { name, email, … }, details: { … } }

   `fields` keys are the canonical ones from src/lib/sites.ts. Anything the API
   has no column for still gets stored, under `details`, so nothing a visitor
   typed is ever silently dropped.

   Both methods always resolve — they never reject — with
   `{ ok, status, ref, message, errors }`. Callers branch on `ok`.
   ========================================================================= */

(function (global) {
  "use strict";

  var LEADS_ENDPOINT = "/api/leads";
  var SUBSCRIBE_ENDPOINT = "/api/subscribe";
  var TIMEOUT_MS = 15000;

  /** The canonical field names the API accepts. Everything else goes to `details`. */
  var CANONICAL = [
    "name", "email", "phone", "company", "country", "city", "location",
    "enquiryType", "systemType", "quantity", "message"
  ];

  function request(url, body) {
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = controller
      ? setTimeout(function () { controller.abort(); }, TIMEOUT_MS)
      : null;

    function settled(result) {
      if (timer) clearTimeout(timer);
      return result;
    }

    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        return response
          .json()
          .catch(function () { return {}; })
          .then(function (data) {
            return settled({
              ok: response.ok && data.ok !== false,
              status: response.status,
              ref: data.ref || null,
              message: data.message || null,
              errors: data.errors || null
            });
          });
      })
      .catch(function (error) {
        return settled({
          ok: false,
          status: 0,
          ref: null,
          message:
            error && error.name === "AbortError"
              ? "That took too long. Please check your connection and try again."
              : "We could not reach the server. Please check your connection and try again.",
          errors: null
        });
      });
  }

  /**
   * Splits the answers into canonical fields and extras, dropping blanks so the
   * API's "required" check reports a genuinely missing answer rather than an
   * empty string.
   */
  function sortFields(raw) {
    var fields = {};
    var details = {};

    Object.keys(raw || {}).forEach(function (key) {
      var value = raw[key];
      if (value === null || value === undefined) return;
      var text = String(value).trim();
      if (!text) return;

      if (CANONICAL.indexOf(key) !== -1) fields[key] = text;
      else details[key] = text;
    });

    return { fields: fields, details: details };
  }

  var GSLeads = {
    /**
     * @param {Object} options
     * @param {string} options.site     landing page slug, e.g. "traffic-solutions"
     * @param {string} options.formId   the form's DOM id, recorded for traceability
     * @param {Object} options.fields   canonical answers; extras are kept as details
     * @param {Object} [options.details] extra answers, merged with the auto-detected ones
     * @param {Element} [options.form]  if given, a filled `[name="website"]` field
     *                                  inside it marks the submission as spam
     * @returns {Promise<{ok:boolean,status:number,ref:?string,message:?string,errors:?Object}>}
     */
    submit: function (options) {
      var sorted = sortFields(options.fields);
      var details = sorted.details;

      if (options.details) {
        Object.keys(options.details).forEach(function (key) {
          var value = options.details[key];
          if (value === null || value === undefined) return;
          var text = String(value).trim();
          if (text) details[key] = text;
        });
      }

      // Honeypot: a hidden "website" input that only a bot fills in. The API
      // answers as if it succeeded, so the bot gets no signal.
      if (options.form) {
        var trap = options.form.querySelector('[name="website"]');
        if (trap && trap.value) details.website = String(trap.value).trim();
      }

      return request(LEADS_ENDPOINT, {
        site: options.site,
        formId: options.formId || null,
        path: global.location.pathname,
        fields: sorted.fields,
        details: details
      });
    },

    /**
     * @param {string} site   landing page slug
     * @param {string} email  the address to subscribe
     * @returns {Promise<{ok:boolean,status:number,message:?string}>}
     */
    subscribe: function (site, email) {
      return request(SUBSCRIBE_ENDPOINT, {
        site: site,
        email: email,
        path: global.location.pathname
      });
    },

    /** Canonical field names, exposed so a page can assert its mapping in tests. */
    canonicalFields: CANONICAL.slice()
  };

  global.GSLeads = GSLeads;
})(window);

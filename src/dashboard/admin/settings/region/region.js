/* ============================================================
   region.js
   Handles the Region & Currency settings panel.
   Depends on: countries-data.js (must be loaded first)

   Public API:
     RegionSettings.init()        — call on DOMContentLoaded
     RegionSettings.getActive()   — returns { country, currency, currencyCode, symbol }
   ============================================================ */

const RegionSettings = (() => {
  const STORAGE_KEY = 'precision_pos_region';

  /* ── Load persisted preference ── */
  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /* ── Save preference ── */
  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Broadcast so other modules (e.g. POS) can react
    window.dispatchEvent(new CustomEvent('regionChanged', { detail: data }));
  }

  /* ── Get currently active region (used by other modules) ── */
  function getActive() {
    return loadSaved() || {
      continent: 'North America',
      country:      'United States',
      countryCode:  'US',
      currency:     'US Dollar',
      currencyCode: 'USD',
      symbol:       '$',
    };
  }

  /* ── Build continent <select> ── */
  function buildContinentSelect(el, savedContinent) {
    el.innerHTML = '<option value="">— Select Continent —</option>';
    WORLD_REGIONS.forEach(region => {
      const opt = document.createElement('option');
      opt.value = region.continent;
      opt.textContent = region.continent;
      if (region.continent === savedContinent) opt.selected = true;
      el.appendChild(opt);
    });
  }

  /* ── Build country <select> based on chosen continent ── */
  function buildCountrySelect(el, continent, savedCode) {
    el.innerHTML = '<option value="">— Select Country —</option>';
    const region = WORLD_REGIONS.find(r => r.continent === continent);
    if (!region) return;

    region.countries.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = c.name;
      if (c.code === savedCode) opt.selected = true;
      el.appendChild(opt);
    });
  }

  /* ── Update the currency preview card ── */
  function updatePreview(country) {
    const previewEl    = document.getElementById('region-currency-preview');
    const exampleEl   = document.getElementById('region-currency-example');
    if (!previewEl || !country) return;

    previewEl.textContent  = `${country.currency} (${country.currencyCode})`;
    exampleEl.textContent  = `${country.symbol}1,234.56`;
  }

  /* ── Wire up the panel once DOM is ready ── */
  function init() {
    const continentSel = document.getElementById('region-continent');
    const countrySel   = document.getElementById('region-country');
    const saveBtn      = document.getElementById('region-save-btn');
    const statusMsg    = document.getElementById('region-status');

    if (!continentSel || !countrySel) return; // panel not in DOM

    const saved = loadSaved();
    const savedContinent = saved?.continent || '';
    const savedCode      = saved?.countryCode || '';

    // Seed dropdowns
    buildContinentSelect(continentSel, savedContinent);
    if (savedContinent) {
      buildCountrySelect(countrySel, savedContinent, savedCode);
    }

    // Show saved currency in preview
    if (saved) {
      updatePreview({ currency: saved.currency, currencyCode: saved.currencyCode, symbol: saved.symbol });
    }

    // Continent change → repopulate countries
    continentSel.addEventListener('change', () => {
      buildCountrySelect(countrySel, continentSel.value, null);
      updatePreview(null);
    });

    // Country change → update preview
    countrySel.addEventListener('change', () => {
      const continent = WORLD_REGIONS.find(r => r.continent === continentSel.value);
      if (!continent) return;
      const country = continent.countries.find(c => c.code === countrySel.value);
      if (country) updatePreview(country);
    });

    // Save button
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const selContinent = continentSel.value;
        const selCode      = countrySel.value;

        if (!selContinent || !selCode) {
          showStatus(statusMsg, 'Please select both a continent and a country.', 'error');
          return;
        }

        const region  = WORLD_REGIONS.find(r => r.continent === selContinent);
        const country = region?.countries.find(c => c.code === selCode);
        if (!country) return;

        const payload = {
          continent:    selContinent,
          country:      country.name,
          countryCode:  country.code,
          currency:     country.currency,
          currencyCode: country.currencyCode,
          symbol:       country.symbol,
        };

        save(payload);
        showStatus(statusMsg, `✓ Region saved — ${country.name} · ${country.currency} (${country.symbol})`, 'success');
      });
    }
  }

  function showStatus(el, msg, type) {
    if (!el) return;
    el.textContent  = msg;
    el.className    = `region-status-msg ${type}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }

  return { init, getActive };
})();

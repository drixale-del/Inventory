/* ============================================================
   exporter.js — Universal Export logic (CSV, PDF, Excel)
   Loads CDN libraries automatically on demand.
   ============================================================ */

const Exporter = (() => {
  let moduleName = 'Data';

  function ensureLibrary(name, url, checkGlobal) {
    return new Promise((resolve, reject) => {
      if (window[checkGlobal]) { resolve(); return; }
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = () => reject(`Failed to load ${name}`);
      document.head.appendChild(script);
    });
  }

  function injectUI() {
    if (document.getElementById('exporter-modal')) return;
    const overlay = document.createElement('div');
    overlay.className = 'exporter-modal-overlay';
    overlay.id = 'exporter-modal';
    overlay.innerHTML = `
      <div class="exporter-modal">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-2);">
          <div class="card-title" id="exporter-title" style="margin:0;">Export Data</div>
          <button class="btn btn-secondary btn-icon btn-sm" onclick="Exporter.close()">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
        <p style="font-size:var(--text-body-sm);color:var(--on-surface-variant);margin-bottom:var(--space-2);">
          Select the format you'd like to export this data to.
        </p>
        <div class="exporter-options">
          <button class="export-btn excel" onclick="Exporter.doExport('excel')">
            <span class="material-symbols-rounded">table_chart</span> Export to Excel (.xlsx)
          </button>
          <button class="export-btn pdf" onclick="Exporter.doExport('pdf')">
            <span class="material-symbols-rounded">picture_as_pdf</span> Export to PDF (.pdf)
          </button>
          <button class="export-btn csv" onclick="Exporter.doExport('csv')">
            <span class="material-symbols-rounded">segment</span> Export to CSV (.csv)
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', e => {
      if (e.target === overlay) close();
    });
  }

  function show(name = 'Data') {
    moduleName = name;
    injectUI();
    document.getElementById('exporter-title').textContent = `Export ${name}`;
    document.getElementById('exporter-modal').classList.add('open');
  }

  function close() {
    const el = document.getElementById('exporter-modal');
    if (el) el.classList.remove('open');
  }

  function extractTableData() {
    // Finds the first data-table on the screen
    const table = document.querySelector('.data-table');
    if (!table) { alert('No table data found to export.'); return null; }
    
    // Convert table to array of rows
    const rows = [];
    const trs = table.querySelectorAll('tr');
    trs.forEach(tr => {
      const row = [];
      tr.querySelectorAll('th, td').forEach(td => row.push(td.innerText.trim()));
      
      // Filter out empty rows or purely action button rows
      if (row.length > 0) {
        // Simple heuristic: if the last element is empty or looks like buttons, drop it
        if (!row[row.length - 1]) row.pop(); 
        rows.push(row);
      }
    });
    return rows;
  }

  async function doExport(format) {
    const data = extractTableData();
    if (!data || data.length === 0) return;
    
    const filename = `${moduleName.replace(/\s+/g, '_')}_Export_${new Date().toISOString().split('T')[0]}`;

    try {
      if (format === 'csv') {
        const csv = data.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        downloadBlob(blob, `${filename}.csv`);
      } 
      
      else if (format === 'excel') {
        // Load SheetJS
        await ensureLibrary('XLSX', 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'XLSX');
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, moduleName);
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      } 
      
      else if (format === 'pdf') {
        // Load jsPDF and AutoTable
        await ensureLibrary('jsPDF', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf');
        await ensureLibrary('AutoTable', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js', 'autoTable'); // Note autotable attaches to jspdf
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.text(`${moduleName} Report`, 14, 15);
        
        doc.autoTable({
          head: [data[0]],
          body: data.slice(1),
          startY: 20,
          theme: 'grid',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [9, 114, 211] }
        });
        
        doc.save(`${filename}.pdf`);
      }
      
      close();
      
    } catch (err) {
      console.error(err);
      alert('Error during export: ' + err);
    }
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  return { show, close, doExport };
})();

// Attach globally
window.Exporter = Exporter;

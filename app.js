document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file-input');
  const uploadBtn = document.getElementById('upload-btn');
  const searchInput = document.getElementById('search-input');
  const payloadGrid = document.getElementById('payload-grid');
  const modelsChecklist = document.getElementById('models-checklist');
  const behaviorsChecklist = document.getElementById('behaviors-checklist');
  const initialUploadModal = document.getElementById('initial-upload-modal');
  const initialUploadBtn = document.getElementById('initial-upload-btn');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const mobileOverlay = document.getElementById('mobile-overlay');

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      mobileOverlay.classList.add('active');
    });
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      mobileOverlay.classList.remove('active');
    });
  }

  let currentData = null;

  // Tabs Logic
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
    });
  });

  // Drag & Drop on Body
  document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
    document.body.classList.add('dragover');
  });

  document.body.addEventListener('dragleave', (e) => {
    if (e.target === document.body) {
      document.body.classList.remove('dragover');
    }
  });

  document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    document.body.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  initialUploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleFile(e.target.files[0]);
    }
  });

  let searchTimeout = null;
  searchInput.addEventListener('input', (e) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderCards();
    }, 300);
  });

  // Filter Checklist Changes
  modelsChecklist.addEventListener('change', () => renderCards());
  behaviorsChecklist.addEventListener('change', () => renderCards());

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        currentData = json;
        updateDashboard(json);
        initialUploadModal.classList.add('hidden');
      } catch (err) {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  }

  function updateDashboard(data) {
    // Badges
    const badge = document.getElementById('challenge-badge');
    
    // Format slug to Name (e.g. "my-challenge" -> "My Challenge")
    const formatSlugToName = (slug) => {
      if (!slug) return 'Unknown Challenge';
      return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };
    
    badge.textContent = `Challenge Name: ${formatSlugToName(data.challenge_slug)}`;
    badge.classList.remove('hidden');

    // KPIs
    const stats = data.stats;
    document.getElementById('kpi-total').textContent = stats.total_submissions || 0;
    document.getElementById('kpi-approved').textContent = stats.approved_submissions || 0;
    document.getElementById('kpi-rejected').textContent = stats.rejected_submissions || 0;
    
    const winRate = stats.total_submissions > 0 ? (stats.approved_submissions / stats.total_submissions * 100).toFixed(1) : 0;
    document.getElementById('kpi-winrate').textContent = `${winRate}%`;
    
    const avgAttempts = stats.approved_submissions > 0 ? (stats.total_submissions / stats.approved_submissions).toFixed(1) : '--';
    document.getElementById('kpi-avg-attempts').textContent = avgAttempts;

    // Charts & Analytics Data
    const modelsData = {};
    const behaviorsData = {};
    const timelineData = {};
    const modelBehaviorMatrix = {}; // { behavior: { model1: count, model2: count } }
    
    let totalLength = 0;
    let shortestPayload = null;
    let longestPayload = null;
    let approvedCountWithPayload = 0;

    (data.submissions || []).forEach(sub => {
      if (sub.status === 'approved') {
        const m = sub.model || 'Unknown';
        const b = sub.behavior || 'Unknown Behavior';

        modelsData[m] = (modelsData[m] || 0) + 1;
        behaviorsData[b] = (behaviorsData[b] || 0) + 1;

        if (!modelBehaviorMatrix[b]) modelBehaviorMatrix[b] = {};
        modelBehaviorMatrix[b][m] = (modelBehaviorMatrix[b][m] || 0) + 1;

        if (sub.submitted_at) {
          const dateStr = new Date(sub.submitted_at).toLocaleDateString();
          timelineData[dateStr] = (timelineData[dateStr] || 0) + 1;
        }

        if (sub.payload && sub.payload !== 'PAYLOAD_NOT_FOUND') {
          const len = sub.payload.length;
          totalLength += len;
          approvedCountWithPayload++;

          if (!shortestPayload || len < shortestPayload.payload.length) shortestPayload = sub;
          if (!longestPayload || len > longestPayload.payload.length) longestPayload = sub;
        }
      }
    });

    // Ensure there is something to show
    if (Object.keys(modelsData).length === 0 && stats.approved_submissions > 0) {
      modelsData['Unknown'] = stats.approved_submissions;
    }
    if (Object.keys(behaviorsData).length === 0 && stats.approved_submissions > 0) {
      behaviorsData['Unknown Behavior'] = stats.approved_submissions;
    }

    ChartManager.init(modelsData, behaviorsData, timelineData);

    // Populate Checklists
    modelsChecklist.innerHTML = '';
    Object.keys(modelsData).sort().forEach(m => {
      const label = document.createElement('label');
      label.className = 'checklist-item';
      label.innerHTML = `<input type="checkbox" value="${m}"> ${m}`;
      modelsChecklist.appendChild(label);
    });

    behaviorsChecklist.innerHTML = '';
    Object.keys(behaviorsData).sort().forEach(b => {
      const label = document.createElement('label');
      label.className = 'checklist-item';
      label.innerHTML = `<input type="checkbox" value="${b}"> ${b}`;
      behaviorsChecklist.appendChild(label);
    });

    // Populate Analysis Tab: Matrix
    const matrixTableHead = document.querySelector('#matrix-table thead');
    const matrixTableBody = document.querySelector('#matrix-table tbody');
    matrixTableHead.innerHTML = '';
    matrixTableBody.innerHTML = '';

    const allModels = Object.keys(modelsData).sort();
    
    let theadHtml = `<tr><th>Behavior</th>`;
    allModels.forEach(m => { theadHtml += `<th>${m}</th>`; });
    theadHtml += `</tr>`;
    matrixTableHead.innerHTML = theadHtml;

    Object.keys(modelBehaviorMatrix).sort().forEach(b => {
      const row = document.createElement('tr');
      let rowHtml = `<td><strong>${b}</strong></td>`;
      allModels.forEach(m => {
        const count = modelBehaviorMatrix[b][m] || 0;
        rowHtml += `<td style="color: ${count > 0 ? '#34d399' : 'var(--text-muted)'}">${count}</td>`;
      });
      row.innerHTML = rowHtml;
      matrixTableBody.appendChild(row);
    });

    // Populate Analysis Tab: Insights
    document.getElementById('insight-avg-len').textContent = approvedCountWithPayload > 0 ? Math.round(totalLength / approvedCountWithPayload) : '--';
    document.getElementById('insight-min-len').textContent = shortestPayload ? shortestPayload.payload.length : '--';
    document.getElementById('insight-max-len').textContent = longestPayload ? longestPayload.payload.length : '--';

    document.getElementById('extreme-shortest').textContent = shortestPayload ? shortestPayload.payload : '--';
    document.getElementById('extreme-longest').textContent = longestPayload ? longestPayload.payload : '--';

    // Cards
    renderCards();
  }

  // Modal Elements
  const modal = document.getElementById('payload-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalActions = document.getElementById('modal-actions');
  const modalPayload = document.getElementById('modal-payload');
  const modalClose = document.getElementById('modal-close');

  modalClose.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Close modal when clicking outside content
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  function openModal(sub) {
    const cName = sub.challenge_name || 'Unknown Challenge';
    const mName = sub.model && sub.model !== 'unknown' ? sub.model : 'Unknown Model';
    const bName = sub.behavior || 'Unknown Behavior';
    
    modalTitle.innerHTML = `
      <div style="font-size: 0.85em; color: var(--text-muted); font-weight: normal; margin-bottom: 8px;">
        ${cName} <span style="margin: 0 8px; opacity: 0.5;">&bull;</span> <span style="color: var(--text-main);">${mName}</span>
      </div>
      <div style="font-size: 1.1em; color: #a78bfa; margin-bottom: 8px;">${bName}</div>
      <div style="font-size: 0.9em; font-weight: normal;">ID: ${sub.submission_id || 'N/A'}</div>
    `;
    modalPayload.textContent = sub.payload || 'N/A';
    modalActions.innerHTML = ''; // clear old actions

    const copyBtn = document.createElement('button');
    copyBtn.className = 'action-btn';
    copyBtn.textContent = 'Copy Payload';
    copyBtn.onclick = () => {
      if (sub.payload) {
        navigator.clipboard.writeText(sub.payload);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = 'Copy Payload', 2000);
      }
    };
    
    const validationBtn = document.createElement('button');
    validationBtn.className = 'action-btn';
    validationBtn.textContent = 'Validation Link';
    validationBtn.onclick = () => {
      if (sub.chat_url) {
        let finalUrl = sub.chat_url;
        if (!finalUrl.toLowerCase().includes('submissionid=') && sub.submission_id && sub.submission_id !== 'unknown') {
          finalUrl += `?submissionId=${sub.submission_id}`;
        }
        window.open(finalUrl, '_blank');
      }
    };

    const chatBtn = document.createElement('button');
    chatBtn.className = 'action-btn';
    chatBtn.textContent = 'Chat Link';
    chatBtn.onclick = () => {
      if (sub.validation_url) window.open(sub.validation_url, '_blank');
      else if (sub.chat_url) window.open(sub.chat_url, '_blank'); // fallback
    };

    modalActions.appendChild(copyBtn);
    modalActions.appendChild(validationBtn);
    modalActions.appendChild(chatBtn);

    modal.classList.remove('hidden');
  }

  function renderCards() {
    if (!currentData || !currentData.submissions) return;

    const searchTerm = searchInput.value.toLowerCase();
    const checkedModels = Array.from(modelsChecklist.querySelectorAll('input:checked')).map(cb => cb.value);
    const checkedBehaviors = Array.from(behaviorsChecklist.querySelectorAll('input:checked')).map(cb => cb.value);

    const approvedSubs = currentData.submissions.filter(s => s.status === 'approved');
    
    const filteredSubs = approvedSubs.filter(s => {
      const idStr = s.submission_id ? String(s.submission_id).toLowerCase() : '';
      const payloadStr = s.payload ? String(s.payload).toLowerCase() : '';
      const modelStr = s.model ? String(s.model).toLowerCase() : '';
      const behaviorStr = s.behavior ? String(s.behavior).toLowerCase() : '';
      
      const mName = s.model && s.model !== 'unknown' ? s.model : 'Unknown Model';
      const bName = s.behavior || 'Unknown Behavior';

      // Checklist filters (OR logic within category, AND across categories)
      if (checkedModels.length > 0 && !checkedModels.includes(mName) && !checkedModels.includes(s.model)) return false;
      if (checkedBehaviors.length > 0 && !checkedBehaviors.includes(bName) && !checkedBehaviors.includes(s.behavior)) return false;

      // Text search filter
      if (searchTerm) {
        return idStr.includes(searchTerm) || payloadStr.includes(searchTerm) || modelStr.includes(searchTerm) || behaviorStr.includes(searchTerm);
      }
      return true;
    });

    payloadGrid.innerHTML = '';

    if (filteredSubs.length === 0) {
      payloadGrid.innerHTML = `<div class="empty-state">No matching records found.</div>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    filteredSubs.forEach(sub => {
      const card = document.createElement('div');
      card.className = 'payload-card';
      
      const bName = sub.behavior || 'Unknown Behavior';
      const mName = sub.model && sub.model !== 'unknown' ? sub.model : 'Unknown Model';
      const payloadSnippet = sub.payload ? (sub.payload.substring(0, 100) + (sub.payload.length > 100 ? '...' : '')) : 'No Payload';
      
      card.innerHTML = `
        <div class="payload-behavior" style="color: #a78bfa; font-weight: 500; margin-bottom: 4px; font-size: 0.95rem;">${bName}</div>
        <div class="payload-model" style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">${mName}</div>
        <div class="payload-snippet" style="font-size: 0.85rem; font-family: monospace; color: var(--text-muted); text-align: left; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; border: 1px solid var(--border); word-break: break-all;">${payloadSnippet}</div>
      `;
      
      // Open Modal on click
      card.addEventListener('click', () => {
        openModal(sub);
      });
      
      fragment.appendChild(card);
    });
    
    payloadGrid.appendChild(fragment);
  }
});

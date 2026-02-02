import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const urlParams = new URLSearchParams(window.location.search);
const companyId = urlParams.get('company_id');
const repId = urlParams.get('rep_id');

if (!companyId || !repId) {
  window.location.href = 'dashboard.html';
}

const backBtn = document.getElementById('backBtn');
backBtn.href = `companies.html?rep_id=${repId}`;

const companyInfo = document.getElementById('companyInfo');
const claimsGrid = document.getElementById('claimsGrid');
const addClaimBtn = document.getElementById('addClaimBtn');
const addClaimModal = document.getElementById('addClaimModal');
const addClaimForm = document.getElementById('addClaimForm');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');

let currentPage = 1;
const totalPages = 3;

function updateProgressBar() {
  document.querySelectorAll('.progress-step').forEach((step, index) => {
    const stepNumber = index + 1;
    if (stepNumber < currentPage) {
      step.classList.add('completed');
      step.classList.remove('active');
    } else if (stepNumber === currentPage) {
      step.classList.add('active');
      step.classList.remove('completed');
    } else {
      step.classList.remove('active', 'completed');
    }
  });
}

function showPage(pageNumber) {
  document.querySelectorAll('.form-page').forEach(page => {
    page.classList.remove('active');
  });

  const currentPageEl = document.querySelector(`.form-page[data-page="${pageNumber}"]`);
  if (currentPageEl) {
    currentPageEl.classList.add('active');
  }

  prevBtn.style.display = pageNumber === 1 ? 'none' : 'block';
  nextBtn.style.display = pageNumber === totalPages ? 'none' : 'block';
  submitBtn.style.display = pageNumber === totalPages ? 'block' : 'none';

  updateProgressBar();
}

function validatePage(pageNumber) {
  const page = document.querySelector(`.form-page[data-page="${pageNumber}"]`);
  const inputs = page.querySelectorAll('input[required], textarea[required], select[required]');

  for (let input of inputs) {
    if (!input.value.trim()) {
      input.focus();
      return false;
    }

    if (input.type === 'radio') {
      const radioGroup = page.querySelectorAll(`input[name="${input.name}"]`);
      const isChecked = Array.from(radioGroup).some(radio => radio.checked);
      if (!isChecked) {
        input.focus();
        return false;
      }
    }
  }

  return true;
}

nextBtn.addEventListener('click', () => {
  if (validatePage(currentPage)) {
    currentPage++;
    showPage(currentPage);
  } else {
    alert('Please fill in all required fields before continuing.');
  }
});

prevBtn.addEventListener('click', () => {
  currentPage--;
  showPage(currentPage);
});

cancelBtn.addEventListener('click', () => {
  addClaimModal.classList.remove('show');
  addClaimForm.reset();
  currentPage = 1;
  showPage(1);
});

addClaimBtn.addEventListener('click', () => {
  addClaimModal.classList.add('show');
  currentPage = 1;
  showPage(1);
});

addClaimModal.addEventListener('click', (e) => {
  if (e.target === addClaimModal) {
    addClaimModal.classList.remove('show');
    addClaimForm.reset();
    currentPage = 1;
    showPage(1);
  }
});

addClaimForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validatePage(currentPage)) {
    alert('Please fill in all required fields.');
    return;
  }

  const formData = new FormData(addClaimForm);

  const intakeQuestions = {
    existing_damage: formData.get('existing_damage'),
    damage_cause: formData.get('damage_cause'),
    filed_claim: formData.get('filed_claim'),
    help_file: formData.get('help_file'),
    additional_notes: formData.get('additional_notes')
  };

  const claimData = {
    company_id: companyId,
    representative_id: repId,
    claim_number: formData.get('claim_number') || `CLAIM-${Date.now()}`,
    stage: formData.get('claim_stage'),
    homeowner_first_name: formData.get('homeowner_first_name'),
    homeowner_last_name: formData.get('homeowner_last_name'),
    homeowner_phone: formData.get('homeowner_phone'),
    homeowner_email: formData.get('homeowner_email'),
    property_address: formData.get('property_address'),
    insurance_company: formData.get('insurance_company'),
    policy_number: formData.get('policy_number'),
    adjuster_name: formData.get('adjuster_name'),
    adjuster_phone: formData.get('adjuster_phone'),
    adjuster_email: formData.get('adjuster_email'),
    date_of_loss: formData.get('date_of_loss') || null,
    intake_questions: intakeQuestions
  };

  try {
    const { data, error } = await supabase
      .from('claims')
      .insert([claimData])
      .select()
      .single();

    if (error) throw error;

    addClaimModal.classList.remove('show');
    addClaimForm.reset();
    currentPage = 1;
    showPage(1);
    loadClaims();
  } catch (error) {
    console.error('Error adding claim:', error);
    alert('Failed to add claim. Please try again.');
  }
});

async function loadCompany() {
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .maybeSingle();

    if (error) throw error;

    if (!company) {
      companyInfo.innerHTML = '<p>Company not found</p>';
      return;
    }

    const logoHtml = company.logo_url
      ? `<img src="${company.logo_url}" alt="${company.name} logo" class="company-logo-display">`
      : '';

    companyInfo.innerHTML = `
      ${logoHtml}
      <div class="company-details">
        <h3>${company.name}</h3>
        <p><strong>Phone:</strong> ${company.phone}</p>
        <p><strong>Email:</strong> ${company.email}</p>
        <p><strong>Address:</strong> ${company.address}</p>
        ${company.license ? `<p><strong>License:</strong> ${company.license}</p>` : ''}
      </div>
    `;
  } catch (error) {
    console.error('Error loading company:', error);
    companyInfo.innerHTML = '<p>Error loading company information</p>';
  }
}

async function loadClaims() {
  try {
    const { data: claims, error } = await supabase
      .from('claims')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    displayClaims(claims || []);
  } catch (error) {
    console.error('Error loading claims:', error);
    claimsGrid.innerHTML = '<p class="loading">Error loading claims</p>';
  }
}

function displayClaims(claims) {
  if (claims.length === 0) {
    claimsGrid.innerHTML = `
      <div class="empty-state">
        <h3>No Claims Yet</h3>
        <p>Click the "Import New Claim" button to get started</p>
      </div>
    `;
    return;
  }

  claimsGrid.innerHTML = '';

  claims.forEach(claim => {
    const card = document.createElement('div');
    card.className = 'claim-card';

    const stageClass = `stage-${claim.stage}`;
    const stageName = claim.stage.charAt(0).toUpperCase() + claim.stage.slice(1);

    card.innerHTML = `
      <div class="claim-header">
        <div class="claim-number">${claim.claim_number}</div>
        <div class="claim-stage ${stageClass}">${stageName}</div>
      </div>
      <div class="claim-info">
        <p><strong>Homeowner:</strong> ${claim.homeowner_first_name} ${claim.homeowner_last_name}</p>
        <p><strong>Phone:</strong> ${claim.homeowner_phone}</p>
        <p><strong>Property:</strong> ${claim.property_address}</p>
        <p><strong>Insurance:</strong> ${claim.insurance_company}</p>
        ${claim.date_of_loss ? `<p><strong>Date of Loss:</strong> ${new Date(claim.date_of_loss).toLocaleDateString()}</p>` : ''}
      </div>
    `;

    card.addEventListener('click', () => {
      window.location.href = `claim-details.html?claim_id=${claim.id}`;
    });

    claimsGrid.appendChild(card);
  });
}

loadCompany();
loadClaims();

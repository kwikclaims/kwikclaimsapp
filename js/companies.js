import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const urlParams = new URLSearchParams(window.location.search);
const repId = urlParams.get('rep_id');

if (!repId) {
  window.location.href = 'dashboard.html';
}

const repInfo = document.getElementById('repInfo');
const companyGrid = document.getElementById('companyGrid');
const addCompanyBtn = document.getElementById('addCompanyBtn');
const addCompanyModal = document.getElementById('addCompanyModal');
const closeAddCompanyModal = document.getElementById('closeAddCompanyModal');
const addCompanyForm = document.getElementById('addCompanyForm');
const companyLogo = document.getElementById('companyLogo');
const logoPreview = document.getElementById('logoPreview');

let selectedLogoFile = null;

companyLogo.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedLogoFile = file;
    const reader = new FileReader();
    reader.onload = (event) => {
      logoPreview.innerHTML = `<img src="${event.target.result}" alt="Logo preview">`;
    };
    reader.readAsDataURL(file);
  } else {
    selectedLogoFile = null;
    logoPreview.innerHTML = '';
  }
});

addCompanyBtn.addEventListener('click', () => {
  addCompanyModal.classList.add('show');
});

closeAddCompanyModal.addEventListener('click', () => {
  addCompanyModal.classList.remove('show');
  addCompanyForm.reset();
  logoPreview.innerHTML = '';
  selectedLogoFile = null;
});

addCompanyModal.addEventListener('click', (e) => {
  if (e.target === addCompanyModal) {
    addCompanyModal.classList.remove('show');
    addCompanyForm.reset();
    logoPreview.innerHTML = '';
    selectedLogoFile = null;
  }
});

addCompanyForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(addCompanyForm);
  let logoUrl = null;

  try {
    if (selectedLogoFile) {
      const fileExt = selectedLogoFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${repId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, selectedLogoFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      logoUrl = urlData.publicUrl;
    }

    const companyData = {
      representative_id: repId,
      name: formData.get('name'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      license: formData.get('license') || null,
      email: formData.get('email'),
      logo_url: logoUrl
    };

    const { data, error } = await supabase
      .from('companies')
      .insert([companyData])
      .select()
      .single();

    if (error) throw error;

    addCompanyModal.classList.remove('show');
    addCompanyForm.reset();
    logoPreview.innerHTML = '';
    selectedLogoFile = null;
    loadCompanies();
  } catch (error) {
    console.error('Error adding company:', error);
    alert('Failed to add company. Please try again.');
  }
});

async function loadRepresentative() {
  try {
    const { data: rep, error } = await supabase
      .from('representatives')
      .select('*')
      .eq('id', repId)
      .maybeSingle();

    if (error) throw error;

    if (!rep) {
      repInfo.innerHTML = '<p>Representative not found</p>';
      return;
    }

    repInfo.innerHTML = `
      <h3>${rep.name}</h3>
      <p><strong>Email:</strong> ${rep.email}</p>
      <p><strong>Phone:</strong> ${rep.phone}</p>
    `;
  } catch (error) {
    console.error('Error loading representative:', error);
    repInfo.innerHTML = '<p>Error loading representative information</p>';
  }
}

async function loadCompanies() {
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .eq('representative_id', repId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    displayCompanies(companies || []);
  } catch (error) {
    console.error('Error loading companies:', error);
  }
}

function displayCompanies(companies) {
  const addCompanyCard = document.querySelector('.add-company-card');
  companyGrid.innerHTML = '';
  companyGrid.appendChild(addCompanyCard);

  if (companies.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.style.gridColumn = '1 / -1';
    emptyState.innerHTML = `
      <h3>No Companies Yet</h3>
      <p>Click the "Add New Company" card to get started</p>
    `;
    companyGrid.appendChild(emptyState);
    return;
  }

  companies.forEach(company => {
    const card = document.createElement('div');
    card.className = 'company-card';

    const logoHtml = company.logo_url
      ? `<img src="${company.logo_url}" alt="${company.name} logo" class="company-logo">`
      : '';

    card.innerHTML = `
      ${logoHtml}
      <h3>${company.name}</h3>
      <p><strong>Phone:</strong> ${company.phone}</p>
      <p><strong>Email:</strong> ${company.email}</p>
      <p><strong>Address:</strong> ${company.address}</p>
      ${company.license ? `<p><strong>License:</strong> ${company.license}</p>` : ''}
    `;

    card.addEventListener('click', () => {
      window.location.href = `claims.html?company_id=${company.id}&rep_id=${repId}`;
    });

    companyGrid.appendChild(card);
  });
}

loadRepresentative();
loadCompanies();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DASHBOARD_PASSWORD = 'Operation10Ms';
const AUTH_KEY = 'dashboard_authenticated';

const loginContainer = document.getElementById('loginContainer');
const dashboardMain = document.getElementById('dashboardMain');
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtn');
const addRepBtn = document.getElementById('addRepBtn');
const addRepModal = document.getElementById('addRepModal');
const closeAddRepModal = document.getElementById('closeAddRepModal');
const addRepForm = document.getElementById('addRepForm');
const repGrid = document.getElementById('repGrid');

function checkAuth() {
  const isAuthenticated = sessionStorage.getItem(AUTH_KEY);
  if (isAuthenticated === 'true') {
    showDashboard();
  }
}

function showDashboard() {
  loginContainer.style.display = 'none';
  dashboardMain.classList.add('show');
  loadRepresentatives();
}

function hideDashboard() {
  loginContainer.style.display = 'flex';
  dashboardMain.classList.remove('show');
  sessionStorage.removeItem(AUTH_KEY);
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const password = document.getElementById('password').value;

  if (password === DASHBOARD_PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, 'true');
    errorMessage.classList.remove('show');
    showDashboard();
  } else {
    errorMessage.classList.add('show');
  }
});

logoutBtn.addEventListener('click', () => {
  hideDashboard();
  loginForm.reset();
});

addRepBtn.addEventListener('click', () => {
  addRepModal.classList.add('show');
});

closeAddRepModal.addEventListener('click', () => {
  addRepModal.classList.remove('show');
  addRepForm.reset();
});

addRepModal.addEventListener('click', (e) => {
  if (e.target === addRepModal) {
    addRepModal.classList.remove('show');
    addRepForm.reset();
  }
});

addRepForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(addRepForm);
  const repData = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone')
  };

  try {
    const { data, error } = await supabase
      .from('representatives')
      .insert([repData])
      .select()
      .single();

    if (error) throw error;

    addRepModal.classList.remove('show');
    addRepForm.reset();
    loadRepresentatives();
  } catch (error) {
    console.error('Error adding representative:', error);
    alert('Failed to add representative. Please try again.');
  }
});

async function loadRepresentatives() {
  try {
    const { data: reps, error } = await supabase
      .from('representatives')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    displayRepresentatives(reps || []);
  } catch (error) {
    console.error('Error loading representatives:', error);
  }
}

function displayRepresentatives(reps) {
  const addRepCard = document.querySelector('.add-rep-card');
  repGrid.innerHTML = '';
  repGrid.appendChild(addRepCard);

  if (reps.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.style.gridColumn = '1 / -1';
    emptyState.innerHTML = `
      <h3>No Representatives Yet</h3>
      <p>Click the "Add New Representative" card to get started</p>
    `;
    repGrid.appendChild(emptyState);
    return;
  }

  reps.forEach(rep => {
    const card = document.createElement('div');
    card.className = 'rep-card';
    card.innerHTML = `
      <h3>${rep.name}</h3>
      <p><strong>Email:</strong> ${rep.email}</p>
      <p><strong>Phone:</strong> ${rep.phone}</p>
    `;
    card.addEventListener('click', () => {
      window.location.href = `companies.html?rep_id=${rep.id}`;
    });
    repGrid.appendChild(card);
  });
}

checkAuth();

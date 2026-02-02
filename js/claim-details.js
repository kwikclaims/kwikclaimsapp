import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const urlParams = new URLSearchParams(window.location.search);
const claimId = urlParams.get('claim_id');

if (!claimId) {
  window.location.href = 'dashboard.html';
}

let currentClaim = null;

const loadingContainer = document.getElementById('loadingContainer');
const claimContent = document.getElementById('claimContent');
const claimTitle = document.getElementById('claimTitle');
const backBtn = document.getElementById('backBtn');
const saveBtn = document.getElementById('saveBtn');
const saveIndicator = document.getElementById('saveIndicator');
const intakeQuestions = document.getElementById('intakeQuestions');

const genLossAssessment = document.getElementById('genLossAssessment');
const genConsultation = document.getElementById('genConsultation');
const genConstruction = document.getElementById('genConstruction');
const genReceipt = document.getElementById('genReceipt');
const genCertificate = document.getElementById('genCertificate');
const genInvoice = document.getElementById('genInvoice');

genLossAssessment.addEventListener('click', () => {
  window.location.href = `loss-assessment.html?claim_id=${claimId}`;
});

genConsultation.addEventListener('click', () => {
  alert('Consultation Agreement Generator - Coming soon');
});

genConstruction.addEventListener('click', () => {
  window.location.href = `construction-agreement.html?claim_id=${claimId}`;
});

genReceipt.addEventListener('click', () => {
  window.location.href = `receipt-generator.html?claim_id=${claimId}`;
});

genCertificate.addEventListener('click', () => {
  window.location.href = `certificate-completion.html?claim_id=${claimId}`;
});

genInvoice.addEventListener('click', () => {
  alert('Invoice/Estimate Generator - Coming soon');
});

async function loadClaim() {
  try {
    const { data: claim, error } = await supabase
      .from('claims')
      .select('*, companies(*)')
      .eq('id', claimId)
      .maybeSingle();

    if (error) throw error;

    if (!claim) {
      loadingContainer.innerHTML = '<p>Claim not found</p>';
      return;
    }

    currentClaim = claim;
    displayClaim(claim);

    backBtn.href = `claims.html?company_id=${claim.company_id}&rep_id=${claim.representative_id}`;
  } catch (error) {
    console.error('Error loading claim:', error);
    loadingContainer.innerHTML = '<p>Error loading claim details</p>';
  }
}

function displayClaim(claim) {
  loadingContainer.style.display = 'none';
  claimContent.style.display = 'block';

  claimTitle.textContent = `Claim: ${claim.claim_number}`;

  document.getElementById('claim_number').value = claim.claim_number || '';
  document.getElementById('stage').value = claim.stage || 'intake';
  document.getElementById('date_of_loss').value = claim.date_of_loss || '';

  document.getElementById('homeowner_first_name').value = claim.homeowner_first_name || '';
  document.getElementById('homeowner_last_name').value = claim.homeowner_last_name || '';
  document.getElementById('homeowner_phone').value = claim.homeowner_phone || '';
  document.getElementById('homeowner_email').value = claim.homeowner_email || '';
  document.getElementById('property_address').value = claim.property_address || '';

  document.getElementById('insurance_company').value = claim.insurance_company || '';
  document.getElementById('policy_number').value = claim.policy_number || '';
  document.getElementById('adjuster_name').value = claim.adjuster_name || '';
  document.getElementById('adjuster_phone').value = claim.adjuster_phone || '';
  document.getElementById('adjuster_email').value = claim.adjuster_email || '';

  if (claim.intake_questions) {
    displayIntakeQuestions(claim.intake_questions);
  }
}

function displayIntakeQuestions(questions) {
  const questionLabels = {
    existing_damage: 'Do you have existing damage to your home that has not been fixed yet?',
    damage_cause: 'Do you have any idea what may have caused the damage?',
    filed_claim: 'Have you filed a claim with your insurance company yet?',
    help_file: 'Would you like us to help file the claim?',
    additional_notes: 'Any additional notes or concerns?'
  };

  intakeQuestions.innerHTML = '';

  Object.keys(questions).forEach(key => {
    const value = questions[key];
    if (value) {
      const questionDiv = document.createElement('div');
      questionDiv.className = 'question-item';
      questionDiv.innerHTML = `
        <h4>${questionLabels[key] || key}</h4>
        <p>${value}</p>
      `;
      intakeQuestions.appendChild(questionDiv);
    }
  });

  if (intakeQuestions.children.length === 0) {
    intakeQuestions.innerHTML = '<p style="color: #718096;">No intake questions recorded</p>';
  }
}

saveBtn.addEventListener('click', async () => {
  try {
    const updatedData = {
      claim_number: document.getElementById('claim_number').value,
      stage: document.getElementById('stage').value,
      date_of_loss: document.getElementById('date_of_loss').value || null,
      homeowner_first_name: document.getElementById('homeowner_first_name').value,
      homeowner_last_name: document.getElementById('homeowner_last_name').value,
      homeowner_phone: document.getElementById('homeowner_phone').value,
      homeowner_email: document.getElementById('homeowner_email').value,
      property_address: document.getElementById('property_address').value,
      insurance_company: document.getElementById('insurance_company').value,
      policy_number: document.getElementById('policy_number').value,
      adjuster_name: document.getElementById('adjuster_name').value,
      adjuster_phone: document.getElementById('adjuster_phone').value,
      adjuster_email: document.getElementById('adjuster_email').value
    };

    const { error } = await supabase
      .from('claims')
      .update(updatedData)
      .eq('id', claimId);

    if (error) throw error;

    saveIndicator.classList.add('show');
    setTimeout(() => {
      saveIndicator.classList.remove('show');
    }, 3000);
  } catch (error) {
    console.error('Error saving claim:', error);
    alert('Failed to save changes. Please try again.');
  }
});

loadClaim();

import { createClient } from '@supabase/supabase-js';
import SignaturePad from 'signature_pad';
import { jsPDF } from 'jspdf';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const urlParams = new URLSearchParams(window.location.search);
const claimId = urlParams.get('claim_id');

if (!claimId) {
  window.location.href = 'dashboard.html';
}

const backBtn = document.getElementById('backBtn');
backBtn.href = `claim-details.html?claim_id=${claimId}`;

const contractorCanvas = document.getElementById('contractorSignature');
const clientCanvas = document.getElementById('clientSignature');

const contractorPad = new SignaturePad(contractorCanvas);
const clientPad = new SignaturePad(clientCanvas);

function resizeCanvas(canvas) {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext('2d').scale(ratio, ratio);
}

resizeCanvas(contractorCanvas);
resizeCanvas(clientCanvas);

window.addEventListener('resize', () => {
  resizeCanvas(contractorCanvas);
  resizeCanvas(clientCanvas);
});

document.getElementById('clearContractor').addEventListener('click', () => {
  contractorPad.clear();
});

document.getElementById('lockContractor').addEventListener('click', () => {
  if (contractorPad.isEmpty()) {
    alert('Please provide a signature first');
    return;
  }
  contractorPad.off();
  alert('Contractor signature locked');
});

document.getElementById('clearClient').addEventListener('click', () => {
  clientPad.clear();
});

document.getElementById('lockClient').addEventListener('click', () => {
  if (clientPad.isEmpty()) {
    alert('Please provide a signature first');
    return;
  }
  clientPad.off();
  alert('Client signature locked');
});

let claimData = null;
let companyData = null;

async function loadData() {
  try {
    const { data: claim, error } = await supabase
      .from('claims')
      .select('*, companies(*)')
      .eq('id', claimId)
      .maybeSingle();

    if (error) throw error;

    if (claim) {
      claimData = claim;
      companyData = claim.companies;
      populateForm();
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function populateForm() {
  if (companyData) {
    document.getElementById('contractorName').value = companyData.name || '';
    document.getElementById('contractorAddress').value = companyData.address || '';
    document.getElementById('contractorPhone').value = companyData.phone || '';
    document.getElementById('contractorEmail').value = companyData.email || '';
    document.getElementById('contractorLicense').value = companyData.license || '';

    if (companyData.logo_url) {
      const logoImg = document.getElementById('companyLogo');
      logoImg.src = companyData.logo_url;
      logoImg.style.display = 'block';
    }
  }

  if (claimData) {
    const clientName = `${claimData.homeowner_first_name} ${claimData.homeowner_last_name}`;
    document.getElementById('clientName').value = clientName;
    document.getElementById('clientAddress').value = claimData.property_address || '';
    document.getElementById('clientPhone').value = claimData.homeowner_phone || '';
    document.getElementById('clientEmail').value = claimData.homeowner_email || '';
    document.getElementById('jobReference').value = claimData.claim_number || '';
  }

  document.getElementById('contractorDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('clientDate').value = new Date().toISOString().split('T')[0];
}

document.getElementById('btnDownload').addEventListener('click', () => {
  generatePDF();
});

document.getElementById('btnPrint').addEventListener('click', () => {
  window.print();
});

document.getElementById('btnText').addEventListener('click', () => {
  alert('SMS functionality would integrate with a service like Twilio in production');
});

document.getElementById('btnEmail').addEventListener('click', () => {
  alert('Email functionality would integrate with an email service in production');
});

function generatePDF() {
  const pdf = new jsPDF('p', 'pt', 'letter');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 40;
  let yPos = margin;

  if (companyData && companyData.logo_url) {
    const logoImg = document.getElementById('companyLogo');
    if (logoImg && logoImg.complete) {
      try {
        pdf.addImage(logoImg, 'PNG', (pageWidth - 150) / 2, yPos, 150, 60);
        yPos += 70;
      } catch (error) {
        console.error('Error adding logo:', error);
      }
    }
  }

  pdf.setFontSize(18);
  pdf.setFont(undefined, 'bold');
  pdf.text('CONSTRUCTION LABOR AGREEMENT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 40;

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Contractor Information', margin, yPos);
  yPos += 20;

  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(10);

  const contractorInfo = [
    `Company: ${document.getElementById('contractorName').value}`,
    `Address: ${document.getElementById('contractorAddress').value}`,
    `Phone: ${document.getElementById('contractorPhone').value}`,
    `Email: ${document.getElementById('contractorEmail').value}`,
    `License: ${document.getElementById('contractorLicense').value}`
  ];

  contractorInfo.forEach(line => {
    pdf.text(line, margin, yPos);
    yPos += 15;
  });

  yPos += 10;
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Client Information', margin, yPos);
  yPos += 20;

  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(10);

  const clientInfo = [
    `Name: ${document.getElementById('clientName').value}`,
    `Property: ${document.getElementById('clientAddress').value}`,
    `Phone: ${document.getElementById('clientPhone').value}`,
    `Email: ${document.getElementById('clientEmail').value}`
  ];

  clientInfo.forEach(line => {
    pdf.text(line, margin, yPos);
    yPos += 15;
  });

  yPos += 10;
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Project Details', margin, yPos);
  yPos += 20;

  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(10);

  const projectInfo = [
    `Job Reference: ${document.getElementById('jobReference').value}`,
    `Scope of Work: ${document.getElementById('scopeOfWork').value}`,
    `Contract Amount: ${document.getElementById('contractAmount').value}`
  ];

  projectInfo.forEach(line => {
    const lines = pdf.splitTextToSize(line, pageWidth - (margin * 2));
    lines.forEach(splitLine => {
      pdf.text(splitLine, margin, yPos);
      yPos += 15;
    });
  });

  yPos += 10;
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Terms and Conditions', margin, yPos);
  yPos += 20;

  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(10);

  const terms = document.getElementById('terms').value;
  const termLines = pdf.splitTextToSize(terms, pageWidth - (margin * 2));
  termLines.forEach(line => {
    if (yPos > 700) {
      pdf.addPage();
      yPos = margin;
    }
    pdf.text(line, margin, yPos);
    yPos += 15;
  });

  pdf.addPage();
  yPos = margin;

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Signatures', margin, yPos);
  yPos += 30;

  const sigWidth = 200;
  const sigHeight = 80;

  pdf.setFont(undefined, 'bold');
  pdf.text('Contractor Signature:', margin, yPos);

  if (!contractorPad.isEmpty()) {
    const sigData = contractorPad.toDataURL();
    pdf.addImage(sigData, 'PNG', margin, yPos + 10, sigWidth, sigHeight);
  }

  yPos += sigHeight + 20;
  pdf.setFont(undefined, 'normal');
  pdf.text(`Name: ${document.getElementById('contractorSignerName').value}`, margin, yPos);
  yPos += 15;
  pdf.text(`Date: ${document.getElementById('contractorDate').value}`, margin, yPos);

  yPos += 40;

  pdf.setFont(undefined, 'bold');
  pdf.text('Client Signature:', margin, yPos);

  if (!clientPad.isEmpty()) {
    const sigData = clientPad.toDataURL();
    pdf.addImage(sigData, 'PNG', margin, yPos + 10, sigWidth, sigHeight);
  }

  yPos += sigHeight + 20;
  pdf.setFont(undefined, 'normal');
  pdf.text(`Name: ${document.getElementById('clientSignerName').value}`, margin, yPos);
  yPos += 15;
  pdf.text(`Date: ${document.getElementById('clientDate').value}`, margin, yPos);

  const fileName = `Construction_Agreement_${claimData?.claim_number || Date.now()}.pdf`;
  pdf.save(fileName);
}

loadData();

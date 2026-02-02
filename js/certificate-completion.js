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

document.getElementById('clearClient').addEventListener('click', () => {
  clientPad.clear();
});

const photoInput = document.getElementById('photoInput');
const photoUploadZone = document.getElementById('photoUploadZone');
const photoGrid = document.getElementById('photoGrid');

let uploadedPhotos = [];

photoUploadZone.addEventListener('click', () => {
  photoInput.click();
});

photoInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      uploadedPhotos.push({
        file: file,
        url: event.target.result
      });
      renderPhotos();
    };
    reader.readAsDataURL(file);
  });

  photoInput.value = '';
});

function renderPhotos() {
  photoGrid.innerHTML = '';

  uploadedPhotos.forEach((photo, index) => {
    const photoDiv = document.createElement('div');
    photoDiv.className = 'photo-item';
    photoDiv.innerHTML = `
      <img src="${photo.url}" alt="Photo ${index + 1}">
      <button class="photo-remove" data-index="${index}">×</button>
    `;

    const removeBtn = photoDiv.querySelector('.photo-remove');
    removeBtn.addEventListener('click', () => {
      uploadedPhotos.splice(index, 1);
      renderPhotos();
    });

    photoGrid.appendChild(photoDiv);
  });
}

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
    document.getElementById('companyName').value = companyData.name || '';

    if (companyData.logo_url) {
      const logoImg = document.getElementById('companyLogo');
      logoImg.src = companyData.logo_url;
      logoImg.style.display = 'block';
    }
  }

  if (claimData) {
    const clientName = `${claimData.homeowner_first_name} ${claimData.homeowner_last_name}`;
    document.getElementById('clientName').value = clientName;
    document.getElementById('propertyAddress').value = claimData.property_address || '';
    document.getElementById('projectRef').value = claimData.claim_number || '';
    document.getElementById('clientSignerName').value = clientName;
  }

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('completionDate').value = today;
  document.getElementById('contractorDate').value = today;
  document.getElementById('clientDate').value = today;
}

document.getElementById('btnDownload').addEventListener('click', () => {
  generatePDF();
});

document.getElementById('btnPrint').addEventListener('click', () => {
  window.print();
});

async function generatePDF() {
  const pdf = new jsPDF('p', 'pt', 'letter');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
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

  pdf.setFontSize(26);
  pdf.setFont(undefined, 'bold');
  pdf.text('CERTIFICATE OF COMPLETION', pageWidth / 2, yPos, { align: 'center' });
  yPos += 30;

  pdf.setFontSize(11);
  pdf.setFont(undefined, 'italic');
  pdf.text('This certifies that the following work has been completed', pageWidth / 2, yPos, { align: 'center' });
  yPos += 50;

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');

  const certText = `This is to certify that ${document.getElementById('companyName').value} has successfully completed all work for ${document.getElementById('clientName').value} at the property located at ${document.getElementById('propertyAddress').value}`;

  const lines = pdf.splitTextToSize(certText, pageWidth - (margin * 2));
  lines.forEach(line => {
    pdf.text(line, pageWidth / 2, yPos, { align: 'center' });
    yPos += 18;
  });

  yPos += 30;

  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.text('Project Details', margin, yPos);
  yPos += 25;

  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');

  const details = [
    { label: 'Project Reference:', value: document.getElementById('projectRef').value },
    { label: 'Completion Date:', value: document.getElementById('completionDate').value },
    { label: 'Work Description:', value: document.getElementById('workDescription').value },
    { label: 'Materials Used:', value: document.getElementById('materialsUsed').value }
  ];

  details.forEach(detail => {
    pdf.setFont(undefined, 'bold');
    pdf.text(detail.label, margin, yPos);
    pdf.setFont(undefined, 'normal');

    const valueLines = pdf.splitTextToSize(detail.value, pageWidth - margin - 150);
    valueLines.forEach((line, index) => {
      pdf.text(line, margin + 150, yPos + (index * 15));
    });

    yPos += Math.max(15, valueLines.length * 15) + 10;
  });

  if (uploadedPhotos.length > 0) {
    yPos += 20;

    if (yPos + 200 > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
    }

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Project Photos', margin, yPos);
    yPos += 20;

    const photoWidth = 150;
    const photoHeight = 112;
    const photosPerRow = 3;
    const photoSpacing = 10;

    for (let i = 0; i < uploadedPhotos.length; i++) {
      const col = i % photosPerRow;
      const row = Math.floor(i / photosPerRow);

      if (row > 0 && col === 0) {
        yPos += photoHeight + photoSpacing;

        if (yPos + photoHeight > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
      }

      const x = margin + (col * (photoWidth + photoSpacing));
      const y = yPos + (row === 0 ? 0 : 0);

      try {
        pdf.addImage(uploadedPhotos[i].url, 'JPEG', x, y, photoWidth, photoHeight, undefined, 'FAST');
      } catch (error) {
        console.error('Error adding photo:', error);
      }
    }

    yPos += photoHeight + 30;
  }

  if (yPos + 250 > pageHeight - margin) {
    pdf.addPage();
    yPos = margin;
  }

  yPos += 40;
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Signatures', margin, yPos);
  yPos += 30;

  const sigWidth = 200;
  const sigHeight = 60;

  pdf.setFont(undefined, 'bold');
  pdf.text('Contractor', margin, yPos);

  if (!contractorPad.isEmpty()) {
    const sigData = contractorPad.toDataURL();
    pdf.addImage(sigData, 'PNG', margin, yPos + 10, sigWidth, sigHeight);
  }

  yPos += sigHeight + 20;
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(10);
  pdf.text(`Name: ${document.getElementById('contractorName').value}`, margin, yPos);
  yPos += 15;
  pdf.text(`Title: ${document.getElementById('contractorTitle').value}`, margin, yPos);
  yPos += 15;
  pdf.text(`Date: ${document.getElementById('contractorDate').value}`, margin, yPos);

  yPos += 30;

  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(12);
  pdf.text('Client', margin, yPos);

  if (!clientPad.isEmpty()) {
    const sigData = clientPad.toDataURL();
    pdf.addImage(sigData, 'PNG', margin, yPos + 10, sigWidth, sigHeight);
  }

  yPos += sigHeight + 20;
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(10);
  pdf.text(`Name: ${document.getElementById('clientSignerName').value}`, margin, yPos);
  yPos += 15;
  pdf.text(`Date: ${document.getElementById('clientDate').value}`, margin, yPos);

  const fileName = `Certificate_of_Completion_${claimData?.claim_number || Date.now()}.pdf`;
  pdf.save(fileName);
}

loadData();

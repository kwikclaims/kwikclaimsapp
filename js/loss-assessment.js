import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';

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

const photoInput = document.getElementById('photoInput');
const photoUploadZone = document.getElementById('photoUploadZone');
const photosGrid = document.getElementById('photosGrid');
const addVideoLink = document.getElementById('addVideoLink');
const videoLinksContainer = document.getElementById('videoLinksContainer');
const generateBtn = document.getElementById('generateBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

let uploadedPhotos = [];
let claimData = null;
let companyData = null;

async function loadClaimData() {
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
    }
  } catch (error) {
    console.error('Error loading claim data:', error);
  }
}

photoUploadZone.addEventListener('click', () => {
  photoInput.click();
});

photoInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);

  if (uploadedPhotos.length + files.length > 250) {
    alert('Maximum 250 photos allowed');
    return;
  }

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
  photosGrid.innerHTML = '';

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

    photosGrid.appendChild(photoDiv);
  });
}

addVideoLink.addEventListener('click', () => {
  const newRow = document.createElement('div');
  newRow.className = 'list-input-row';
  newRow.innerHTML = `
    <input type="url" placeholder="Enter video URL" class="video-link-input">
    <button class="btn-remove-item" onclick="this.parentElement.remove()">×</button>
  `;
  videoLinksContainer.appendChild(newRow);
});

generateBtn.addEventListener('click', async () => {
  loadingOverlay.classList.add('show');

  try {
    const coverLetter = document.getElementById('coverLetter').value;
    const measurements = document.getElementById('measurements').value;
    const materialTests = document.getElementById('materialTests').value;
    const engineerReports = document.getElementById('engineerReports').value;
    const estimate = document.getElementById('estimate').value;
    const builderCodes = document.getElementById('builderCodes').value;

    const videoLinks = Array.from(document.querySelectorAll('.video-link-input'))
      .map(input => input.value)
      .filter(url => url.trim() !== '');

    await generatePDF({
      coverLetter,
      videoLinks,
      measurements,
      materialTests,
      engineerReports,
      estimate,
      builderCodes,
      photos: uploadedPhotos
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    loadingOverlay.classList.remove('show');
  }
});

async function generatePDF(data) {
  const pdf = new jsPDF('p', 'pt', 'letter');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  function addNewPage() {
    pdf.addPage();
    yPos = margin;
  }

  function checkPageBreak(neededSpace) {
    if (yPos + neededSpace > pageHeight - margin) {
      addNewPage();
      return true;
    }
    return false;
  }

  function addTitle(text, size = 18) {
    checkPageBreak(30);
    pdf.setFontSize(size);
    pdf.setFont(undefined, 'bold');
    pdf.text(text, margin, yPos);
    yPos += size + 10;
  }

  function addText(text, size = 11) {
    pdf.setFontSize(size);
    pdf.setFont(undefined, 'normal');
    const lines = pdf.splitTextToSize(text, contentWidth);
    lines.forEach(line => {
      checkPageBreak(size + 2);
      pdf.text(line, margin, yPos);
      yPos += size + 2;
    });
    yPos += 10;
  }

  addTitle('LOSS ASSESSMENT REPORT', 24);
  yPos += 10;

  if (claimData) {
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Claim Number: ${claimData.claim_number}`, margin, yPos);
    yPos += 20;
    pdf.text(`Homeowner: ${claimData.homeowner_first_name} ${claimData.homeowner_last_name}`, margin, yPos);
    yPos += 20;
    pdf.text(`Property: ${claimData.property_address}`, margin, yPos);
    yPos += 30;
  }

  if (data.coverLetter) {
    addTitle('1. Cover Letter');
    addText(data.coverLetter);
    yPos += 20;
  }

  if (data.videoLinks && data.videoLinks.length > 0) {
    addTitle('2. Video Links');
    data.videoLinks.forEach((link, index) => {
      addText(`${index + 1}. ${link}`);
    });
    yPos += 20;
  }

  if (data.measurements) {
    addTitle('3. Measurements');
    addText(data.measurements);
    yPos += 20;
  }

  if (data.materialTests) {
    addTitle('4. Material Tests');
    addText(data.materialTests);
    yPos += 20;
  }

  if (data.engineerReports) {
    addTitle('5. Engineer Reports');
    addText(data.engineerReports);
    yPos += 20;
  }

  if (data.estimate) {
    addTitle('6. Estimate');
    addText(data.estimate);
    yPos += 20;
  }

  if (data.photos && data.photos.length > 0) {
    addNewPage();
    addTitle('7. Photos');
    yPos += 10;

    const photosPerPage = 4;
    const photoWidth = (contentWidth - 20) / 2;
    const photoHeight = photoWidth * 0.75;

    for (let i = 0; i < data.photos.length; i += photosPerPage) {
      if (i > 0) addNewPage();

      const pagePhotos = data.photos.slice(i, i + photosPerPage);

      for (let j = 0; j < pagePhotos.length; j++) {
        const col = j % 2;
        const row = Math.floor(j / 2);
        const x = margin + (col * (photoWidth + 10));
        const y = yPos + (row * (photoHeight + 30));

        try {
          pdf.addImage(
            pagePhotos[j].url,
            'JPEG',
            x,
            y,
            photoWidth,
            photoHeight,
            undefined,
            'FAST'
          );

          pdf.setFontSize(9);
          pdf.setFont(undefined, 'normal');
          pdf.text(`Photo ${i + j + 1}`, x, y + photoHeight + 15);
        } catch (error) {
          console.error('Error adding photo:', error);
        }
      }
    }
    addNewPage();
  }

  if (data.builderCodes) {
    addTitle('8. Builder Codes');
    addText(data.builderCodes);
  }

  const fileName = `Loss_Assessment_${claimData?.claim_number || 'Report'}_${Date.now()}.pdf`;

  const pdfBlob = pdf.output('blob');

  if (pdfBlob.size > 24 * 1024 * 1024) {
    alert('PDF is larger than 24MB. Compression would be applied in production.');
  }

  pdf.save(fileName);
}

loadClaimData();

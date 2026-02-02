import { createClient } from '@supabase/supabase-js';
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
    document.getElementById('companyAddress').value = companyData.address || '';
    document.getElementById('companyPhone').value = companyData.phone || '';
    document.getElementById('companyEmail').value = companyData.email || '';

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
  }

  document.getElementById('receiptNumber').value = `RCT-${Date.now()}`;
  document.getElementById('receiptDate').value = new Date().toISOString().split('T')[0];
}

function calculateItemAmount(row) {
  const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
  const price = parseFloat(row.querySelector('.item-price').value) || 0;
  const amount = quantity * price;
  row.querySelector('.item-amount').textContent = `$${amount.toFixed(2)}`;
  calculateTotal();
}

function calculateTotal() {
  const rows = document.querySelectorAll('.item-row');
  let total = 0;

  rows.forEach(row => {
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    total += quantity * price;
  });

  document.getElementById('totalAmount').textContent = `$${total.toFixed(2)}`;
}

document.getElementById('itemsTableBody').addEventListener('input', (e) => {
  if (e.target.classList.contains('item-quantity') || e.target.classList.contains('item-price')) {
    const row = e.target.closest('.item-row');
    calculateItemAmount(row);
  }
});

document.getElementById('addItemBtn').addEventListener('click', () => {
  const tbody = document.getElementById('itemsTableBody');
  const newRow = document.createElement('tr');
  newRow.className = 'item-row';
  newRow.innerHTML = `
    <td><input type="text" class="item-description" placeholder="Item description"></td>
    <td><input type="number" class="item-quantity" value="1" min="1"></td>
    <td><input type="number" class="item-price" value="0" min="0" step="0.01"></td>
    <td class="item-amount">$0.00</td>
    <td><button class="btn-remove" onclick="this.closest('tr').remove(); calculateTotal()">×</button></td>
  `;
  tbody.appendChild(newRow);
});

window.removeItem = function(btn) {
  btn.closest('tr').remove();
  calculateTotal();
};

window.calculateTotal = calculateTotal;

document.getElementById('btnDownload').addEventListener('click', () => {
  generatePDF();
});

document.getElementById('btnPrint').addEventListener('click', () => {
  window.print();
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

  pdf.setFontSize(24);
  pdf.setFont(undefined, 'bold');
  pdf.text('RECEIPT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 30;

  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Receipt #: ${document.getElementById('receiptNumber').value}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  pdf.text(`Date: ${document.getElementById('receiptDate').value}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 40;

  const leftCol = margin;
  const rightCol = pageWidth / 2 + 20;

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('From:', leftCol, yPos);
  pdf.text('To:', rightCol, yPos);
  yPos += 20;

  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');

  const fromInfo = [
    document.getElementById('companyName').value,
    document.getElementById('companyAddress').value,
    document.getElementById('companyPhone').value,
    document.getElementById('companyEmail').value
  ];

  const toInfo = [
    document.getElementById('clientName').value,
    document.getElementById('clientAddress').value,
    document.getElementById('clientPhone').value,
    document.getElementById('clientEmail').value
  ];

  const maxLines = Math.max(fromInfo.length, toInfo.length);

  for (let i = 0; i < maxLines; i++) {
    if (fromInfo[i]) pdf.text(fromInfo[i], leftCol, yPos);
    if (toInfo[i]) pdf.text(toInfo[i], rightCol, yPos);
    yPos += 15;
  }

  yPos += 30;

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Items / Services', margin, yPos);
  yPos += 20;

  pdf.setFontSize(10);
  pdf.setFont(undefined, 'bold');

  const colWidths = {
    description: 250,
    quantity: 80,
    price: 80,
    amount: 80
  };

  let xPos = margin;
  pdf.text('Description', xPos, yPos);
  xPos += colWidths.description;
  pdf.text('Qty', xPos, yPos);
  xPos += colWidths.quantity;
  pdf.text('Price', xPos, yPos);
  xPos += colWidths.price;
  pdf.text('Amount', xPos, yPos);
  yPos += 15;

  pdf.setLineWidth(1);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  pdf.setFont(undefined, 'normal');

  const rows = document.querySelectorAll('.item-row');
  rows.forEach(row => {
    const description = row.querySelector('.item-description').value;
    const quantity = row.querySelector('.item-quantity').value;
    const price = row.querySelector('.item-price').value;
    const amount = row.querySelector('.item-amount').textContent;

    xPos = margin;
    pdf.text(description, xPos, yPos);
    xPos += colWidths.description;
    pdf.text(quantity, xPos, yPos);
    xPos += colWidths.quantity;
    pdf.text(`$${parseFloat(price).toFixed(2)}`, xPos, yPos);
    xPos += colWidths.price;
    pdf.text(amount, xPos, yPos);
    yPos += 20;
  });

  yPos += 20;
  pdf.setLineWidth(2);
  pdf.line(pageWidth - margin - 200, yPos, pageWidth - margin, yPos);
  yPos += 20;

  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  const totalText = `TOTAL: ${document.getElementById('totalAmount').textContent}`;
  pdf.text(totalText, pageWidth - margin, yPos, { align: 'right' });

  const fileName = `Receipt_${document.getElementById('receiptNumber').value}.pdf`;
  pdf.save(fileName);
}

loadData();

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (transaction) => {
  const doc = new jsPDF();
  
  // --- Header Section ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Allora Spa & Massage Centre Dubai", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Allora Spa & Massage Centre Dubai, Concord Tower, 1913, Dubai, 00000, Dubai", 105, 26, { align: "center" });
  doc.text("+971 50 918 3157", 105, 32, { align: "center" });

  // --- Invoice Details ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const invoiceNum = transaction.invoiceNumber || transaction.bookingId || 'N/A';
  doc.text(`Invoice ${invoiceNum}`, 105, 45, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const dateStr = transaction.date ? new Date(transaction.date).toLocaleString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : new Date().toLocaleString();
  doc.text(dateStr, 105, 51, { align: "center" });

  // --- Client Details ---
  doc.setFontSize(10);
  doc.text("Client", 14, 65);
  doc.line(14, 67, 196, 67); // Horizontal line

  doc.setFont("helvetica", "bold");
  doc.text(transaction.clientName || "Guest", 14, 74);
  
  doc.setFont("helvetica", "normal");
  doc.text(transaction.clientPhone || "", 14, 80);

  // --- Items Table ---
  // Prepare data for the table
  // Assuming transaction has items or we construct it from service details
  const items = transaction.items || [
    {
      name: transaction.serviceName || "Service",
      description: transaction.description || "",
      price: transaction.amount || 0,
      discount: transaction.discount || 0
    }
  ];

  const tableBody = items.map((item, index) => {
    const originalPrice = parseFloat(item.price || 0);
    const discount = parseFloat(item.discount || 0);
    const finalPrice = originalPrice - discount;
    
    return [
      { content: index + 1, styles: { valign: 'top' } },
      { 
        content: `${item.name}\n${item.description || ''}${discount > 0 ? `\nDiscount: ${discount.toFixed(2)}` : ''}`,
        styles: { cellWidth: 120 } 
      },
      { 
        content: `AED ${finalPrice.toFixed(2)}${discount > 0 ? `\nAED ${originalPrice.toFixed(2)}` : ''}`, 
        styles: { halign: 'right', valign: 'top' } 
      }
    ];
  });

  autoTable(doc, {
    startY: 85,
    head: [], // No header as per image style, or we can add one if needed
    body: tableBody,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 40 }
    },
    didParseCell: (data) => {
        // Custom styling for strikethrough if needed, but simple text is easier for now
    }
  });

  // --- Totals Section ---
  let finalY = doc.lastAutoTable.finalY + 5;
  
  doc.line(14, finalY, 196, finalY);
  finalY += 8;

  const totalAmount = parseFloat(transaction.amount || 0);
  const discountAmount = parseFloat(transaction.discount || 0);
  const subtotal = totalAmount + discountAmount;

  // Helper for right aligned text
  const addRow = (label, value, isBold = false) => {
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.text(label, 14, finalY);
    doc.text(value, 196, finalY, { align: "right" });
    finalY += 6;
  };

  addRow("Items total (excl. discounts)", `AED ${subtotal.toFixed(2)}`);
  if (discountAmount > 0) {
    addRow(`Special discount`, `- AED ${discountAmount.toFixed(2)}`);
  }
  
  finalY += 2;
  addRow("Subtotal", `AED ${totalAmount.toFixed(2)}`);
  
  finalY += 4;
  doc.setFontSize(11);
  addRow("Total", `AED ${totalAmount.toFixed(2)}`, true);
  
  finalY += 4;
  doc.line(14, finalY - 8, 196, finalY - 8); // Line above Total
  doc.line(14, finalY, 196, finalY); // Line below Total
  
  finalY += 8;
  doc.setFontSize(10);
  const paymentMethod = transaction.paymentMethod || "Card";
  addRow(paymentMethod, `AED ${totalAmount.toFixed(2)}`);
  
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(dateStr, 105, finalY + 5, { align: "center" });
  
  finalY += 15;
  doc.setDrawColor(200);
  doc.line(14, finalY, 196, finalY);
  
  finalY += 8;
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("Balance", 14, finalY);
  doc.text("AED 0.00", 196, finalY, { align: "right" });

  doc.save(`Invoice_${invoiceNum}.pdf`);
};

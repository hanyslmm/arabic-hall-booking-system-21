const handlePrintBarcode = () => {
  const printWindow = window.open('', '_blank', 'width=400,height=200');
  if (!printWindow) {
    alert('Please allow pop-ups to print the barcode.');
    return;
  }

  const labelWidthMm = 50;   // Width in mm
  const labelHeightMm = 25;  // Height in mm

  const canvas = document.createElement('canvas');
  canvas.width = 600; 
  canvas.height = 300;

  const JsBarcode = window.JsBarcode;
  if (JsBarcode) {
    try {
      JsBarcode(canvas, student.serial_number, {
        format: 'CODE128',
        lineColor: "#000000",
        background: "#ffffff",
        width: 3,
        height: 160,       // Barcode height (leave room for text)
        displayValue: true, // Show serial number text
        fontSize: 40,      // Serial number font size
        fontOptions: "bold", // Make text bolder
        textMargin: 5,     // Space between barcode and text
        margin: 5
      });
    } catch (e) {
      console.error("JsBarcode error:", e);
      printWindow.close();
      alert("Failed to generate barcode. Invalid serial number?");
      return;
    }
  } else {
    alert("Barcode generation library not found.");
    return;
  }

  const barcodeDataURL = canvas.toDataURL('image/png');

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Barcode</title>
      <style>
        @page {
          size: ${labelWidthMm}mm ${labelHeightMm}mm landscape;
          margin: 0;
        }
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background: white;
          overflow: hidden;
        }
        .barcode-img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          transform: rotate(90deg); /* Horizontal orientation */
          transform-origin: center;
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <img src="${barcodeDataURL}" class="barcode-img" />
      <script>
        window.addEventListener('load', function() {
          setTimeout(function() {
            window.print();
            setTimeout(function() { window.close(); }, 200);
          }, 500);
        });
      <\/script>
    </body>
    </html>
  `;
  printWindow.document.write(printContent);
  printWindow.document.close();
};

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Printer, QrCode, Maximize2 } from 'lucide-react';
import { FullScreenQRModal } from './FullScreenQRModal';

// JsBarcode is expected to be loaded via a <script> tag in your main HTML file
declare global {
  interface Window {
    JsBarcode: any;
  }
}

interface Student {
  id: string;
  name: string;
  serial_number: string;
  mobile_phone: string;
  parent_phone?: string;
}

interface StudentQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const StudentQRCodeModal = ({ isOpen, onClose, student }: StudentQRCodeModalProps) => {
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  
  if (!student) return null;

  const qrValue = student.serial_number;

  const handleDownloadQR = () => {
    const svg = document.getElementById('student-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 400;
    canvas.height = 400;

    img.onload = () => {
      if (ctx) {
        ctx.drawImage(img, 0, 0, 400, 400);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `student-qr-${student.serial_number}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handlePrintBarcode = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=300');
    if (!printWindow) {
      alert('Please allow pop-ups to print the barcode.');
      return;
    }

    // Label dimensions: 50mm x 25mm (landscape)
    const labelWidthMm = 50;
    const labelHeightMm = 25;

    // Create canvas for barcode with proper dimensions
    // For landscape orientation: width=50mm, height=25mm
    // Use higher DPI for better quality: 1mm ≈ 7.56 pixels (200 DPI)
    const canvasWidth = Math.round(labelWidthMm * 7.56);  // 50mm = ~378px
    const canvasHeight = Math.round(labelHeightMm * 7.56); // 25mm = ~189px
    
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const JsBarcode = window.JsBarcode;
    if (!JsBarcode) {
      console.error("JsBarcode library not found.");
      printWindow.close();
      alert("Barcode generation library is not available. Please make sure JsBarcode is loaded.");
      return;
    }

    try {
      JsBarcode(canvas, student.serial_number, {
        format: 'CODE128',
        lineColor: '#000000',
        background: '#ffffff',
        width: 3,
        height: Math.round(canvasHeight * 0.75), // 75% of label height for barcode
        displayValue: true,
        fontSize: Math.round(canvasHeight * 0.08), // 8% of label height for text
        textMargin: 2,
        margin: 5
      });
    } catch (e) {
      console.error("JsBarcode error:", e);
      printWindow.close();
      alert("Failed to generate barcode. The serial number might contain invalid characters.");
      return;
    }

    // Verify canvas has content
    const ctx = canvas.getContext('2d');
    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
    if (!imageData || imageData.data.every(pixel => pixel === 0)) {
      console.error("Canvas is empty - barcode generation failed");
      printWindow.close();
      alert("Barcode generation failed. Please try again.");
      return;
    }

    const barcodeDataURL = canvas.toDataURL('image/png');
    
    // Verify the data URL is valid
    if (!barcodeDataURL || barcodeDataURL === 'data:,') {
      console.error("Invalid barcode data URL");
      printWindow.close();
      alert("Barcode generation failed. Please try again.");
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Barcode Label</title>
        <style>
          @page {
            size: ${labelWidthMm}mm ${labelHeightMm}mm landscape;
            margin: 0;
          }
          
          html, body {
            width: ${labelWidthMm}mm;
            height: ${labelHeightMm}mm;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            overflow: hidden;
            box-sizing: border-box;
            transform: rotate(0deg);
            font-family: Arial, sans-serif;
          }
          
          .barcode-container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 1mm;
            transform: rotate(0deg);
          }
          
          .barcode-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            transform: rotate(0deg);
          }
          
          .fallback-text {
            font-size: 8pt;
            font-weight: bold;
            text-align: center;
            color: black;
            line-height: 1.2;
          }
          
          @media print {
            @page {
              size: ${labelWidthMm}mm ${labelHeightMm}mm landscape;
              margin: 0;
            }
            
            html, body {
              width: ${labelWidthMm}mm !important;
              height: ${labelHeightMm}mm !important;
              margin: 0 !important;
              padding: 0 !important;
              transform: rotate(0deg) !important;
            }
            
            .barcode-container {
              width: 100% !important;
              height: 100% !important;
              padding: 1mm !important;
              transform: rotate(0deg) !important;
            }
            
            .barcode-img {
              width: 100% !important;
              height: 100% !important;
              transform: rotate(0deg) !important;
            }
            
            .fallback-text {
              font-size: 8pt !important;
              color: black !important;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="barcode-container">
          <img src="${barcodeDataURL}" class="barcode-img" alt="Barcode" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
          <div class="fallback-text" style="display: none;">
            ${student.serial_number}
          </div>
        </div>
        <script>
          window.addEventListener('load', function() {
            console.log('Print window loaded');
            
            // Wait for image to load
            const img = document.querySelector('.barcode-img');
            if (img) {
              img.onload = function() {
                console.log('Barcode image loaded successfully');
                setTimeout(function() {
                  console.log('Starting print...');
                  window.print();
                  setTimeout(function() { 
                    console.log('Closing window...');
                    window.close(); 
                  }, 400);
                }, 300);
              };
              
              img.onerror = function() {
                console.error('Failed to load barcode image');
                alert('Failed to load barcode image. Please try again.');
                window.close();
              };
              
              // If image is already loaded
              if (img.complete) {
                console.log('Image already loaded');
                setTimeout(function() {
                  console.log('Starting print...');
                  window.print();
                  setTimeout(function() { 
                    console.log('Closing window...');
                    window.close(); 
                  }, 400);
                }, 300);
              }
            } else {
              console.error('Barcode image element not found');
              alert('Barcode image not found. Please try again.');
              window.close();
            }
          });
        <\/script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            كود QR للطالب
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">{student.name}</h3>
                <p className="text-sm text-muted-foreground">
                  رقم التسلسل: {student.serial_number}
                </p>
                <p className="text-sm text-muted-foreground">
                  الجوال: {student.mobile_phone}
                </p>
                {student.parent_phone && (
                  <p className="text-sm text-muted-foreground">
                    جوال الولي: {student.parent_phone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <div className="flex justify-center">
            <div 
              className="p-4 bg-white border rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setIsFullScreenOpen(true)}
              title="انقر للعرض بحجم كامل"
            >
              <QRCodeSVG
                id="student-qr-code"
                value={qrValue}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Full Screen Button */}
          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsFullScreenOpen(true)}
              className="text-muted-foreground hover:text-primary"
            >
              <Maximize2 className="w-4 h-4 ml-2" />
              عرض بحجم كامل
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleDownloadQR} className="flex-1" variant="outline">
              <Download className="w-4 h-4 ml-2" />
              تحميل QR Code
            </Button>
            <Button onClick={handlePrintBarcode} className="flex-1">
              <Printer className="w-4 h-4 ml-2" />
              طباعة باركود الرقم التسلسلي
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            يمكن استخدام هذا الرمز لمسح بيانات الطالب سريعاً في النظام
          </div>
        </div>

        {/* Full Screen QR Modal */}
        <FullScreenQRModal
          isOpen={isFullScreenOpen}
          onClose={() => setIsFullScreenOpen(false)}
          student={student}
        />
      </DialogContent>
    </Dialog>
  );
};

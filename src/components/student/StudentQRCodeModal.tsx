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
    const printWindow = window.open('', '_blank', 'width=400,height=200');
    if (!printWindow) {
      alert('Please allow pop-ups to print the barcode.');
      return;
    }

    // Label dimensions: 50mm x 25mm 
    const labelWidthMm = 50;
    const labelHeightMm = 25;

    // Create canvas for barcode - optimized for thermal printers
    // Using 8 pixels per mm for crisp printing (203 DPI)
    const canvasWidth = labelWidthMm * 8;  // 50mm = 400px
    const canvasHeight = labelHeightMm * 8; // 25mm = 200px
    
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
        width: 2,
        height: 120, // Fixed height for better readability
        displayValue: true,
        fontSize: 14,
        textMargin: 8,
        margin: 10
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
            size: ${labelWidthMm}mm ${labelHeightMm}mm;
            margin: 0;
          }
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          html, body {
            width: ${labelWidthMm}mm;
            height: ${labelHeightMm}mm;
            background: white;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .label {
            width: ${labelWidthMm}mm;
            height: ${labelHeightMm}mm;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2mm;
            background: white;
          }
          
          .barcode-img {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
          }
          
          @media print {
            @page {
              size: ${labelWidthMm}mm ${labelHeightMm}mm;
              margin: 0;
            }
            
            html, body {
              width: ${labelWidthMm}mm !important;
              height: ${labelHeightMm}mm !important;
            }
            
            .label {
              width: ${labelWidthMm}mm !important;
              height: ${labelHeightMm}mm !important;
              padding: 2mm !important;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <img src="${barcodeDataURL}" class="barcode-img" alt="Barcode for ${student.serial_number}" />
        </div>
        <script>
          window.addEventListener('load', function() {
            const img = document.querySelector('.barcode-img');
            if (img) {
              const printLabel = () => {
                setTimeout(() => {
                  window.print();
                  setTimeout(() => window.close(), 500);
                }, 100);
              };
              
              if (img.complete) {
                printLabel();
              } else {
                img.onload = printLabel;
                img.onerror = () => {
                  alert('Failed to load barcode. Please try again.');
                  window.close();
                };
              }
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

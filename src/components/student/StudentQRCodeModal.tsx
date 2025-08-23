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
    const printWindow = window.open('', '_blank', 'width=200,height=100');
    if (!printWindow) {
      alert('Please allow pop-ups to print the barcode.');
      return;
    }

    // Label dimensions in millimeters (50mm wide x 25mm tall -> landscape)
    const labelWidthMm = 50;
    const labelHeightMm = 25;

    // Create a canvas for the barcode image.
    // **FIX**: The canvas aspect ratio MUST match the label aspect ratio.
    // Label aspect ratio = 50 / 25 = 2.
    // We'll use 600x300 pixels to maintain this 2:1 ratio for good quality.
    const canvas = document.createElement('canvas');
    canvas.width = 600; // Matches the aspect ratio (600/300 = 2)
    canvas.height = 300;

    const JsBarcode = window.JsBarcode;
    if (JsBarcode) {
      try {
        JsBarcode(canvas, student.serial_number, {
          format: 'CODE128',
          lineColor: '#000000',
          background: '#ffffff',
          width: 3,           // Bar width. Adjust as needed for scanner readability.
          height: 250,        // Bar height, leaving some margin within the 300px canvas height.
          displayValue: false, // Do not show the number below the barcode.
          margin: 10          // Small margin around the barcode inside the canvas.
        });
      } catch (e) {
        console.error("JsBarcode error:", e);
        printWindow.close();
        alert("Failed to generate barcode. The serial number might contain invalid characters.");
        return;
      }
    } else {
        console.error("JsBarcode library not found.");
        printWindow.close();
        alert("Barcode generation library is not available.");
        return;
    }

    const barcodeDataURL = canvas.toDataURL('image/png');

    // Create the HTML content for the new window.
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Barcode</title>
        <style>
          /* This CSS is critical for correct label printing */
          @page {
            /* Set the page size to match the physical label */
            size: ${labelWidthMm}mm ${labelHeightMm}mm;
            margin: 0;
          }
          
          html, body {
            /* Ensure the body fills the entire page without extra space */
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: white;
            overflow: hidden; /* Hide any potential scrollbars */
          }
          
          .barcode-img {
            /* **FIX**: This forces the image to stretch to the exact dimensions of the body,
              which is sized to the label. This resolves the orientation issue.
              Using 'fill' instead of 'cover' prevents incorrect scaling.
            */
            width: 100%;
            height: 100%;
            display: block;
            object-fit: fill; 
          }
          
          @media print {
            /* Ensures colors and background are printed correctly */
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
          // Automatically trigger print and then close the window
          window.addEventListener('load', function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { 
                window.close(); 
              }, 100);
            }, 500); // Increased timeout slightly for stability
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
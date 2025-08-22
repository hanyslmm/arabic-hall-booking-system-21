import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Printer, QrCode, Maximize2 } from 'lucide-react';
import { FullScreenQRModal } from './FullScreenQRModal';

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
      ctx?.drawImage(img, 0, 0, 400, 400);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `student-qr-${student.serial_number}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handlePrintBarcode = () => {
    // Create a new window for printing the barcode label (approx sized for 50mm x 25mm)
    const printWindow = window.open('', '_blank', 'width=240,height=140');
    if (!printWindow) return;

    // Utility to convert millimeters to pixels at 300 DPI for crisp print
    const mmToPx = (mm: number) => Math.round((mm / 25.4) * 300);

    // Target label size
    const labelWidthMm = 50;
    const labelHeightMm = 25;

    // Inner padding
    const paddingMm = 1; // 1mm padding

    // Render barcode to a high-res canvas
    const canvas = document.createElement('canvas');
    const JsBarcode = (window as any).JsBarcode;

    // Compute canvas size for print quality
    const canvasWidth = mmToPx(labelWidthMm - paddingMm * 2);
    const canvasHeight = mmToPx(labelHeightMm - paddingMm * 2);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    if (JsBarcode) {
      JsBarcode(canvas, student.serial_number, {
        format: 'CODE128',
        lineColor: '#000',
        background: '#fff',
        width: Math.max(1, Math.floor(canvasWidth / 220)), // dynamic bar width
        height: Math.floor(canvasHeight * 0.65), // occupy ~65% for bars
        displayValue: true,
        font: 'monospace',
        fontOptions: 'bold',
        fontSize: Math.floor(canvasHeight * 0.20), // ~20% for text
        margin: 0,
        textMargin: Math.floor(canvasHeight * 0.05)
      });
    }

    const barcodeDataURL = canvas.toDataURL('image/png');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title></title>
        <style>
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          html, body { margin: 0; padding: 0; background: #fff; }
          body { width: 50mm; height: 25mm; }
          .label {
            width: 50mm;
            height: 25mm;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .barcode {
            width: ${labelWidthMm - paddingMm * 2}mm;
            height: auto;
            display: block;
            margin: 0;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
          @media print {
            @page { size: 50mm 25mm; margin: 0; }
            html, body { margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <img src="${barcodeDataURL}" alt="Barcode" class="barcode" />
        </div>
        <script>
          // Auto-print then close
          setTimeout(function(){ window.print(); setTimeout(function(){ window.close(); }, 200); }, 100);
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
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
    // Create a new window for printing the barcode label
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;

    // Generate barcode using JsBarcode
    const canvas = document.createElement('canvas');
    const JsBarcode = (window as any).JsBarcode;
    
    if (JsBarcode) {
      JsBarcode(canvas, student.serial_number, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 10,
        margin: 0
      });
    }

    const barcodeDataURL = canvas.toDataURL();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title></title>
        <style>
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          html, body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .label {
            width: 50mm;
            height: 25mm;
            border: none;
            padding: 0;
            margin: 0;
            background: white;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
          }
          .barcode {
            width: 48mm;
            height: auto;
            margin: 0;
            display: block;
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
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
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
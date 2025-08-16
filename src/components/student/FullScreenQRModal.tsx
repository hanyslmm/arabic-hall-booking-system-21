import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, Printer, Maximize2 } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  serial_number: string;
  mobile_phone: string;
  parent_phone?: string;
}

interface FullScreenQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const FullScreenQRModal = ({ isOpen, onClose, student }: FullScreenQRModalProps) => {
  if (!student) return null;

  const qrValue = `STUDENT:${student.serial_number}:${student.id}`;

  const handleDownloadQR = () => {
    const svg = document.getElementById('fullscreen-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 800;
    canvas.height = 800;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 800, 800);
        ctx.drawImage(img, 0, 0, 800, 800);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `student-qr-${student.serial_number}-fullsize.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handlePrintSerialLabel = () => {
    // Create a new window for printing just the serial number label for Xprinter
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ملصق الرقم التسلسلي - ${student.serial_number}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 0;
            background: white;
            direction: rtl;
          }
          .label {
            width: 40mm;
            height: 20mm;
            border: 1px solid #000;
            padding: 2mm;
            margin: 0;
            background: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
          }
          .serial-number {
            font-size: 16pt;
            font-weight: bold;
            margin: 1mm 0;
            letter-spacing: 1px;
          }
          .student-name {
            font-size: 8pt;
            margin: 1mm 0;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .label { margin: 0; border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="serial-number">${student.serial_number}</div>
          <div class="student-name">${student.name}</div>
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
      <DialogContent className="max-w-screen min-h-screen p-0 bg-black/95">
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Student Info */}
          <div className="absolute top-4 left-4 z-10 text-white">
            <h2 className="text-xl font-bold">{student.name}</h2>
            <p className="text-sm opacity-80">رقم تسلسلي: {student.serial_number}</p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center space-y-6">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <QRCodeSVG
                id="fullscreen-qr-code"
                value={qrValue}
                size={400}
                level="H"
                includeMargin={true}
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button onClick={handleDownloadQR} variant="secondary" size="lg">
                <Download className="w-5 h-5 ml-2" />
                تحميل QR كبير
              </Button>
              <Button onClick={handlePrintSerialLabel} variant="secondary" size="lg">
                <Printer className="w-5 h-5 ml-2" />
                طباعة ملصق الرقم
              </Button>
            </div>

            {/* Instructions */}
            <div className="text-center text-white/80 max-w-md">
              <p className="text-sm">
                يمكن للطالب تصوير هذا الرمز بكاميرا الهاتف أو يمكنك تحميله وإرساله له
              </p>
              <p className="text-xs mt-2 opacity-60">
                ملصق الرقم التسلسلي يمكن طباعته على Xprinter للتسجيل السريع
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
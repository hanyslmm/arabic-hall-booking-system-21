import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Printer, QrCode, Maximize2, Eye } from 'lucide-react';
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
    canvas.height = 200;

    img.onload = () => {
      if (ctx) {
        ctx.drawImage(img, 0, 0, 400, 200);
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
    // Check if JsBarcode is available
    const JsBarcode = window.JsBarcode;
    if (!JsBarcode) {
      alert("Barcode generation library is not available. Please refresh the page and try again.");
      return;
    }

    // Create a simple canvas for barcode generation
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;

    try {
      // Generate barcode with simple, reliable settings
      JsBarcode(canvas, student.serial_number, {
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 16,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000'
      });
    } catch (e) {
      console.error("JsBarcode error:", e);
      alert("Failed to generate barcode for: " + student.serial_number);
      return;
    }

    // Convert to image
    const imageData = canvas.toDataURL('image/png');
    
    // Create print window with simple HTML
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) {
      alert('Please allow pop-ups to print the barcode.');
      return;
    }

    const printHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Barcode Label - ${student.serial_number}</title>
    <style>
        @page { 
            size: 50mm 25mm; 
            margin: 0; 
        }
        body { 
            margin: 0; 
            padding: 0; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 25mm; 
            width: 50mm;
            background: white;
        }
        img { 
            max-width: 48mm; 
            max-height: 23mm; 
            width: auto; 
            height: auto; 
        }
        @media screen {
            body { 
                background: #f0f0f0; 
                padding: 5mm; 
            }
            img {
                border: 1px solid #ccc;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
        }
    </style>
</head>
<body>
    <img src="${imageData}" alt="Barcode: ${student.serial_number}" />
    <script>
        window.onload = function() {
            // Auto-print after a short delay
            setTimeout(function() {
                window.print();
                // Close window after printing
                setTimeout(function() {
                    window.close();
                }, 1000);
            }, 500);
        };
        
        // Handle print events
        window.onafterprint = function() {
            window.close();
        };
    </script>
</body>
</html>`;

    printWindow.document.write(printHTML);
    printWindow.document.close();
  };

  const handlePreviewBarcode = () => {
    // Check if JsBarcode is available
    const JsBarcode = window.JsBarcode;
    if (!JsBarcode) {
      alert("Barcode generation library is not available. Please refresh the page and try again.");
      return;
    }

    // Create a simple canvas for barcode generation
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;

    try {
      // Generate barcode with simple, reliable settings
      JsBarcode(canvas, student.serial_number, {
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 16,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000'
      });
    } catch (e) {
      console.error("JsBarcode error:", e);
      alert("Failed to generate barcode for: " + student.serial_number);
      return;
    }

    // Convert to image
    const imageData = canvas.toDataURL('image/png');
    
    // Create preview window (no auto-print)
    const previewWindow = window.open('', '_blank', 'width=400,height=300');
    if (!previewWindow) {
      alert('Please allow pop-ups to preview the barcode.');
      return;
    }

    const previewHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Barcode Preview - ${student.serial_number}</title>
    <style>
        @page { 
            size: 50mm 25mm; 
            margin: 0; 
        }
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: Arial, sans-serif;
            background: #f0f0f0;
        }
        .preview-container {
            background: white;
            border: 2px solid #333;
            width: 50mm;
            height: 25mm;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 20px auto;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .preview-container img { 
            max-width: 48mm; 
            max-height: 23mm; 
            width: auto; 
            height: auto; 
        }
        .info {
            text-align: center;
            margin: 20px;
        }
        .print-button {
            display: block;
            margin: 20px auto;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        .print-button:hover {
            background: #0056b3;
        }
        @media print {
            body { 
                margin: 0; 
                padding: 0; 
                background: white;
            }
            .preview-container {
                border: none;
                box-shadow: none;
                margin: 0;
                width: 50mm;
                height: 25mm;
            }
            .info, .print-button {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="info">
        <h3>Barcode Label Preview</h3>
        <p>Student: ${student.name}</p>
        <p>Serial: ${student.serial_number}</p>
        <p>Size: 50mm × 25mm</p>
    </div>
    <div class="preview-container">
        <img src="${imageData}" alt="Barcode: ${student.serial_number}" />
    </div>
    <button class="print-button" onclick="window.print()">Print This Label</button>
    <div class="info">
        <p><small>This preview shows how the label will look when printed.</small></p>
    </div>
</body>
</html>`;

    previewWindow.document.write(previewHTML);
    previewWindow.document.close();
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
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button onClick={handleDownloadQR} className="flex-1" variant="outline">
                <Download className="w-4 h-4 ml-2" />
                تحميل QR Code
              </Button>
              <Button onClick={handlePreviewBarcode} className="flex-1" variant="outline">
                <Eye className="w-4 h-4 ml-2" />
                معاينة الملصق
              </Button>
            </div>
            <Button onClick={handlePrintBarcode} className="w-full">
              <Printer className="w-4 h-4 ml-2" />
              طباعة ملصق باركود
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
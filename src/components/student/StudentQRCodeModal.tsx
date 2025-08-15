import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Printer, QrCode } from 'lucide-react';

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
  if (!student) return null;

  const qrValue = `STUDENT:${student.serial_number}:${student.id}`;

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

  const handlePrintCard = () => {
    // Create a new window for printing the student ID card
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>بطاقة الطالب - ${student.name}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            direction: rtl;
          }
          .card {
            width: 85.6mm;
            height: 53.98mm;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
            margin: 0 auto;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
          }
          .card::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.1), transparent);
            transform: rotate(45deg);
          }
          .header {
            text-align: center;
            margin-bottom: 12px;
            position: relative;
            z-index: 1;
          }
          .title {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            margin: 0;
          }
          .subtitle {
            font-size: 12px;
            color: #64748b;
            margin: 2px 0 0 0;
          }
          .content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 1;
          }
          .student-info {
            flex: 1;
          }
          .student-name {
            font-size: 14px;
            font-weight: bold;
            color: #1f2937;
            margin: 0 0 4px 0;
          }
          .student-serial {
            font-size: 12px;
            color: #6b7280;
            margin: 0 0 2px 0;
          }
          .student-phone {
            font-size: 11px;
            color: #6b7280;
            margin: 0;
            font-family: monospace;
          }
          .qr-section {
            text-align: center;
          }
          .qr-code {
            width: 60px;
            height: 60px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            background: white;
            padding: 4px;
          }
          .qr-label {
            font-size: 8px;
            color: #9ca3af;
            margin-top: 2px;
          }
          .footer {
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 8px;
            color: #d1d5db;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .card { margin: 0; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 class="title">بطاقة طالب</h1>
            <p class="subtitle">نظام إدارة المراكز التعليمية</p>
          </div>
          <div class="content">
            <div class="student-info">
              <h2 class="student-name">${student.name}</h2>
              <p class="student-serial">رقم التسلسل: ${student.serial_number}</p>
              <p class="student-phone">الجوال: ${student.mobile_phone}</p>
              ${student.parent_phone ? `<p class="student-phone">جوال الولي: ${student.parent_phone}</p>` : ''}
            </div>
            <div class="qr-section">
              <div class="qr-code">
                ${document.getElementById('student-qr-code')?.outerHTML || ''}
              </div>
              <p class="qr-label">كود الطالب</p>
            </div>
          </div>
          <div class="footer">
            تاريخ الإصدار: ${new Date().toLocaleDateString('ar')}
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
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
            <div className="p-4 bg-white border rounded-lg">
              <QRCodeSVG
                id="student-qr-code"
                value={qrValue}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleDownloadQR} className="flex-1" variant="outline">
              <Download className="w-4 h-4 ml-2" />
              تحميل QR Code
            </Button>
            <Button onClick={handlePrintCard} className="flex-1">
              <Printer className="w-4 h-4 ml-2" />
              طباعة بطاقة الطالب
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            يمكن استخدام هذا الرمز لمسح بيانات الطالب سريعاً في النظام
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
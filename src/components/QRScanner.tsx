import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (data: string) => void;
}

function QRScanner({ onScan }: QRScannerProps) {
  const [scanned, setScanned] = useState(false);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    setScanner(html5QrCode);

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
      html5QrCode.clear().catch(console.error);
    };
  }, []);

  useEffect(() => {
    if (!scanner) return;

    const startScanning = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            onScan(decodedText);
            // Temporarily disable scanning for 2 seconds after a successful scan
            setScanned(true);
            scanner.pause(true);
            setTimeout(() => {
              setScanned(false);
              scanner.pause(false);
            }, 2000);
          },
          (error) => {
            if (error?.name !== 'NotFoundException') {
              console.error(error);
            }
          }
        );
      } catch (error) {
        console.error('Failed to start scanner:', error);
      }
    };

    startScanning();

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(console.error);
      }
    };
  }, [scanner, onScan]);

  return (
    <div className="mt-4">
      <div id="reader" className="w-full h-[300px] max-w-sm mx-auto border rounded-lg overflow-hidden"></div>
      {scanned && (
        <div className="mt-2 text-center text-sm text-gray-600">
          Scanner paused for 2 seconds...
        </div>
      )}
    </div>
  );
}

export default QRScanner;
import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import Papa from 'papaparse';

interface ImportEmployeesProps {
  onImport: (employees: { name: string; email: string }[]) => void;
}

export default function ImportEmployees({ onImport }: ImportEmployeesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const employees = results.data
            .filter((row: any) => row.name && row.email)
            .map((row: any) => ({
              name: row.name,
              email: row.email,
            }));
          onImport(employees);
        },
      });
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
      >
        <Upload className="w-5 h-5" />
        Import CSV
      </button>
    </div>
  );
}
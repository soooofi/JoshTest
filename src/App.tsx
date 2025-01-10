import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { UserPlus, QrCode, ScanLine, LogOut, Download } from 'lucide-react';
import EmployeeForm from './components/EmployeeForm';
import QRScanner from './components/QRScanner';
import ImportEmployees from './components/ImportEmployees';
import Auth from './components/Auth';
import { Employee } from './types';
import { supabase } from './lib/supabase';

function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [session, setSession] = useState(null);
  const [importedEmployees, setImportedEmployees] = useState<{ name: string; email: string }[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadEmployees();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadEmployees();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading employees:', error);
    } else {
      setEmployees(data.map(emp => ({
        ...emp,
        remainingScans: emp.remaining_scans
      })) || []);
    }
  };

  const handleAddEmployee = async (employee: Omit<Employee, 'id'>) => {
    const newEmployee = {
      name: employee.name,
      email: employee.email,
      count: employee.count,
      remaining_scans: employee.remainingScans,
      user_id: session.user.id
    };

    const { data, error } = await supabase
      .from('employees')
      .insert([newEmployee])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding employee:', error);
      alert('Failed to add employee. Please try again.');
    } else {
      const formattedEmployee = {
        ...data,
        remainingScans: data.remaining_scans
      };
      setEmployees([formattedEmployee, ...employees]);
    }
  };

  const handleScan = async (id: string) => {
    // First validate if the scanned QR code is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      alert('Invalid QR code format');
      return;
    }

    const employee = employees.find(emp => emp.id === id);
    if (!employee) {
      alert('Invalid QR code - Employee not found');
      return;
    }

    if (employee.remainingScans === 0) {
      alert('You have reached your scan limit for this QR code');
      return;
    }

    const { error } = await supabase
      .from('employees')
      .update({ remaining_scans: employee.remainingScans - 1 })
      .eq('id', id);
    
    if (!error) {
      setEmployees(prevEmployees =>
        prevEmployees.map(emp =>
          emp.id === id ? { ...emp, remainingScans: emp.remainingScans - 1 } : emp
        )
      );
      alert(`Scan successful! ${employee.remainingScans - 1} scans remaining`);
    } else {
      alert('Error updating scan count. Please try again.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmployees([]);
  };

  const handleExport = () => {
    const csvContent = employees.map(emp => ({
      name: emp.name,
      email: emp.email,
      remainingScans: emp.remainingScans,
      totalScans: emp.count
    }));

    const csv = Papa.unparse(csvContent);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = (employees: { name: string; email: string }[]) => {
    setImportedEmployees(employees);
  };

  const handleCreateQRCodes = async () => {
    if (importedEmployees.length === 0) return;

    const newEmployees = importedEmployees.map(emp => ({
      name: emp.name,
      email: emp.email,
      user_id: session.user.id,
      count: 2,
      remaining_scans: 2
    }));

    const { data, error } = await supabase
      .from('employees')
      .insert(newEmployees)
      .select();

    if (error) {
      console.error('Error adding employees:', error);
      alert('Failed to import employees. Please try again.');
    } else {
      const formattedEmployees = data.map(emp => ({
        ...emp,
        remainingScans: emp.remaining_scans
      }));
      setEmployees([...formattedEmployees, ...employees]);
      setImportedEmployees([]);
    }
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Event Manager</h1>
          <div className="flex gap-4">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Add Employee</h2>
            </div>
            <EmployeeForm onSubmit={handleAddEmployee} />
            <div className="mt-4">
              <ImportEmployees onImport={handleImport} />
              {importedEmployees.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {importedEmployees.length} employees ready to import
                  </p>
                  <button
                    onClick={handleCreateQRCodes}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                  >
                    Create QR Codes
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">QR Scanner</h2>
            </div>
            <button
              onClick={() => setShowScanner(!showScanner)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <ScanLine className="w-5 h-5" />
              {showScanner ? 'Hide Scanner' : 'Show Scanner'}
            </button>
            {showScanner && <QRScanner onScan={handleScan} />}
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Employee QR Codes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <div key={employee.id} className="border p-4 rounded-lg">
                <p className="font-semibold">{employee.name}</p>
                <p className="text-sm text-gray-600">{employee.email}</p>
                <p className="text-sm text-gray-600 mb-2">
                  Remaining Scans: {employee.remainingScans}/{employee.count}
                </p>
                <QRCodeSVG value={employee.id} size={128} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
import React, { useState } from 'react';

const SERVER_URL = "http://38.244.150.204:4000";

const InvoiceGeneratorForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    room: '',
    water_start: '',
    water_end: '',
    water_consumption: '',
    water_total: '',
    electricity_start: '',
    electricity_end: '',
    electricity_consumption: '',
    electricity_total: '',
    amount_total: '',
    amount_before_vat: '',
    vat: '',
    amount_total_net: '',
    invoice_number: '',
    date_from: '',
    date_to: '',
    date_of_creating: '',
    total_in_thai: '',
    total_in_english: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');

  // Автоматический расчет некоторых полей
  const calculateFields = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    
    // Расчет расхода воды
    if (field === 'water_start' || field === 'water_end') {
      const start = parseFloat(updatedData.water_start) || 0;
      const end = parseFloat(updatedData.water_end) || 0;
      if (end >= start) {
        updatedData.water_consumption = (end - start).toFixed(2);
        updatedData.water_total = ((end - start) * 89).toFixed(2);
      } else {
        updatedData.water_consumption = '0.00';
        updatedData.water_total = '0.00';
      }
    }
  
    // Расчет расхода электричества
    if (field === 'electricity_start' || field === 'electricity_end') {
      const start = parseFloat(updatedData.electricity_start) || 0;
      const end = parseFloat(updatedData.electricity_end) || 0;
      if (end >= start) {
        updatedData.electricity_consumption = (end - start).toFixed(2);
        updatedData.electricity_total = ((end - start) * 8).toFixed(2);
      } else {
        updatedData.electricity_consumption = '0.00';
        updatedData.electricity_total = '0.00';
      }
    }
  
    // Расчет итоговых сумм
    const waterTotal = parseFloat(updatedData.water_total) || 0;
    const electricityTotal = parseFloat(updatedData.electricity_total) || 0;
    const totalAmount = waterTotal + electricityTotal;
    
    updatedData.amount_total = totalAmount.toFixed(2);
    updatedData.amount_before_vat = totalAmount.toFixed(2);
    
    // Расчет VAT (7%)
    const vatAmount = totalAmount * 0.07;
    updatedData.vat = vatAmount.toFixed(2);
    
    // Итоговая сумма - ПРАВИЛЬНЫЙ РАСЧЕТ
    const amountBeforeVatNum = parseFloat(updatedData.amount_before_vat) || 0;
    const vatNum = parseFloat(updatedData.vat) || 0;
    updatedData.amount_total_net = (amountBeforeVatNum + vatNum).toFixed(2);
  
    return updatedData;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedData = calculateFields(name, value);
    setFormData(updatedData);
  };

  const handleGeneratePDF = async () => {
    console.log(formData)
    setIsGenerating(true);
    setMessage('');

    try {
      const response = await fetch(`${SERVER_URL}/generate-single-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
      }

      // Получаем blob из ответа
      const blob = await response.blob();
      
      // Создаем URL для скачивания файла
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Получаем имя файла из заголовков или генерируем
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'invoice.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      } else {
        filename = `${formData.room}_${formData.name.replace(/\s+/g, '_')}_${formData.invoice_number || 'invoice'}.pdf`;
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage('✅ PDF успешно сгенерирован и загружен!');
    } catch (error) {
      console.error('Ошибка генерации PDF:', error);
      setMessage(`❌ Ошибка: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearForm = () => {
    setFormData({
      name: '',
      room: '',
      water_start: '',
      water_end: '',
      water_consumption: '',
      water_total: '',
      electricity_start: '',
      electricity_end: '',
      electricity_consumption: '',
      electricity_total: '',
      amount_total: '',
      amount_before_vat: '',
      vat: '',
      amount_total_net: '',
      invoice_number: '',
      date_from: '',
      date_to: '',
      date_of_creating: '',
      total_in_thai: '',
      total_in_english: ''
    });
    setMessage('');
  };

  return (
    <div className="sp-4 w-3/5 p-5">
      <div className="form-header">
        <div className="form-actions">

        </div>
      </div>

        {/* common block */}
        <div className='flex flex-col gap-4 w-auto'> 
          {/* main info block */}
          <div className='flex gap-4 bg-gray-100 p-4 rounded-lg'>
            <p>👤</p>
            {/* inputs block */}
            <div className='flex gap-4 flex-wrap'>
              <div className="flex flex-col">
                <label className="mb-1 font-medium text-gray-700">Owner name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Room number</label>
    <input
      type="text"
      name="room"
      value={formData.room}
      onChange={handleInputChange}
      placeholder="101"
      required
      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
              </div>
              <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Invoice number</label>
    <input
      type="text"
      name="invoice_number"
      value={formData.invoice_number}
      onChange={handleInputChange}
      placeholder="PS202601-001"
      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
              </div>
              <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Date created</label>
    <input
      type="text"
      name="date_of_creating"
      value={formData.date_of_creating}
      onChange={handleInputChange}
      placeholder="DD/MM/YYYY"
      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
              </div>
              <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Period from</label>
    <input
      type="text"
      name="date_from"
      value={formData.date_from}
      onChange={handleInputChange}
      placeholder="DD/MM/YYYY"
      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
              </div>
              <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Period to</label>
    <input
      type="text"
      name="date_to"
      value={formData.date_to}
      onChange={handleInputChange}
      placeholder="DD/MM/YYYY"
      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
              </div>
            </div>
          </div>
          {/* water info block */}
          <div className='flex gap-4 bg-gray-100 p-4 rounded-lg'>
            <p>💧</p>
            {/* inputs block */}
            <div className='flex gap-4 flex-wrap'>
            <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Water start</label>
    <input
      type="number"
      step="0.01"
      name="water_start"
      value={formData.water_start}
      onChange={handleInputChange}
      placeholder="100"
      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Water end</label>
    <input
      type="number"
      step="0.01"
      name="water_end"
      value={formData.water_end}
      onChange={handleInputChange}
      placeholder="150"
      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Water consumption</label>
    <input
      type="number"
      step="0.01"
      name="water_consumption"
      value={formData.water_consumption}
      onChange={handleInputChange}
      placeholder="50"
      readOnly
      className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
    />
    <span className="text-xs text-gray-500 mt-1">Auto calculated</span>
  </div>

  <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Water total</label>
    <input
      type="number"
      step="0.01"
      name="water_total"
      value={formData.water_total}
      onChange={handleInputChange}
      placeholder="4450"
      readOnly
      className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
    />
    <span className="text-xs text-gray-500 mt-1">Price: 89 THB/unit</span>
  </div>
              
              
              
              
            </div>
          </div>
          {/* electricity info block */}
          <div className='flex gap-4 bg-gray-100 p-4 rounded-lg'>
            <p>⚡️</p>
            {/* inputs block */}
            <div className='flex gap-4 flex-wrap'>
            <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Electricity start</label>
    <input
      type="number"
      step="0.01"
      name="electricity_start"
      value={formData.electricity_start}
      onChange={handleInputChange}
      placeholder="1000"
      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Electricity end</label>
    <input
      type="number"
      step="0.01"
      name="electricity_end"
      value={formData.electricity_end}
      onChange={handleInputChange}
      placeholder="1200"
      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Electricity consumption</label>
    <input
      type="number"
      step="0.01"
      name="electricity_consumption"
      value={formData.electricity_consumption}
      onChange={handleInputChange}
      placeholder="200"
      readOnly
      className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
    />
    <span className="text-xs text-gray-500 mt-1">Auto calculated</span>
  </div>

  <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Electricity total</label>
    <input
      type="number"
      step="0.01"
      name="electricity_total"
      value={formData.electricity_total}
      onChange={handleInputChange}
      placeholder="1600"
      readOnly
      className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
    />
    <span className="text-xs text-gray-500 mt-1">Price: 8 THB/unit</span>
  </div>


              
        
              
            </div>
          </div>
          {/* final info block */}
          <div className='flex gap-4 bg-gray-100 p-4 rounded-lg'>
            <p>💰</p>
            {/* inputs block */}
            <div className='flex gap-4 flex-wrap'>
            <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Total amount</label>
    <input
      type="number"
      step="0.01"
      name="amount_total"
      value={formData.amount_total}
      onChange={handleInputChange}
      placeholder="6050"
      readOnly
      className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
    />
  </div>

  <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Amount before VAT</label>
    <input
      type="number"
      step="0.01"
      name="amount_before_vat"
      value={formData.amount_before_vat}
      onChange={handleInputChange}
      placeholder="6050"
      readOnly
      className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
    />
  </div>

  <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">VAT</label>
    <input
      type="number"
      step="0.01"
      name="vat"
      value={formData.vat}
      onChange={handleInputChange}
      placeholder="0"
      readOnly
      className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
    />
        <span className="text-xs text-gray-500 mt-1">7%</span>
  </div>
  


  <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700">Net total amount</label>
    <input
      type="number"
      step="0.01"
      name="amount_total_net"
      value={(parseFloat(formData.amount_before_vat || 0) + (parseFloat(formData.amount_before_vat || 0) * 0.07)).toFixed(2)}      
      onChange={handleInputChange}
      placeholder="6050"
      readOnly
      className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
    />
  </div>
      
              
            </div>
          </div>

        </div>

      <div className="flex justify-center gap-2 mt-5">
        <button 
            type="button" 
            onClick={handleClearForm}
            className="cursor-pointer hover:shadow-lg transition w-1/3 p-2 rounded bg-yellow-500 text-white"
          >
            🗑️ Clean form
          </button>
        <button
          type="button"
          onClick={handleGeneratePDF}
          disabled={isGenerating || !formData.name || !formData.room}
          className="cursor-pointer hover:shadow-lg transition w-1/3 p-2 rounded bg-green-600 text-white"
        >
          {isGenerating ? '🔄 Generating PDF...' : '🖨️ Create PDF'}
        </button>


      </div>


    </div>
  );
};

export default InvoiceGeneratorForm;
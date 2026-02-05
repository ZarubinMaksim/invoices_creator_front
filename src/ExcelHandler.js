import { useEffect, useState } from "react";

const SERVER_URL = "http://38.244.150.204:4000";
// const SERVER_URL = "http://localhost:3000";

const ExcelHandler = ({ data }) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAllDeposit, setSelectAllDeposit] = useState(false);
  const [selectAllPaid, setSelectAllPaid] = useState(false);
  const [selectAllOthers, setSelectAllOthers] = useState(false);
  const [tableData, setTableData] = useState(data);

  // Фильтрованные данные для каждой таблицы
  const withDepositData = tableData.filter(row => parseFloat(row.deposit) >= parseFloat(row.amount_total));
  const paidData = tableData.filter(row => row.isPaid === 'PAID' && parseFloat(row.deposit) < parseFloat(row.amount_total));
  const othersData = tableData.filter(row => row.isPaid !== 'PAID' && parseFloat(row.deposit) < parseFloat(row.amount_total));

  const handleMessage = (row) => {
    const dateObjText = new Date(row.date_from.split("/").reverse().join("-"));
    dateObjText.setMonth(dateObjText.getMonth() + 1);
    const monthNameText = dateObjText.toLocaleString("en-US", { month: "long" });
    const yearText = dateObjText.getFullYear();
    return `Dear ${row.name},

Good afternoon from Juristic Condominium,
I hope this message finds you well.
    
We are writing to inform you that the invoice for the utility charges related to your condominium unit has been issued. 
The invoice includes a detailed breakdown of the charges for the specified billing period, and the payment due date is 12 ${monthNameText} ${yearText}
Once you have made the payment, please send us the payment slip. 
Via email to : juristic@lagreenhotel.com  
or via by WhatsApp no. +66924633222
    
Should you have any questions or require clarification regarding the invoice, please do not hesitate to contact us. 
We are here to assist you and ensure that all your inquiries are promptly addressed.

Thank you for your attention to this matter. Have a good day.

Best regards,
Sumolthip Kraisuwan 
Assistant of Juristic Person Manager`
  }

  // Обработчик чекбокса с учетом типа таблицы
  const handleCheckboxChange = (originalIndex) => {
    setSelectedRows((prev) =>
      prev.includes(originalIndex)
        ? prev.filter((i) => i !== originalIndex)
        : [...prev, originalIndex]
    );
  };

  // Выбор всех в таблице "With Deposit"
  const handleSelectAllDeposit = () => {
    const depositIndexes = withDepositData.map(row => 
      tableData.findIndex(item => item === row)
    );
    
    if (selectAllDeposit) {
      setSelectedRows(prev => prev.filter(index => !depositIndexes.includes(index)));
    } else {
      setSelectedRows(prev => [...new Set([...prev, ...depositIndexes])]);
    }
    setSelectAllDeposit(!selectAllDeposit);
  };

  // Выбор всех в таблице "Paid"
  const handleSelectAllPaid = () => {
    const paidIndexes = paidData.map(row => 
      tableData.findIndex(item => item === row)
    );
    
    if (selectAllPaid) {
      setSelectedRows(prev => prev.filter(index => !paidIndexes.includes(index)));
    } else {
      setSelectedRows(prev => [...new Set([...prev, ...paidIndexes])]);
    }
    setSelectAllPaid(!selectAllPaid);
  };

  // Выбор всех в таблице "Others"
  const handleSelectAllOthers = () => {
    const othersIndexes = othersData.map(row => 
      tableData.findIndex(item => item === row)
    );
    
    if (selectAllOthers) {
      setSelectedRows(prev => prev.filter(index => !othersIndexes.includes(index)));
    } else {
      setSelectedRows(prev => [...new Set([...prev, ...othersIndexes])]);
    }
    setSelectAllOthers(!selectAllOthers);
  };

  // Синхронизация состояний "Выбрать все" при изменении selectedRows
  useEffect(() => {
    // Проверяем, все ли строки в таблице With Deposit выбраны
    const depositIndexes = withDepositData.map(row => 
      tableData.findIndex(item => item === row)
    );
    const allDepositSelected = depositIndexes.length > 0 && 
      depositIndexes.every(index => selectedRows.includes(index));
    setSelectAllDeposit(allDepositSelected);

    // Проверяем, все ли строки в таблице Paid выбраны
    const paidIndexes = paidData.map(row => 
      tableData.findIndex(item => item === row)
    );
    const allPaidSelected = paidIndexes.length > 0 && 
      paidIndexes.every(index => selectedRows.includes(index));
    setSelectAllPaid(allPaidSelected);

    // Проверяем, все ли строки в таблице Others выбраны
    const othersIndexes = othersData.map(row => 
      tableData.findIndex(item => item === row)
    );
    const allOthersSelected = othersIndexes.length > 0 && 
      othersIndexes.every(index => selectedRows.includes(index));
    setSelectAllOthers(allOthersSelected);
  }, [selectedRows, tableData, withDepositData, paidData, othersData]);

  useEffect(() => {
    if (!data) return;
  
    const rowsToSelect = data
      .map((row, index) => {
        const total = parseFloat(row.amount_total) || 0;
        const deposit = parseFloat(row.deposit) || 0;
        const isPaid = (row.isPaid || "").trim().toUpperCase();
  
        if (deposit < total && isPaid !== "PAID") {
          return index;
        }
        return null;
      })
      .filter((i) => i !== null);
  
    setSelectedRows(rowsToSelect);
  }, [data]);

  const downloadSelected = async () => {
    const selectedPdfUrls = selectedRows
      .map((i) => tableData[i].pdfUrl)
      .filter((url) => url);

    if (!selectedPdfUrls.length) return alert("Please choose at least one file");

    try {
      const response = await fetch(`${SERVER_URL}/download-selected`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfUrls: selectedPdfUrls }),
      });

      if (!response.ok) throw new Error("Ошибка сервера при скачивании");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `selected_invoices_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Can not download ZIP");
    }
  };

  const sendSelectedEmails = async () => {
    if (!selectedRows.length) return alert("Choose at least one invoice");
  
    for (const i of selectedRows) {
      setTableData(prev =>
        prev.map((row, index) =>
          index === i ? { ...row, emailStatus: "sending" } : row
        )
      );
  
      const rowToSend = {
        id: i,
        room: tableData[i].room,
        name: tableData[i].name,
        email: tableData[i].email,
        pdf: tableData[i].pdfUrl,
        date: tableData[i].date_from
      };
  
      try {
        const res = await fetch(`${SERVER_URL}/send-emails`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: [rowToSend] }),
        });
        const result = await res.json();
  
        const status = result.results[0]?.status || "error";
        setTableData(prev =>
          prev.map((row, index) =>
            index === i ? { ...row, emailStatus: status } : row
          )
        );
      } catch (err) {
        console.error(err);
        setTableData(prev =>
          prev.map((row, index) =>
            index === i ? { ...row, emailStatus: "error" } : row
          )
        );
      }
    }
  };

  // Вспомогательная функция для получения оригинального индекса
  const getOriginalIndex = (row, filteredData) => {
    return tableData.findIndex(item => item === row);
  };

  return (
    <div className="mt-4 flex flex-col">
      <div className="flex gap-3 items-center mb-3 flex-shrink-0">
        <button onClick={downloadSelected} className="bg-blue-500 text-white px-4 py-2 rounded">
          Download selected        
        </button>
        <button onClick={sendSelectedEmails} className="bg-green-500 text-white px-4 py-2 rounded">
          Email selected
        </button>
      </div>

      <div className="flex-1 overflow-auto space-y-6">
        {/* Таблица 1 — с депозитом */}
        {withDepositData.length > 0 && (
          <div>
            <h2 className="font-bold mb-2">With Deposit</h2>
            <div className="overflow-auto border border-gray-300 rounded-lg">
              <table className="w-full text-sm min-w-max">
                <thead className="sticky top-0 z-10 bg-gray-100">
                  <tr>
                    <th className="border px-1 py-1 text-center w-8">
                      <input 
                        type="checkbox" 
                        checked={selectAllDeposit} 
                        onChange={handleSelectAllDeposit} 
                        className="w-4 h-4" 
                      />
                    </th>
                    <th className="border px-1 py-1 w-8">Room</th>
                    <th className="border px-1 py-1 w-8">Name</th>
                    <th className="border px-1 py-1 w-8">Email</th>
                    <th className="border px-1 py-1 w-8">Phone</th>
                    <th className="border px-1 py-1 w-8">Water</th>
                    <th className="border px-1 py-1 w-8">Elec</th>
                    <th className="border px-1 py-1 w-8">Total</th>
                    <th className="border px-1 py-1 w-8">Deposit</th>
                    <th className="border px-1 py-1 w-8">Payment</th>
                    <th className="border px-1 py-1 w-8">PDF status</th>
                    <th className="border px-1 py-1 w-8">Email status</th>
                    <th className="border px-1 py-1 w-8">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {withDepositData.map((row, localIndex) => {
                    const originalIndex = getOriginalIndex(row, withDepositData);
                    return (
                      <tr key={originalIndex} onClick={() => handleCheckboxChange(originalIndex)} className="hover:bg-green-100 cursor-pointer">
                        <td className="border px-2 py-1 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedRows.includes(originalIndex)} 
                            onChange={() => {}} // Пустой обработчик, т.к. клик на строке
                          />
                        </td>
                        <td className="border px-2 py-1">{row.room}</td>
                        <td className="border px-2 py-1">{row.name}</td>
                        <td className="border px-2 py-1">{row.email}</td>
                        <td className="border px-2 py-1">
                          {row.phone === 'no' ? 'No' : (
                            <a
                              href={`https://web.whatsapp.com/send?phone=${row.phone.replace(/\D/g, "")}&text=${encodeURIComponent(handleMessage(row))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {row.phone}
                            </a>
                          )}
                        </td>
                        <td className="border px-2 py-1 text-right">{row.water_total}</td>
                        <td className="border px-2 py-1 text-right">{row.electricity_total}</td>
                        <td className="border px-2 py-1 text-right">{row.amount_total}</td>
                        <td className="border px-2 py-1 text-right bg-green-200">{row.deposit}</td>
                        <td className="border px-2 py-1 text-right font-bold">{row.isPaid}</td>
                        <td className={`border px-2 py-1 text-center font-bold ${row.status === "success" ? "bg-green-200" : "bg-red-100"}`}>
                          {row.status === "success" ? "SUCCESS" : "ERROR"}
                        </td>
                        <td className={`border px-2 py-1 text-center font-bold ${row.emailStatus === "success" ? "bg-green-200" : row.emailStatus === "error" ? "text-red-600" : row.emailStatus === "sending" ? "bg-yellow-100" : "text-gray-400"}`}>
                          {row.emailStatus === "success" ? "Send" : row.emailStatus === "error" ? "Error" : row.emailStatus === "sending" ? "Sending..." : "—"}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {row.pdfUrl ? (
                            <a href={`${SERVER_URL}${row.pdfUrl}`} target="_blank" rel="noreferrer" className="text-blue-500 underline" onClick={(e) => e.stopPropagation()}>
                              Download
                            </a>
                          ) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Таблица 2 — оплаченные */}
        {paidData.length > 0 && (
          <div>
            <h2 className="font-bold mb-2">Paid</h2>
            <div className="overflow-auto border border-gray-300 rounded-lg">
              <table className="w-full text-sm min-w-max">
                <thead className="sticky top-0 z-10 bg-gray-100">
                  <tr>
                    <th className="border px-1 py-1 text-center w-8">
                      <input 
                        type="checkbox" 
                        checked={selectAllPaid} 
                        onChange={handleSelectAllPaid} 
                        className="w-4 h-4" 
                      />
                    </th>
                    <th className="border px-1 py-1 w-8">Room</th>
                    <th className="border px-1 py-1 w-8">Name</th>
                    <th className="border px-1 py-1 w-8">Email</th>
                    <th className="border px-1 py-1 w-8">Phone</th>
                    <th className="border px-1 py-1 w-8">Water</th>
                    <th className="border px-1 py-1 w-8">Elec</th>
                    <th className="border px-1 py-1 w-8">Total</th>
                    <th className="border px-1 py-1 w-8">Deposit</th>
                    <th className="border px-1 py-1 w-8">Payment</th>
                    <th className="border px-1 py-1 w-8">PDF status</th>
                    <th className="border px-1 py-1 w-8">Email status</th>
                    <th className="border px-1 py-1 w-8">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {paidData.map((row, localIndex) => {
                    const originalIndex = getOriginalIndex(row, paidData);
                    return (
                      <tr key={originalIndex} onClick={() => handleCheckboxChange(originalIndex)} className="hover:bg-green-100 cursor-pointer">
                        <td className="border px-2 py-1 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedRows.includes(originalIndex)} 
                            onChange={() => {}}
                          />
                        </td>
                        <td className="border px-2 py-1">{row.room}</td>
                        <td className="border px-2 py-1">{row.name}</td>
                        <td className="border px-2 py-1">{row.email}</td>
                        <td className="border px-2 py-1">
                          {row.phone === 'no' ? 'No' : (
                            <a
                              href={`https://web.whatsapp.com/send?phone=${row.phone.replace(/\D/g, "")}&text=${encodeURIComponent(handleMessage(row))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {row.phone}
                            </a>
                          )}
                        </td>
                        <td className="border px-2 py-1 text-right">{row.water_total}</td>
                        <td className="border px-2 py-1 text-right">{row.electricity_total}</td>
                        <td className="border px-2 py-1 text-right">{row.amount_total}</td>
                        <td className="border px-2 py-1 text-right">{row.deposit}</td>
                        <td className="border px-2 py-1 text-right font-bold">{row.isPaid}</td>
                        <td className={`border px-2 py-1 text-center font-bold ${row.status === "success" ? "bg-green-200" : "bg-red-100"}`}>
                          {row.status === "success" ? "SUCCESS" : "ERROR"}
                        </td>
                        <td className={`border px-2 py-1 text-center font-bold ${row.emailStatus === "success" ? "bg-green-200" : row.emailStatus === "error" ? "text-red-600" : row.emailStatus === "sending" ? "bg-yellow-100" : "text-gray-400"}`}>
                          {row.emailStatus === "success" ? "Send" : row.emailStatus === "error" ? "Error" : row.emailStatus === "sending" ? "Sending..." : "—"}
                        </td>
                        <td className="border px-2 py-1 text-center">{row.pdfUrl ? (
                          <a href={`${SERVER_URL}${row.pdfUrl}`} target="_blank" rel="noreferrer" className="text-blue-500 underline">
                            Download
                          </a>
                        ) : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Таблица 3 — остальные */}
        {othersData.length > 0 && (
          <div>
            <h2 className="font-bold mb-2">Others</h2>
            <div className="overflow-auto border border-gray-300 rounded-lg">
              <table className="w-full text-sm min-w-max">
                <thead className="sticky top-0 z-10 bg-gray-100">
                  <tr>
                    <th className="border px-1 py-1 text-center w-8">
                      <input 
                        type="checkbox" 
                        checked={selectAllOthers} 
                        onChange={handleSelectAllOthers} 
                        className="w-4 h-4" 
                      />
                    </th>
                    <th className="border px-1 py-1 w-8">Room</th>
                    <th className="border px-1 py-1 w-8">Name</th>
                    <th className="border px-1 py-1 w-8">Email</th>
                    <th className="border px-1 py-1 w-8">Phone</th>
                    <th className="border px-1 py-1 w-8">Water</th>
                    <th className="border px-1 py-1 w-8">Elec</th>
                    <th className="border px-1 py-1 w-8">Total</th>
                    <th className="border px-1 py-1 w-8">Deposit</th>
                    <th className="border px-1 py-1 w-8">Payment</th>
                    <th className="border px-1 py-1 w-8">PDF status</th>
                    <th className="border px-1 py-1 w-8">Email status</th>
                    <th className="border px-1 py-1 w-8">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {othersData.map((row, localIndex) => {
                    const originalIndex = getOriginalIndex(row, othersData);
                    return (
                      <tr key={originalIndex} onClick={() => handleCheckboxChange(originalIndex)} className="hover:bg-green-200 cursor-pointer hover:bg-green-100">
                        <td className="border px-2 py-1 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedRows.includes(originalIndex)} 
                            onChange={() => {}}
                          />
                        </td>
                        <td className="border px-2 py-1">{row.room}</td>
                        <td className="border px-2 py-1">{row.name}</td>
                        <td className="border px-2 py-1">{row.email}</td>
                        <td className="border px-2 py-1">
  {!row.phone || row.phone === 'no' || typeof row.phone !== 'string' ? 'No' : (
    <a
      href={`https://web.whatsapp.com/send?phone=${row.phone.replace(/\D/g, "")}&text=${encodeURIComponent(handleMessage(row))}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {row.phone}
    </a>
  )}
</td>
                        <td className="border px-2 py-1 text-right">{row.water_total}</td>
                        <td className="border px-2 py-1 text-right">{row.electricity_total}</td>
                        <td className="border px-2 py-1 text-right">{row.amount_total}</td>
                        <td className="border px-2 py-1 text-right">{row.deposit}</td>
                        <td className="border px-2 py-1 text-right font-bold">{row.isPaid}</td>
                        <td className={`border px-2 py-1 text-center font-bold ${row.status === "success" ? "bg-green-200" : "bg-red-100"}`}>
                          {row.status === "success" ? "SUCCESS" : "ERROR"}
                        </td>
                        <td className={`border px-2 py-1 text-center font-bold ${row.emailStatus === "success" ? "bg-green-200" : row.emailStatus === "error" ? "text-red-600" : row.emailStatus === "sending" ? "bg-yellow-100" : "text-gray-400"}`}>
                          {row.emailStatus === "success" ? "Send" : row.emailStatus === "error" ? "Error" : row.emailStatus === "sending" ? "Sending..." : "—"}
                        </td>
                        <td className="border px-2 py-1 text-center">{row.pdfUrl ? (
                          <a href={`${SERVER_URL}${row.pdfUrl}`} target="_blank" rel="noreferrer" className="text-blue-500 underline">
                            Download
                          </a>
                        ) : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelHandler;
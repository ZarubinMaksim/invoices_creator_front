import { useEffect, useState } from "react";
import { Copy } from "lucide-react";

const SERVER_URL = "http://38.244.150.204:4000";

const ExcelHandler = ({ data }) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [tableData, setTableData] = useState(data); // локальная копия с обновляемыми статусами

  const handleMessage = (row) => {
    // --- месяц для текста письма (следующий месяц)
    console.log(row)
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

  //клие по чекбоку
  const handleCheckboxChange = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  //при монтировании компонента не проставлять чекбокс на депозит больше тотал
  useEffect(() => {
    if (!data) return;
  
    const rowsToSelect = data
      .map((row, index) => {
        const total = parseFloat(row.amount_total) || 0;
        const deposit = parseFloat(row.deposit) || 0;
        const isPaid = (row.isPaid || "").trim().toUpperCase();
  
        // Условие: депозит меньше суммы И НЕ оплачено
        if (deposit < total && isPaid !== "PAID") {
          return index;
        }
        return null;
      })
      .filter((i) => i !== null);
  
    setSelectedRows(rowsToSelect);
  }, [data]);
  
  

  //чекбокс выбрать все
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(tableData.map((_, index) => index));
    }
    setSelectAll(!selectAll);
  };

  //скачать выбранные
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

  //отправить на почту
  const sendSelectedEmails = async () => {
    if (!selectedRows.length) return alert("Choose at least one invoice");
  
    for (const i of selectedRows) {
      // Ставим статус "sending"
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
          body: JSON.stringify({ rows: [rowToSend] }), // отправляем по одной строке
        });
        const result = await res.json();
  
        // Обновляем статус после отправки
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
  
console.log(tableData)
return (
  <div className="mt-4 flex flex-col h-[calc(100vh-100px)]"> {/* ← Главный контейнер */}
    
    {/* Кнопки */}
    <div className="flex gap-3 items-center mb-3 flex-shrink-0"> {/* ← flex-shrink-0 чтобы не сжимались */}
      <button onClick={downloadSelected} className="bg-blue-500 text-white px-4 py-2 rounded">
        Download selected        
      </button>
      <button onClick={sendSelectedEmails} className="bg-green-500 text-white px-4 py-2 rounded">
        Email selected
      </button>
    </div>

    {/* Контейнер таблицы с скроллом */}
    <div className="flex-1 overflow-auto border border-gray-300 rounded-lg"> {/* ← flex-1 занимает оставшееся пространство */}
      <table className="w-full text-sm min-w-max"> {/* ← min-w-max чтобы таблица не сжималась */}
      <thead className="sticky top-0 z-10">
  <tr className="bg-gray-100">
    <th className="border px-1 py-1 text-center sticky top-0 bg-gray-100 w-8"> {/* ← уменьшил ширину */}
      {" "}
      <input
        type="checkbox"
        checked={selectAll}
        onChange={handleSelectAll}
        className="w-4 h-4"
      />
    </th>
    {/* <th className="border px-1 py-1 sticky top-0 bg-gray-100 w-8">№</th>  */}
    <th className="border px-1 py-1 sticky top-0 bg-gray-100 w-8">Room</th>
    <th className="border px-1 py-1 sticky top-0 bg-gray-100 w-8">Name</th> {/* ← уже */}
    <th className="border px-1 py-1 sticky top-0 bg-gray-100 w-8">Email</th> {/* ← уже */}
    <th className="border px-1 py-1 sticky top-0 bg-gray-100 w-8">Phone</th> {/* ← уже */}
    <th className="border px-1 py-1 sticky top-0 bg-gray-100 w-8">Water</th>
    <th className="border px-1 py-1 sticky top-0 bg-gray-100 w-8">Elec</th>
    <th className="border px-1 py-1 sticky top-0 bg-gray-100 w-8">Total</th>
    <th className="border px-1 py-1 sticky top-0 bg-gray-100 w-8">Deposit</th>
    <th className="border px-1 py-1 sticky top-0 bg-gray-100 w-8">Payment</th>
    <th className="border px-1 py-1 sticky top-0 bg-gray-100 w-8">PDF status</th>
    <th className="border px-1 py-1 sticky top-0 bg-gray-100 w-8">Email status</th>
    <th className="border px-1 py-1 sticky top-0 bg-gray-100 w-8">PDF</th>
  </tr>
</thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index} onClick={() => handleCheckboxChange(index)} className={`hover:bg-green-200 hover:shadow-lg cursor-pointer ${row.isPaid === 'PAID' || row.deposit > row.amount_total ? 'bg-green-200 opacity-40 hover:opacity-100' : ''}`}>
              <td className="border px-2 py-1 text-center">
                <input type="checkbox" checked={selectedRows.includes(index)} />
              </td>
              {/* <td className="border px-2 py-1 text-center">{index + 1}</td> */}
              <td className="border px-2 py-1">{row.room}</td>
              <td className="border px-2 py-1">{row.name}</td>
              <td className="border px-2 py-1">{row.email}</td>
              <td className="border px-2 py-1">
                {row.phone === 'no' ? ('No') : (
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

                {row.phone !== 'no' && row.phone ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(row.phone.replace(/\D/g, ""))
                    }}
                    className="p-1 rounded hover:bg-green-300 ml-1 opacity-50 hover:opacity-100"
                    title="Copy phone"
                  >
                    <Copy size={16} />
                  </button>
                ) : (null)}
              </td>
              <td className="border px-2 py-1 text-right">{row.water_total}</td>
              <td className="border px-2 py-1 text-right">{row.electricity_total}</td>
              <td className="border px-2 py-1 text-right">{row.amount_total}</td>
              <td className={`border px-2 py-1 text-right ${parseFloat(row.deposit) >= parseFloat(row.amount_total) ? 'bg-green-200' : ''}`}>{row.deposit}</td>
              <td className={`border px-2 py-1 text-right font-bold ${row.isPaid === 'PAID' ? 'bg-green-200' : ''}`}>{row.isPaid}</td>
              <td className={`border px-2 py-1 text-center font-bold ${row.status === "success" ? "bg-green-200" : "bg-red-100"}`}>
                {row.status === "success" ? "SUCCESS" : "ERROR"}
              </td>
              <td className={`border px-2 py-1 text-center font-bold ${row.emailStatus === "success" ? "bg-green-200" : row.emailStatus === "error" ? "text-red-600" : row.emailStatus === "sending" ? "bg-yellow-100" : "text-gray-400"}`} >
                {row.emailStatus === "success"
                  ? "Send"
                  : row.emailStatus === "error"
                  ? "Error"
                  : row.emailStatus === "sending"
                  ? "Sending..."
                  : "—"}
              </td>
              <td className="border px-2 py-1 text-center">
                {row.pdfUrl ? (
                  <a href={`${SERVER_URL}${row.pdfUrl}`} target="_blank" rel="noreferrer" className="text-blue-500 underline" onClick={(e) => e.stopPropagation()}>
                    Download
                  </a>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
};

export default ExcelHandler;

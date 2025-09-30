export const sendSelectedEmails = async (selectedRows, tableData, SERVER_URL, setTableData) => {
  if (!selectedRows.length) return alert("Выберите хотя бы один счет");

  const rowsToSend = selectedRows.map(i => ({
    id: i,
    room: tableData[i].room,
    name: tableData[i].name,
    email: tableData[i].email,
    pdf: tableData[i].pdfUrl,
  }));

  try {
    const res = await fetch(`${SERVER_URL}/send-emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: rowsToSend }),
    });

    const result = await res.json();

    setTableData(prev =>
      prev.map((row, index) => {
        const updated = result.results.find(r => r.id === index);
        return updated ? { ...row, emailStatus: updated.status } : row;
      })
    );
  } catch (err) {
    console.error(err);
    alert("Ошибка при отправке писем");
  }
};
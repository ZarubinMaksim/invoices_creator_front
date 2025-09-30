export const downloadSelected = async (selectedRows, tableData, SERVER_URL) => {
  const selectedPdfUrls = selectedRows
    .map((i) => tableData[i].pdfUrl)
    .filter((url) => url);

  if (!selectedPdfUrls.length) return alert("Нет выбранных файлов");

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
    alert("Не удалось скачать ZIP");
  }
};
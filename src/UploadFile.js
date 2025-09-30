import { useState, useEffect } from "react";
import ExcelHandler from "./ExcelHandler";

const UploadFile = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("File did not choose");
  const [rowList, setRowList] = useState();
  const [serverLogs, setServerLogs] = useState(['Uploading...']); // сюда будем собирать логи с сервера
  const [isUploadClicked, setIsUploadClicked] = useState(false)
  const [finishRendering, setFinishRendering] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setFileName(event.target.files[0].name)
  };

  const handleUpload = async () => {
    if (!file) return alert("Choose a file to upload");
    setIsUploadClicked(true)
    const formData = new FormData();
    formData.append("excel", file);

    try {
      const response = await fetch("http://38.244.150.204:4000/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        console.log("Файл успешно загружен на сервер!");
      } else {
        console.log("Ошибка при загрузке файла");
        return;
      }

      const data = await response.json();
      setRowList(data.results);
      setFinishRendering(true);  // <-- рендерим ExcelHandler после успешного ответа
    } catch (error) {
      console.error("Ошибка при подключении к серверу", error);
    }
  };

  useEffect(() => {
    // создаём SSE соединение с сервером для логов
    const evtSource = new EventSource("http://38.244.150.204:4000/events");

    evtSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      // if (data.message.includes("Finished. Successfull")) {
      //   setFinishRendering(true)
      // }
      setServerLogs([data.message]);
    };

    evtSource.onerror = () => {
      evtSource.close();
    };

    return () => evtSource.close(); // закрываем при размонтировании
  }, []);


  return (
    <>
      {!isUploadClicked ? (
        // Блок с инпутом
        <div className="flex flex-col w-3/5 p-5 gap-5 items-center">
          <div className="flex items-center gap-3 p-2 rounded-full bg-gray-100 shadow-inner w-full">
            {/* Скрытый input */}
            <input
              type="file"
              accept=".xlsx, .xls"
              id="file-upload"
              onChange={handleFileChange}
              className="hidden"
            />
  
            {/* Кастомная кнопка */}
            <label htmlFor="file-upload" className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition">
              Choose a file
            </label>
  
            {/* Текст рядом */}
            <span className="text-gray-600">{fileName}</span>
          </div>
  
          <button onClick={handleUpload} className="bg-gray-200 text-gray-600 hover:bg-green-700 hover:text-white hover:shadow-inner transition shadow-lg text-white px-4 py-2 rounded-full w-1/4">
            Upload
          </button>
        </div>
      ) : finishRendering ? (
        // Когда рендеринг завершён
        rowList && <ExcelHandler data={rowList} />
      ) : (
        // Когда ещё идёт процесс (логи)
        <div className="p-2 text-lg overflow-y-auto w-full h-20 flex justify-center items-center">
          {serverLogs.map((log, idx) => (
            <div key={idx}>{log}</div>
          ))}
        </div>
      )}
    </>
  );
};

export default UploadFile;
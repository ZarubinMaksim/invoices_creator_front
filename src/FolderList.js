import { useEffect, useState } from "react";
import openFolderImg from "../src/images/open-folder.png";
import closedFolderImg from "../src/images/folder.png";

const SERVER_URL = "http://38.244.150.204:4000";

const FolderList = () => {
  const [foldersList, setFoldersList] = useState([]);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  

  useEffect(() => {
    fetchFolders();
  }, []);

  // 🔹 Получаем список папок
  const fetchFolders = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/saved-pdf-folders`);
      const data = await response.json();
      setFoldersList(data.folders);
    } catch (error) {
      console.error("Ошибка при подключении к серверу", error);
    }
  };

  // 🔹 Клик по папке
  const handleFolderClick = async (folderName) => {
    // если клик по уже открытой папке — закрываем
    if (selectedFolder === folderName) {
      setSelectedFolder(null);
      setPdfFiles([]);
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/getAllPdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName }),
      });

      const data = await response.json();
      setPdfFiles(data.files);
      setSelectedFolder(folderName);

    } catch (error) {
      console.error("Ошибка при подключении к серверу", error);
    }
  };

  return (
    <div className="w-3/5 border-b border-gray-200 p-5">
    <div className="flex flex-col gap-5 max-h-[70vh] p-4 bg-gray-100 rounded-lg items-center">
      {/* 📁 ПАПКИ */}
      <div className="flex gap-6">
        {foldersList.map((folderName) => {
          const isOpen = selectedFolder === folderName;

          return (
            <div
              key={folderName}
              className="flex flex-col items-center justify-center cursor-pointer"
              onClick={() => handleFolderClick(folderName)}
            >
              <img
                className="w-20 transition"
                src={isOpen ? openFolderImg : closedFolderImg}
                alt="folder"
              />
              <p className={isOpen ? "font-semibold" : ""}>
                {folderName}
              </p>
            </div>
          );
        })}
      </div>

      {/* 📄 PDF СПИСОК */}
      {selectedFolder && (
        <div className="flex-1 overflow-y-auto mt-4 pr-2">
          <div className="flex flex-col gap-3">
            {pdfFiles.map((pdf) => (
              
              <div
                key={pdf.name}
                className="flex items-center justify-between border-b border-green-600 p-3 cursor-pointer hover:border-white hover:bg-white hover:rounded-lg"
              >

                <span className="truncate w-3/4">{pdf.name}</span>

                <a
                  href={`${SERVER_URL}${pdf.url}`}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Скачать
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
    </div>
  );
};

export default FolderList;

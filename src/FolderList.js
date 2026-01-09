import { useEffect, useState } from "react";
import folderImg from '../src/images/open-folder.png'
const FolderList = () => {
  const SERVER_URL = "http://38.244.150.204:4000";




  const [foldersList, setFoldersList] = useState([])
  const [pdfFiles, setPdfFiles] = useState([]);
  const [isFolderClicked, setIsFolderClicked] = useState(false)

  useEffect(() => {
    getDataFromServer()
  }, [])

  const getDataFromServer = async () => {
    console.log('CLICK');
    try {
      const response = await fetch("http://38.244.150.204:4000/saved-pdf-folders", {
        method: "GET",
      });
      const data = await response.json();
      setFoldersList(data.folders)
      console.log(foldersList)
    } catch (error) {
      console.error("Ошибка при подключении к серверу", error);
    }
  };

  const getAllPdf = async (folderName) => {
    try {
      const response = await fetch("http://38.244.150.204:4000/getAllPdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName }),
      });
  
      const data = await response.json();
      setPdfFiles(data.files);
      setIsFolderClicked(true)
  
    } catch (error) {
      console.error("Ошибка при подключении к серверу", error);
    }
  };

  return(
    <div className="border-2 border-black w-9/12 flex gap-5">
      {foldersList.map((folderName) => {
        return(
          <div className="flex flex-col items-center justify-center cursor-pointer" onClick={() => getAllPdf(folderName)}>
            <img className="w-20" src={folderImg} alt="folder" />
            <p>{folderName}</p>
          </div>
        )
      })}
      {isFolderClicked ? (
        <div className="flex flex-col gap-3 mt-6">
  {pdfFiles.map((pdf) => (
    <div
      key={pdf.name}
      className="flex items-center justify-between border p-3 rounded"
    >
      <span className="truncate w-3/4">{pdf.name}</span>

      <a
        href={`http://38.244.150.204:4000${pdf.url}`}
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
      ) : (
        null
      )}




    </div>



  )
}

export default FolderList;
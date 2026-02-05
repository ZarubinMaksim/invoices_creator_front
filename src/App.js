import React from "react";
import FolderList from "./FolderList";
import InvoiceGeneratorForm from "./testing";
import UploadFile from "./UploadFile";

function App() {

//СДЕЛАТЬ
//ссл
//попробовать вотсап
//получить доступ к паролю почты

  return (
    <div className="h-auto flex flex-col justify-center items-center gap-10 pt-40 pb-20">
      <UploadFile />
      <FolderList />
      <InvoiceGeneratorForm />
    </div>
  );
}

export default App;

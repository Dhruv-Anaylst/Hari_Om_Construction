(function(){
  "use strict";
  var content=document.getElementById("office-content");
  var libraryPromise=null;
  var previewUrl=null;

  function selectedFiles(){
    var input=content.querySelector("#pdf-files");
    return input?Array.prototype.slice.call(input.files||[]):[];
  }
  function setStatus(message,kind){
    var status=content.querySelector("#pdf-status");
    if(!status)return;
    status.textContent=message;
    status.setAttribute("data-kind",kind||"info");
  }
  function safeName(value){
    return String(value||"document").replace(/\.pdf$/i,"").replace(/[^a-z0-9_-]+/gi,"-").replace(/^-+|-+$/g,"").slice(0,60)||"document";
  }
  function fileSize(bytes){
    if(bytes>=1024*1024)return (bytes/(1024*1024)).toFixed(1)+" MB";
    return Math.max(1,Math.round(bytes/1024))+" KB";
  }
  function updateSelection(){
    var files=selectedFiles();
    var list=content.querySelector("#pdf-file-list");
    var frame=content.querySelector("#pdf-preview");
    var empty=content.querySelector("#pdf-preview-empty");
    var name=content.querySelector("#pdf-preview-name");
    var buttons=content.querySelectorAll("[data-pdf-action]");
    if(list){
      list.textContent="";
      if(!files.length){
        var none=document.createElement("strong");none.textContent="No PDFs selected";
        var hint=document.createElement("small");hint.textContent="Choose files to see their names and sizes here.";
        list.appendChild(none);list.appendChild(hint);
      }else{
        files.forEach(function(file,index){
          var row=document.createElement("div");row.className="pdf-file-row";
          var label=document.createElement("span");label.textContent=(index+1)+". "+file.name;
          var size=document.createElement("small");size.textContent=fileSize(file.size);
          row.appendChild(label);row.appendChild(size);list.appendChild(row);
        });
      }
    }
    buttons.forEach(function(button){button.disabled=!files.length;});
    if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}
    if(frame&&empty&&name){
      if(files.length){
        previewUrl=URL.createObjectURL(files[0]);
        frame.src=previewUrl;frame.hidden=false;empty.hidden=true;name.textContent=files[0].name;
      }else{
        frame.removeAttribute("src");frame.hidden=true;empty.hidden=false;name.textContent="No file selected";
      }
    }
    setStatus(files.length?"Ready. Files stay in this browser until you download the edited PDF.":"Choose a PDF to begin.","info");
  }
  function loadPdfLibrary(){
    if(window.PDFLib)return Promise.resolve(window.PDFLib);
    if(libraryPromise)return libraryPromise;
    libraryPromise=new Promise(function(resolve,reject){
      var script=document.createElement("script");
      script.src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js";
      script.crossOrigin="anonymous";
      script.onload=function(){if(window.PDFLib)resolve(window.PDFLib);else{libraryPromise=null;reject(new Error("The PDF library did not load."));}};
      script.onerror=function(){libraryPromise=null;reject(new Error("Could not load the PDF editor library. Check your internet connection and try again."));};
      document.head.appendChild(script);
    });
    return libraryPromise;
  }
  function downloadPdf(name,bytes){
    var url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));
    var link=document.createElement("a");
    link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(function(){URL.revokeObjectURL(url);},15000);
  }
  function parsePageRange(value,total){
    var indexes=[];
    var parts=String(value||"").split(",");
    if(!value.trim())throw new Error("Enter page numbers, for example 1, 3-5.");
    parts.forEach(function(part){
      var match=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if(!match)throw new Error("Use a page range like 1, 3-5.");
      var first=Number(match[1]),last=Number(match[2]||match[1]);
      if(first<1||last<first||last>total)throw new Error("Page numbers must be between 1 and "+total+".");
      for(var page=first;page<=last;page++)if(indexes.indexOf(page-1)<0)indexes.push(page-1);
    });
    return indexes;
  }
  async function runAction(action,button){
    var files=selectedFiles();
    if(!files.length){setStatus("Choose a PDF first.","error");return;}
    var buttons=content.querySelectorAll("[data-pdf-action]");
    buttons.forEach(function(item){item.disabled=true;});
    setStatus("Preparing your PDF in this browser…","working");
    try{
      var PDF=await loadPdfLibrary();
      var outputName="";
      var output=null;
      if(action==="merge"){
        if(files.length<2)throw new Error("Select at least two PDFs to merge.");
        output=await PDF.PDFDocument.create();
        for(var i=0;i<files.length;i++){
          var source=await PDF.PDFDocument.load(await files[i].arrayBuffer());
          var copied=await output.copyPages(source,source.getPageIndices());
          copied.forEach(function(page){output.addPage(page);});
        }
        outputName="hari-om-merged.pdf";
      }else{
        var first=files[0];
        var documentPdf=await PDF.PDFDocument.load(await first.arrayBuffer());
        var pages=documentPdf.getPages();
        if(action==="rotate"){
          pages.forEach(function(page){page.setRotation(PDF.degrees((page.getRotation().angle+90)%360));});
          output=documentPdf;outputName=safeName(first.name)+"-rotated.pdf";
        }else if(action==="stamp"){
          var text=(content.querySelector("#pdf-stamp-text")||{}).value||"";
          text=text.trim();
          if(!text)throw new Error("Enter the text you want to add to every page.");
          var font=await documentPdf.embedFont(PDF.StandardFonts.Helvetica);
          pages.forEach(function(page){
            var size=page.getSize();
            page.drawText(text,{x:32,y:28,size:12,font:font,color:PDF.rgb(.18,.36,.28),opacity:.72,maxWidth:Math.max(80,size.width-64)});
          });
          output=documentPdf;outputName=safeName(first.name)+"-stamped.pdf";
        }else if(action==="extract"){
          var range=(content.querySelector("#pdf-page-range")||{}).value||"";
          var indexes=parsePageRange(range,pages.length);
          output=await PDF.PDFDocument.create();
          var extracted=await output.copyPages(documentPdf,indexes);
          extracted.forEach(function(page){output.addPage(page);});
          outputName=safeName(first.name)+"-pages.pdf";
        }
      }
      if(!output)throw new Error("Choose a PDF action and try again.");
      downloadPdf(outputName,await output.save());
      setStatus("Done. Your edited PDF has been downloaded.","success");
    }catch(error){
      setStatus(error&&error.message?error.message:"Could not edit this PDF.","error");
    }finally{
      buttons.forEach(function(item){item.disabled=!selectedFiles().length;});
    }
  }
  content.addEventListener("change",function(event){
    if(event.target&&event.target.id==="pdf-files")updateSelection();
  });
  content.addEventListener("click",function(event){
    var button=event.target.closest("[data-pdf-action]");
    if(!button)return;
    event.preventDefault();
    runAction(button.getAttribute("data-pdf-action"),button);
  });
  window.addEventListener("pagehide",function(){if(previewUrl)URL.revokeObjectURL(previewUrl);});
})();

